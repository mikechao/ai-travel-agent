import type { StructuredToolInterface } from '@langchain/core/tools'
import type { AgentName } from '~/types/constants'
import { setMaxListeners } from 'node:events'
import { SystemMessage } from '@langchain/core/messages'
import { Annotation, Command, interrupt, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { formatDataStreamPart } from 'ai'
import { consola } from 'consola'
import { LocalFileCache } from 'langchain/cache/file_system'
import { AgentNames, AgentToEmoji } from '~/types/constants'
import { NodeNames } from '~/types/enums'
import { HotelToolKit } from '../toolkits/HotelToolKit'
import { SightseeingToolKit } from '../toolkits/SightseeingToolKit'
import { TransferToolKit, TransferToolNames } from '../toolkits/TransferToolKit'
import { TravelRecommendToolKit } from '../toolkits/TravelRecommendToolKit'
import { WeatherToolKit } from '../toolkits/WeatherToolKit'
import { createStreamEventHandlers } from '../utils/streamHandlers'
import { StreamTimeoutError } from '../utils/streamTimeoutError'

interface IteratorResult {
  value: any
  done: boolean
}

export default defineLazyEventHandler(async () => {
  // set listeners to 15 to suppress warning,
  // need to figure out where it comes from
  // by using "NODE_OPTIONS='--trace-warnings' nuxt dev"
  // in dev package.json
  setMaxListeners(15)
  const runtimeConfig = useRuntimeConfig()

  const modelTag = 'stream-out'
  const toolTag = 'tool-out'

  const cache = runtimeConfig.dev
    ? await LocalFileCache.create('langchain-cache-travel')
    : undefined
  consola.info(`cache is undefined ${cache === undefined}`)

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

  const transferTools = new TransferToolKit()
  const travelRecommendToolKit = new TravelRecommendToolKit(model, embeddings)
  const weatherToolKit = new WeatherToolKit()
  const hotelToolKit = new HotelToolKit()
  const sightseeingToolKit = new SightseeingToolKit()
  const toolKits = [transferTools, travelRecommendToolKit, weatherToolKit, hotelToolKit, sightseeingToolKit]
  const toolsByName = new Map<string, StructuredToolInterface>()
  const toolTagsByToolName = new Map<string, string>()
  toolKits.forEach((toolKit) => {
    toolKit.getTools().map(tool => toolsByName.set(tool.name, tool))
    toolKit.getToolTags().forEach((tag, toolName) => {
      toolTagsByToolName.set(toolName, tag)
    })
  })

  const AgentHelpText: Record<AgentName, string> = Object.freeze({
    [AgentNames.PLUTO]: `If you need general travel help, ask the agent named ${AgentNames.PLUTO} ${AgentToEmoji[AgentNames.PLUTO]} for help by using the tool named \'${TransferToolNames.TravelTransfer}\'.`,
    [AgentNames.PETEY]: `If you need weather forecast and clothing to pack, ask the agent named ${AgentNames.PETEY} ${AgentToEmoji[AgentNames.PETEY]} for help by using the tool named \'${TransferToolNames.WeatherTransfer}\'.`,
    [AgentNames.PENNY]: `If you need hotel recommendations, ask the agent named ${AgentNames.PENNY} ${AgentToEmoji[AgentNames.PENNY]} for help by using the tool named \'${TransferToolNames.HotelTransfer}\'.`,
    [AgentNames.POLLY]: `If you need sightseeing or attractions recommendations, ask the agent named ${AgentNames.POLLY} ${AgentToEmoji[AgentNames.POLLY]} for help using the tool named \'${TransferToolNames.SightseeingTransfer}\'.`,
  } as const)

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
          const toolTags: string[] = [toolTag]
          const tag = toolTagsByToolName.get(tool.name)
          if (tag) {
            toolTags.push(tag)
          }
          consola.debug({ tag: `${params.name}-tool`, message: `Calling tool ${tool.name}` })
          const toolMessage = await tool.invoke(toolCall, { tags: toolTags })
          toolMessages.push(toolMessage)
          if (toolCall.name.endsWith('Transfer')) {
            transferToolGoTo = JSON.parse(toolMessage.content).goto
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
    tools: [...transferTools.getTransferTool(NodeNames.HotelAdvisor), ...hotelToolKit.getTools()],
    // @format:off
    systemPrompt: [
      `Your name is ${AgentNames.PENNY} ${AgentToEmoji[AgentNames.PENNY]} and you are a travel expert that can show the user a list of hotels locations for a given destination. `,
      `If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `,
      `Then Use the \'hotelSearchTool\' to get a list of hotels and then tell the users the names of the hotels only, tell the user you can get more details or a summary of reviews by other humans `,
      'The \'hotelReviewsTool\' can give you reviews provided by other people for you to summarize for the user ',
      `When talking to the user be friendly, warm and playful with a sense of humor `,
      `${AgentHelpText[AgentNames.PLUTO]} `,
      `${AgentHelpText[AgentNames.PETEY]} `,
      `${AgentHelpText[AgentNames.POLLY]} `,
      'Feel free to mention other agents by name, but call them synonyms of colleagues',
    ].join('\n'),
    // @format:on
  })

  const weatherAdvisor = makeAgent({
    name: NodeNames.WeatherAdvisor,
    tools: [...transferTools.getTransferTool(NodeNames.WeatherAdvisor), ...weatherToolKit.getTools()],
    // @format:off
    systemPrompt: [
      `Your name is ${AgentNames.PETEY} ${AgentToEmoji[AgentNames.PETEY]} and you are a travel expert that can show the user weather forecast for a given destination and duration. `,
      `After getting the weather forecast do not tell the user the weather for each day, but tell the user what clothes to pack and the other agents you can connect them to. `,
      `Feel free to mention other agents by name, but call them use a pirate way `,
      `If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `,
      `Then use the \'weatherForecastTool\' to get the weather `,
      'Talk to the user like a pirate and use pirate related emojis ',
      `${AgentHelpText[AgentNames.PLUTO]} `,
      `${AgentHelpText[AgentNames.PENNY]} `,
      `${AgentHelpText[AgentNames.POLLY]} `,
    ].join('\n'),
    // @format:on
  })

  const travelAdvisor = makeAgent({
    name: NodeNames.TravelAdvisor,
    tools: [...transferTools.getTransferTool(NodeNames.TravelAdvisor), ...travelRecommendToolKit.getTools()],
    // @format: off
    systemPrompt: [
      `Your name is ${AgentNames.PLUTO} ${AgentToEmoji[AgentNames.PLUTO]} and you are a general travel expert that can recommend travel destinations based on the user's interests `,
      `Be sure to bark a lot and use dog related emojis `,
      `Use the tools available to you `,
      `If you use the tool \'searchQueryTool\', present the results to user `,
      `Wait for user input before using \'searchExecutionTool\' `,
      `After using the \'searchExecutionTool\' let the user know you can provide a summary based on the title or connect to the other agents `,
      `${AgentHelpText[AgentNames.PETEY]} `,
      `${AgentHelpText[AgentNames.PENNY]} `,
      `${AgentHelpText[AgentNames.POLLY]} `,
      `Feel free to mention the other agents by name, but call them your colleagues or a synonym like partner, coworker, buddy, associate.`,
    ].join('\n'),
    // @format: on
  })

  const sightseeingAdvisor = makeAgent({
    name: NodeNames.SightseeingAdvisor,
    tools: [...transferTools.getTransferTool(NodeNames.SightseeingAdvisor), ...sightseeingToolKit.getTools()],
    // @format: off
    systemPrompt: [
      `Your name is ${AgentNames.POLLY} ${AgentToEmoji[AgentNames.POLLY]} and you are a travel expert that can provide specific sightseeing or attractions recommendations for a given destination. `,
      `Be sure to Squawk a lot like a parrot and use emojis related to a parrot `,
      `If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `,
      `Then use the \'sightseeingSearchTool\' get a list of sights or attractions to see, tell user the names only and tell the user you can get more details or a summary of reviews by other humans `,
      `Use the \'sightsDetailsTool\' to get more details about the sight or attraction to see `,
      `The \'sightsReviewsTool\' can give you reviews provided by other people for you to summarize for the user `,
      `After using a tool you can also mention the other agents and their abilities `,
      `Feel free to mention the other agents by name, but in a way that a parrot would`,
      `${AgentHelpText[AgentNames.PETEY]} `,
      `${AgentHelpText[AgentNames.PENNY]} `,
      `${AgentHelpText[AgentNames.PLUTO]} `,
    ].join('\n'),
    // @format: on
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
      ends: [NodeNames.HumanNode, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor, NodeNames.SightseeingAdvisor],
    })
    .addNode(NodeNames.HumanNode, humanNode, {
      ends: [NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor, NodeNames.SightseeingAdvisor],
    })
    .addNode(NodeNames.WeatherAdvisor, weatherAdvisor, {
      ends: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.HotelAdvisor, NodeNames.SightseeingAdvisor],
    })
    .addNode(NodeNames.HotelAdvisor, hotelAdvisor, {
      ends: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor, NodeNames.SightseeingAdvisor],
    })
    .addNode(NodeNames.SightseeingAdvisor, sightseeingAdvisor, {
      ends: [NodeNames.HumanNode, NodeNames.TravelAdvisor, NodeNames.WeatherAdvisor, NodeNames.HotelAdvisor],
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
    const tags = [modelTag, toolTag]
    return new ReadableStream({
      async start(controller) {
        const handlers = createStreamEventHandlers()
        try {
          const eventIterator = graph.streamEvents(input, config, { includeTags: tags })

          while (true) {
            try {
              // Race between next event and timeout
              const { value: event, done } = await Promise.race([
                eventIterator.next(),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new StreamTimeoutError()), 15000),
                ),
              ]) as IteratorResult

              if (done)
                break

              if (event.event === 'on_chat_model_stream' && event.tags?.includes(modelTag)) {
                handlers.handleChatModelStream(event, controller, encoder)
              }
              if (event.event === 'on_tool_end' && event.tags?.includes(toolTag)) {
                handlers.handleToolEnd(event, controller)
              }
            }
            catch (error) {
              if (error instanceof StreamTimeoutError) {
                consola.warn('Stream timeout occurred')
                controller.enqueue(
                  encoder.encode(
                    formatDataStreamPart('text', '\nOops looks like I took too long, sorry :(\n'),
                  ),
                )
              }
              else {
                // error could also be API error from the model
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
                consola.error('Stream error:', errorMessage)
                controller.enqueue(
                  encoder.encode(
                    formatDataStreamPart('text', `\nAn error occurred: ${errorMessage}\n`),
                  ),
                )
              }
              break
            }
          }
        }
        catch (error) {
          consola.error('Stream start error:', error)
        }
        finally {
          await Promise.resolve()
          controller.close()
        }
      },
    })
  })
})
