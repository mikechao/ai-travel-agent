import type { AIMessage, AIMessageChunk, ToolMessage } from '@langchain/core/messages'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { isAIMessageChunk, SystemMessage } from '@langchain/core/messages'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableLambda } from '@langchain/core/runnables'
import { Annotation, Command, interrupt, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { formatDataStreamPart } from 'ai'
import { consola } from 'consola'
import { LocalFileCache } from 'langchain/cache/file_system'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { NodeNames } from '~/types/enums'
import { TransferTools } from '../toolkits/TransferTools'
import { TravelRecommendToolKit } from '../toolkits/TravelRecommendToolKit'
import { WeatherToolKit } from '../toolkits/WeatherToolKit'

interface ParsedOutput {
  response: string
  goto: string
}

interface LLMOutput {
  parsedOutput: ParsedOutput
  aiMessage: AIMessage
  hasParsedOutput: boolean
}

export default defineLazyEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()

  const cache = await LocalFileCache.create('langchain-cache-travel')
  const modelTag = 'stream-out'
  const toolTag = 'tool-out'
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.6,
    apiKey: runtimeConfig.openaiAPIKey,
    cache,
  })

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: runtimeConfig.openaiAPIKey,
  })

  const transferTools = new TransferTools()
  const transferToolsByName = transferTools.getTransferToolsByName()
  const transferLocationByToolName = transferTools.getTransferLocationByToolName()

  const travelRecommendToolKit = new TravelRecommendToolKit(model, embeddings)
  const weatherToolKit = new WeatherToolKit()
  const toolsByName = new Map<string, StructuredToolInterface>()
  travelRecommendToolKit.getTools().map(tool => toolsByName.set(tool.name, tool))
  weatherToolKit.getTools().map(tool => toolsByName.set(tool.name, tool))

  const weatherToolTag = 'weather-tool'
  const toolTagsByToolName = new Map<string, string>()
  toolTagsByToolName.set(weatherToolKit.getWeatherSearchTool().name, weatherToolTag)

  const checkpointer = PostgresSaver.fromConnString(
    runtimeConfig.postgresURL,
  )
  await checkpointer.setup()

  const AgentState = Annotation.Root({
    ...MessagesAnnotation.spec,
    sender: Annotation<string>(),
  })

  function makeAgent(params: {
    name: string
    destinations: string[]
    systemPrompt: string
    tools: StructuredToolInterface[]
  }) {
    return async (state: typeof AgentState.State) => {
      consola.info(`${params.name} messages length ${state.messages.length}`)
      const possibleDestinations = ['end', ...params.destinations] as const
      const outputSchema = z.object({
        response: z.string().describe(`A human readable response to the original question or the AI's response to a tool message. Will be streamed back to the user.`),
        goto: z.enum(possibleDestinations).describe('The next agent to call, must be one of the specified values.'),
      })
      const parser = StructuredOutputParser.fromZodSchema(outputSchema)

      const modelWithTools = model.bindTools(params.tools)

      const messages = [
        {
          role: 'system',
          content: params.systemPrompt,
        },
        ...state.messages,
      ]

      const prompt = await ChatPromptTemplate.fromMessages([
        [
          'system',
          'Answer the user query. Wrap the output in `json` tags\n{format_instructions}',
        ],
        new MessagesPlaceholder('messages'),
      ]).partial({
        format_instructions: parser.getFormatInstructions(),
      })

      const handleOutput = async (output: AIMessage) => {
        const text = output.content as string
        if (text.length) {
          const pattern = /```json(.*?)```/gs
          const matches = text.match(pattern)
          if (matches && matches.length) {
            consola.debug({ tag: 'handleOutput', message: 'found json to parse' })
            const result = await parser.parse(matches[0])
            const llmOutput: LLMOutput = { hasParsedOutput: true, parsedOutput: result, aiMessage: output }
            return llmOutput
          }
          else {
            consola.debug({ tag: 'handleOutput', message: 'previous message was probably a ToolMessage, no json to parse' })
            // previous message was a ToolMessage
            const llmOutput: LLMOutput = { hasParsedOutput: true, parsedOutput: { response: text, goto: NodeNames.HumanNode }, aiMessage: output }
            return llmOutput
          }
        }
        // should be a tool call
        consola.debug({ tag: 'handleOutput', message: 'Should be tool call, AIMessage.content has no length' })
        return { hasParsedOutput: false, parsedOutput: { response: '', goto: '' }, aiMessage: output }
      }

      const chain = prompt.pipe(modelWithTools).pipe(new RunnableLambda({ func: handleOutput }))
      const result = await chain.invoke({ messages }, { tags: [modelTag] })
      if (result.hasParsedOutput) {
        const parsedOutput = result.parsedOutput
        return new Command({
          goto: parsedOutput.goto === 'end' ? NodeNames.HumanNode : parsedOutput.goto,
          update: {
            messages: {
              role: 'assistant',
              content: parsedOutput.response,
              name: params.name,
            },
            sender: params.name,
          },
        })
      }
      else {
        const aiMessage = result.aiMessage
        if (aiMessage.tool_calls && aiMessage.tool_calls.length === 1 && aiMessage.tool_calls[0].name.endsWith('Transfer')) {
          consola.debug({ tag: 'transferTool', message: 'transferTool found' })
          const toolCall = aiMessage.tool_calls[0]
          const transferTool = transferToolsByName.get(toolCall.name)
          if (!transferTool) {
            throw new Error(`transferToolsByName is missing ${toolCall.name}`)
          }
          const transferLocation = transferLocationByToolName.get(toolCall.name)
          if (!transferLocation) {
            throw new Error(`transferLocationByToolName is missing ${toolCall.name}`)
          }
          consola.debug({ tag: 'transferTool', message: `From ${params.name} To ${transferLocation}` })
          const toolMessage = await transferTool.invoke(toolCall)
          return new Command({
            goto: transferLocation,
            update: {
              messages: [aiMessage, toolMessage],
              sender: params.name,
            },
          })
        }
        const toolMessages = []
        if (aiMessage.tool_calls) {
          for (const toolCall of aiMessage.tool_calls) {
            const tool = params.tools.find(t => t.name === toolCall.name)
            if (!tool) {
              throw new Error(`tool not found! for toolCall ${toolCall}`)
            }
            const tags = [toolTag]
            const tag = toolTagsByToolName.get(tool.name)
            if (tag) {
              tags.push(tag)
            }
            const toolMessage = await tool.invoke(toolCall, { tags })
            toolMessages.push(toolMessage)
          }
        }
        return new Command({
          goto: params.name,
          update: {
            messages: [aiMessage, ...toolMessages],
            sender: 'toolCall',
          },
        })
      }
    }
  }

  const weatherAdvisor = makeAgent({
    name: NodeNames.WeatherAdvisor,
    destinations: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor],
    tools: [transferTools.getTransferToTravelAdvisor(), ...weatherToolKit.getTools()],
    systemPrompt: `Your name is Petey the Pirate and you are a travel expert that can show the user weather forecast 
    for a given destination and duration. After getting the weather forecast do not tell the user 
    the weather for each day, but tell the user what clothes to pack.  `
      + ` If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `
      + ` Then use the \'weatherForecastTool\' to get the weather `
      + 'Talk to the user like a pirate and use pirate related emojis '
      + `If you need general travel help, go to \'${NodeNames.TravelAdvisor}\' named Pluto the pup for help. `,
  })

  const travelAdvisor = makeAgent({
    name: NodeNames.TravelAdvisor,
    destinations: [NodeNames.HumanNode, NodeNames.WeatherAdvisor],
    tools: [transferTools.getTransferToWeatherAdvisor(), ...travelRecommendToolKit.getTools()],
    systemPrompt: `Your name is Pluto the pup and you are a general travel expert that can recommend travel destinations 
       based on the user's interests by using all the tools and following all the Steps 1 through 4 provided to you `
      + ` Follow these steps to use the tools to help you recommend travel destinations based on user's interest `
      + ` Step 1. Use the \'searchQueryTool\' to generate travel destinations search queries based on the user's interests, present the results of 
         this tool to the user `
      + ` Step 2. Wait for the user to select a search query `
      + ` Step 3. Use the user selected search query and the \'searchExecutionTool\' to execute travel destination search queries on the internet,
          present the results of this tool to the user `
      + ` Step 4. When the user select a title or url use the \'searchSummaryTool\' to generate a summary and present the results to the user`
      + ` Be sure to bark a lot and use dog related emojis `
      + ` If you need weather forecast and clothing to pack, ask the agent \'${NodeNames.WeatherAdvisor}\' named Petey the Pirate for help`
      + ` Feel free to mention the other agents by name, but call them your colleagues or a synonym
         like partner, coworker, buddy, associate.`,
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
      ends: [NodeNames.HumanNode, NodeNames.WeatherAdvisor],
    })
    .addNode(NodeNames.HumanNode, humanNode, {
      ends: [NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor],
    })
    .addNode(NodeNames.WeatherAdvisor, weatherAdvisor, {
      ends: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor],
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
            Introduce yourself and give the user a summary of your skills and the other agents in a list format.` }),
      ],
    }
    const input = isInitMessage(lastMessage) ? initMessage : new Command({ resume: lastMessage.content })
    const encoder = new TextEncoder()
    const config = { version: 'v2' as const, configurable: { thread_id: sessionId } }
    const tags = [modelTag, toolTag, weatherToolTag]
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
            if (event.event === 'on_tool_end' && event.tags?.includes(toolTag)) {
              if (event.data.output && (event.data.output as ToolMessage).content.length) {
                const content = (event.data.output as ToolMessage).content as string
                const id = uuidv4()
                if (event.tags.includes(weatherToolTag)) {
                  // 2 will send it to data from useChat
                  // 8 will send it to message.annotations on the client side
                  const part = `2:[{"id":"${id}","type":"weather","data":${content}}]\n`
                  controller.enqueue(part)
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
