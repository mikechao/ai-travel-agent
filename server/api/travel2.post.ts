import type { AIMessage, AIMessageChunk } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { isAIMessageChunk, SystemMessage } from '@langchain/core/messages'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableBranch, RunnableLambda } from '@langchain/core/runnables'
import { Annotation, Command, interrupt, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { formatDataStreamPart } from 'ai'
import consola from 'consola'
import { LocalFileCache } from 'langchain/cache/file_system'
import { z } from 'zod'
import { TravelRecommendToolKit } from '../toolkits/TravelRecommendToolKit'

export default defineLazyEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()

  const cache = await LocalFileCache.create('langchain-cache-travel')
  const modelTag = 'stream-out'
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.6,
    apiKey: runtimeConfig.openaiAPIKey,
    cache,
  })

  const embeddings = new OpenAIEmbeddings({
    apiKey: runtimeConfig.openaiAPIKey,
  })

  const travelRecommendToolKit = new TravelRecommendToolKit(model, embeddings)
  const toolsByName = new Map<string, StructuredToolInterface>()
  travelRecommendToolKit.getTools().map(tool => toolsByName.set(tool.name, tool))

  const checkpointer = PostgresSaver.fromConnString(
    runtimeConfig.postgresURL,
  )
  await checkpointer.setup()

  enum NodeNames {
    TravelAdvisor = 'travelAdvisor',
    HumanNode = 'humanNode',
    ToolNode = 'toolNode',
  }

  const AgentState = Annotation.Root({
    ...MessagesAnnotation.spec,
    sender: Annotation<string>(),
  })

  const makeAgent = (params: {
    name: string
    destinations: string[]
    systemPrompt: string
    tools: StructuredToolInterface[]
  }) => {
    return async (state: typeof AgentState.State) => {
      consola.info('message length', state.messages.length)
      const possibleDestinations = [NodeNames.ToolNode, ...params.destinations] as const
      const outputSchema = z.object({
        response: z.string().describe('A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user.'),
        goto: z.enum(possibleDestinations).describe('The next agent to call, must be one of the specified values.'),
      })

      const parser = StructuredOutputParser.fromZodSchema(outputSchema)
      const formatInstructions = parser.getFormatInstructions()
      const promptContent = `If you do not need to use a tool wrap the output in 'json' tags\n${formatInstructions}`

      const modelWithTools = model.bindTools(params.tools)

      const messages = [
        {
          role: 'system',
          content: promptContent,
        },
        {
          role: 'system',
          content: params.systemPrompt,
        },
        ...state.messages,
      ]

      const result = await modelWithTools.invoke(messages, { tags: [modelTag] })
      if (result.tool_calls && result.tool_calls.length) {
        consola.info('got to call some tools')
      }
      else {
        const response = await parser.invoke(result)
        const aiMessage = {
          role: 'assistant',
          content: response.response,
          name: params.name,
        }
        consola.info('response.goto', response.goto)
        return new Command({
          goto: response.goto,
          update: {
            messages: aiMessage,
            sender: params.name,
          },
        })
      }
    }
  }

  const travelAdvisor = makeAgent({
    name: NodeNames.TravelAdvisor,
    destinations: [NodeNames.HumanNode],
    tools: travelRecommendToolKit.getTools(),
    systemPrompt: `Your name is Pluto the pup and you are a general travel expert that can recommend travel destinations 
       based on the user's interests by using all the tools and following all the Steps 1 through 4 provided to you `
      + ` Follow these steps to use the tools to help you recommend travel destinations based on user's interest `
      + ` Step 1. Use the \'searchQueryTool\' to generate travel destinations search queries based on the user's interests, present the results of 
         this tool to the user `
      + ` Step 2. Wait for the user to select a search query `
      + ` Step 3. Use the user selected search query and the \'searchExecutionTool\' to execute travel destination search queries on the internet,
          present the results of this tool to the user `
      + ` Step 4. When the user select a title or url use the \'searchSummaryTool\' to generate a summary and present the results to the user`
      + ` Be sure to bark a lot and use dog related emojis `,
  })

  function humanNode(state: typeof AgentState.State): Command {
    consola.info('humanNode messages', state.messages.length)
    const userInput: string = interrupt('Ready for user input.')
    consola.info('userInput', userInput)
    return new Command({
      goto: state.sender,
      update: {
        messages: [
          {
            role: 'human',
            content: userInput,
          },
        ],
      },
    })
  }

  const builder = new StateGraph(AgentState)
    .addNode(NodeNames.TravelAdvisor, travelAdvisor, {
      ends: [NodeNames.HumanNode],
    })
    .addNode(NodeNames.HumanNode, humanNode, {
      ends: [NodeNames.TravelAdvisor],
    })
    .addEdge(START, NodeNames.TravelAdvisor)

  const graph = builder.compile({ checkpointer })

  return defineEventHandler(async (webEvent) => {
    const body = await readBody(webEvent)
    const { messages, sessionId } = body
    consola.info('\nReceived request sessionId', sessionId)

    const lastMessage = messages[0]
    consola.info('lastMessage', lastMessage.content)

    const initMessage = {
      messages: [
        new SystemMessage({ id: 'initMessage', name: 'initMessage', content: `Use the tools and agents you have to figure out what to ask the user.
            Introduce yourself and give the user a summary of your skills and knowledge in a list format.` }),
      ],
    }
    const input = isInitMessage(lastMessage) ? initMessage : new Command({ resume: lastMessage.content })
    const encoder = new TextEncoder()
    const config = { version: 'v2' as const, configurable: { thread_id: sessionId } }
    const tags = [modelTag]
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of graph.streamEvents(input, config, { includeTags: tags })) {
            if (event.event === 'on_chat_model_stream' && event.tags?.includes(modelTag)) {
              if (isAIMessageChunk(event.data.chunk)) {
                const aiMessageChunk = event.data.chunk as AIMessageChunk
                if (aiMessageChunk.content.length) {
                  const content = aiMessageChunk.content as string
                  // we can filter the toolChunk to exclude the {response:... but it depends on
                  // how the model tokenizes and introduces overhead
                  const part = formatDataStreamPart('text', content)
                  controller.enqueue(encoder.encode(part))
                }
              }
            }
          }
        }
        finally {
          controller.close()
        }
      },
    })
  })
})
