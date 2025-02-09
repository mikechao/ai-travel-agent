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
import { HotelToolKit } from '../toolkits/HotelToolKit'
import { TransferTools } from '../toolkits/TransferTools'
import { TravelRecommendToolKit } from '../toolkits/TravelRecommendToolKit'
import { WeatherToolKit, WeatherToolTags } from '../toolkits/WeatherToolKit'

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
  const hotelToolKit = new HotelToolKit()
  const toolsByName = new Map<string, StructuredToolInterface>()
  travelRecommendToolKit.getTools().map(tool => toolsByName.set(tool.name, tool))
  weatherToolKit.getTools().map(tool => toolsByName.set(tool.name, tool))
  hotelToolKit.getTools().map(tool => toolsByName.set(tool.name, tool))
  transferTools.getTools().map(tool => toolsByName.set(tool.name, tool))

  const toolTagsByToolName = new Map<string, string>()
  weatherToolKit.getToolTags().forEach((tag, toolName) => {
    toolTagsByToolName.set(toolName, tag)
  })
  hotelToolKit.getToolTags().forEach((tag, toolName) => {
    toolTagsByToolName.set(toolName, tag)
  })

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
      const modelWithTools = model.bindTools(params.tools)

      const messages = [
        {
          role: 'system',
          content: params.systemPrompt,
        },
        ...state.messages,
      ]

      const aiMessage = await modelWithTools.invoke(messages, { tags: [modelTag] })
      if (aiMessage.tool_calls && aiMessage.tool_calls.length) {
        let transferToolGoTo = ''
        consola.debug({ tag: `${params.name}-tool`, message: `Got ${aiMessage.tool_calls.length} tool calls` })
        const toolMessages = []
        for (const toolCall of aiMessage.tool_calls) {
          const tool = toolsByName.get(toolCall.name)
          if (!tool) {
            throw new Error(`No tool for ${toolCall.name}`)
          }
          consola.debug({ tag: `${params.name}-tool`, message: `Calling tool ${tool.name}` })
          const toolMessage = await tool.invoke(toolCall)
          toolMessages.push(toolMessage)
          if (toolCall.name.endsWith('Transfer')) {
            transferToolGoTo = toolMessage.content
          }
        }
        const goto = transferToolGoTo.length ? transferToolGoTo : params.name
        consola.debug({ tag: `${params.name}-tool`, message: `goto ${goto}` })
        return new Command({
          goto,
          update: {
            messages: [aiMessage, ...toolMessages],
            sender: params.name,
          },
        })
      }
      consola.debug({ tag: `${params.name}`, message: 'going to human node' })
      return new Command({
        goto: NodeNames.HumanNode,
        update: {
          messages: [aiMessage],
          sender: params.name,
        },
      })
    }
  }

  const hotelAdvisor = makeAgent({
    name: NodeNames.HotelAdvisor,
    destinations: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor],
    tools: [...transferTools.getToolsForHotelAdvisor(), ...hotelToolKit.getTools()],
    systemPrompt: `Your name is Penny Restmore and you are a travel expert that can show the user a list of hotels locations for a given destination. `
      + ` If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `
      + ` Then Use the \'hotelSearchTool\' to get a list of hotels and then tell the users the names of the hotels only, 
          tell the user you can get more details or a summary of reviews by other humans `
      + ' The \'hotelReviewsTool\' can give you reviews provided by other people for you to summarize for the user '
      + `When talking to the user be friendly, warm and playful with a sense of humor`
      + `If you need general travel help, go to \'${NodeNames.TravelAdvisor}\' named Pluto the pup for help. `
      + `If you need weather forecast and clothing to pack, ask \'${NodeNames.WeatherAdvisor}\' named Petey the Pirate for help `
      + 'Feel free to mention other agents by name, but call them synonyms of colleagues',
  })

  const weatherAdvisor = makeAgent({
    name: NodeNames.WeatherAdvisor,
    destinations: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor],
    tools: [...transferTools.getToolsForWeatherAdvisor(), ...weatherToolKit.getTools()],
    systemPrompt: `Your name is Petey the Pirate and you are a travel expert that can show the user weather forecast 
    for a given destination and duration. After getting the weather forecast do not tell the user 
    the weather for each day, but tell the user what clothes to pack.  `
      + ` If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `
      + ` Then use the \'weatherForecastTool\' to get the weather `
      + 'Talk to the user like a pirate and use pirate related emojis '
      + `If you need general travel help, go to \'${NodeNames.TravelAdvisor}\' named Pluto the pup for help. `
      + `If you need hotel recommendations, ask \'${NodeNames.HotelAdvisor}\' named Penny Restmore for help. `,
  })

  const travelAdvisor = makeAgent({
    name: NodeNames.TravelAdvisor,
    destinations: [NodeNames.HumanNode, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor],
    tools: [...transferTools.getToolsForTravelAdvisor(), ...travelRecommendToolKit.getTools()],
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
      + ` If you need weather forecast and clothing to pack, ask the agent \'${NodeNames.WeatherAdvisor}\' named Petey the Pirate for help `
      + ` If you need hotel recommendations, ask \'${NodeNames.HotelAdvisor}\' named Penny Restmore for help. `
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
      ends: [NodeNames.HumanNode, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor],
    })
    .addNode(NodeNames.HumanNode, humanNode, {
      ends: [NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor],
    })
    .addNode(NodeNames.WeatherAdvisor, weatherAdvisor, {
      ends: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor],
    })
    .addNode(NodeNames.HotelAdvisor, hotelAdvisor, {
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
    const tags = [modelTag, toolTag, WeatherToolTags.WeatherSearch]
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
                if (event.tags.includes(WeatherToolTags.WeatherSearch)) {
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
