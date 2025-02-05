import type {
  AIMessageChunk,
  BaseMessage,
  ToolMessage,
} from '@langchain/core/messages'
import type {
  StructuredToolInterface,
} from '@langchain/core/tools'
import type {
  Message as VercelChatMessage,
} from 'ai'
import {
  AIMessage,
  isAIMessageChunk,
  RemoveMessage,
  SystemMessage,
} from '@langchain/core/messages'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import {
  Annotation,
  Command,
  interrupt,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import {
  formatDataStreamPart,
} from 'ai'
import consola from 'consola'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { TravelRecommendToolKit } from '../toolkits/TravelRecommendToolKit'
import { getHotelDetailsTool } from '../utils/hotelDetailsTool'
import { getHotelReviewsTool } from '../utils/hotelReviewsTool'
import { getHotelSearchTool } from '../utils/hotelSearchTool'
import { getSightsDetailsTool } from '../utils/sightsDetailsTool'
import { getSightseeingSearchTool } from '../utils/sightseeingSearchTool'
import { getSightsReviewsTool } from '../utils/sightsReviewTool'
import { getWeatherForecastTool } from '../utils/weatherSearchTool'

export default defineLazyEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()

  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.6,
    apiKey: runtimeConfig.openaiAPIKey,
  })

  const embeddings = new OpenAIEmbeddings({
    apiKey: runtimeConfig.openaiAPIKey,
  })

  const modelTag = 'stream-out'
  const toolTag = 'tool-out'

  const travelRecommendToolKit = new TravelRecommendToolKit(model, embeddings)
  const weatherForecastTool = getWeatherForecastTool()
  const hotelSearchTool = getHotelSearchTool()
  const hotelDetailsTool = getHotelDetailsTool()
  const sightseeingSearchTool = getSightseeingSearchTool()
  const geocodeTool = getGeocodeTool()
  const sightsDetailsTool = getSightsDetailsTool()
  const hotelReviewsTool = getHotelReviewsTool()
  const sightsReviewsTool = getSightsReviewsTool()

  const toolsByName = new Map<string, StructuredToolInterface>()
  toolsByName.set(weatherForecastTool.name, weatherForecastTool)
  toolsByName.set(hotelSearchTool.name, hotelSearchTool)
  toolsByName.set(hotelDetailsTool.name, hotelDetailsTool)
  toolsByName.set(sightseeingSearchTool.name, sightseeingSearchTool)
  toolsByName.set(geocodeTool.name, geocodeTool)
  toolsByName.set(sightsDetailsTool.name, sightsDetailsTool)
  toolsByName.set(hotelReviewsTool.name, hotelReviewsTool)
  toolsByName.set(sightsReviewsTool.name, sightsReviewsTool)
  travelRecommendToolKit.getTools().forEach(tool => toolsByName.set(tool.name, tool))

  const weathToolTag = 'weather-tool'
  const hotelDetailsTag = 'hotel-details'
  const hotelSearchTag = 'hotel-search'
  const sightSearchTag = 'sight-search'
  const sighDetailTag = 'sight-details'
  const toolTagsByToolName = new Map<string, string>()
  toolTagsByToolName.set(weatherForecastTool.name, weathToolTag)
  toolTagsByToolName.set(hotelDetailsTool.name, hotelDetailsTag)
  toolTagsByToolName.set(hotelSearchTool.name, hotelSearchTag)
  toolTagsByToolName.set(sightseeingSearchTool.name, sightSearchTag)
  toolTagsByToolName.set(sightsDetailsTool.name, sighDetailTag)

  const checkpointer = PostgresSaver.fromConnString(
    runtimeConfig.postgresURL,
  )
  await checkpointer.setup()

  const AgentState = Annotation.Root({
    ...MessagesAnnotation.spec,
    sender: Annotation<string>({
      reducer: (x, y) => y ?? x ?? 'human',
      default: () => 'human',
    }),
    toolsToCall: Annotation<string>(),
  })

  async function callLLM(messages: BaseMessage[], targetAgentNodes: string[], runName = 'callLLM', toolsToUse: StructuredToolInterface<any>[] = []) {
  // without this if/else it seems like it will loop a few times before the LLM figures out
  // that we have already gotten the weather forecast for example
    if (toolsToUse.length) {
      const outputSchema = z.object({
        response: z.string().describe('A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user.'),
        goto: z.enum(['finish', 'human', 'callTools', ...targetAgentNodes])
          .describe(`The next agent to call, 'callTools' if a tool should be used 
          or 'human' if you need more input from the user to complete the query 
          or 'finish' if the user's query has been resolved. Must be one of the specified values.`),
        toolsToCall: z.string().optional().describe(`A comma seperated list of tools to call if any, can be empty. 
          Must be filled out when the goto filed is 'callTools'`),
      })
      const toolNames = toolsToUse.map(tool => `name: ${tool.name}, description: ${tool.description}`).join('\n')
      const prompt = await ChatPromptTemplate.fromMessages([
        [
          'system',
          'You are collaborating with other assistants.'
          + ' Use the provided tools, only if it is needed to progress towards answering the question.'
          + ' If you have choosen a tool to use be sure to add it to the toolsToCall field. '
          + ' You have access to the following tools: \n{tool_names}.\n ',
        ],
        new MessagesPlaceholder('messages'),
      ]).partial({
        tool_names: toolNames,
      })
      const chain = prompt.pipe(model.withStructuredOutput(outputSchema, { name: 'Response' }))
      return chain.invoke({ messages }, { tags: [modelTag], runName })
    }
    else {
      const outputSchema = z.object({
        response: z.string().describe('A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user.'),
        goto: z.enum(['finish', 'human', ...targetAgentNodes])
          .describe(`The next agent to call, 
          'finish' if the user's query has been resolved, 
          or 'human' if you need more input from the user to complete the query. 
          Must be one of the specified values.`),
        toolsToCall: z.string().optional().describe('A comma seperated list of tools to call if any, can be empty'),
      })
      return model.withStructuredOutput(outputSchema, { name: 'Response' }).invoke(messages, { tags: [modelTag], runName })
    }
  }

  async function travelAdvisor(state: typeof AgentState.State): Promise<Command> {
    consola.info('travelAdvisor')
    const systemPrompt
      = `Your name is Pluto the pup and you are a general travel expert that can recommend travel destinations based on the user's interests 
         by using the  \'travelRecommendTool\' tool. `
        + ` To recommend travel destinations you MUST use the \'travelRecommendTool\' tool `
        + ` Be sure to bark a lot and use dog related emojis `
        + `If you need sightseeing or attraction recommendations, ask \'sightseeingAdvisor\' named Polly Parrot for help. `
        + 'If you need hotel recommendations, ask \'hotelAdvisor\' named Penny Restmore for help. '
        + 'If you need weather forecast and clothing to pack, ask \'weatherAdvisor named Petey the Pirate for help'
        + `Feel free to mention the other agents by name, but call them your colleagues or a synonym
         like partner, coworker, buddy, associate.`

    const promptMessage = new SystemMessage({ name: 'TravelPrompt', content: systemPrompt })
    const messages = [promptMessage, ...state.messages] as BaseMessage[]
    const targetAgentNodes = ['sightseeingAdvisor', 'hotelAdvisor', 'weatherAdvisor']
    const response = await callLLM(messages, targetAgentNodes, 'travelAdvisor', travelRecommendToolKit.getTools())
    return handleLLMResponse(response, 'travelResponse', 'travelAdvisor')
  }

  async function sightseeingAdvisor(state: typeof AgentState.State): Promise<Command> {
    consola.info('sightseeingAdvisor')
    const systemPrompt
      = `Your name is Polly Parrot and you are a travel expert that can provide specific sightseeing or attractions 
      recommendations for a given destination. 
      Be sure to Squawk a lot like a parrot and use emojis related to a parrot`
        + ` If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `
        + ` Then Use the \'sightseeingSearchTool\' get a list of sights or attractions to see, tell user the names only 
        and tell the user you can get more details or a summary of reviews by other humans `
        + ` Use the \'sightsDetailsTool\' to get more details about the sight or attraction to see `
        + ` The \'sightsReviewsTool\' can give you reviews provided by other people for you to summerize for the user `
        + 'If you need general travel help, go to \'travelAdvisor\' named Pluto the pup for help. '
        + 'If you need hotel recommendations, ask \'hotelAdvisor\' named Penny Restmore for help.  '
        + 'If you need weather forecast and clothing to pack, ask \'weatherAdvisor named Petey the Pirate for help'
        + 'Feel free to meantion the other agents by name, but in a Parrot way'

    const promptMessage = new SystemMessage({ name: 'SightseeingPrompt', content: systemPrompt })
    const messages = [promptMessage, ...state.messages] as BaseMessage[]
    const targetAgentNodes = ['travelAdvisor', 'hotelAdvisor', 'weatherAdvisor']
    const response = await callLLM(messages, targetAgentNodes, 'sightseeingAdvisor', [geocodeTool, sightseeingSearchTool, sightsDetailsTool, sightsReviewsTool])
    return handleLLMResponse(response, 'sightseeingResponse', 'sightseeingAdvisor')
  }

  async function hotelAdvisor(state: typeof AgentState.State): Promise<Command> {
    consola.info('hotelAdvisor')
    const systemPrompt
      = `Your name is Penny Restmore and you are a travel expert that can show the user a list of hotels locations for a given destination. `
        + ` If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `
        + ` Then Use the \'hotelSearchTool\' to get a list of hotels and then tell the users the names of the hotels only, 
          tell the user you can get more details or a summary of reviews by other humans `
        + ' The \'hotelReviewsTool\' can give you reviews provided by other people for you to summerize for the user '
        + `When talking to the user be friendly, warm and playful with a sense of humor`
        + 'If you need general travel help, go to \'travelAdvisor\' named Pluto the pup for help. '
        + 'If you are asked for sightseeing or attraction recommendations, ask \'sightseeingAdvisor\' named Polly Parrot for help. '
        + 'If you need weather forecast and clothing to pack, ask \'weatherAdvisor named Petey the Pirate for help'
        + 'Feel free to mention other agents by name, but call them synonyms of colleagues'

    const promptMessage = new SystemMessage({ name: 'HotelPrompt', content: systemPrompt })
    const messages = [promptMessage, ...state.messages] as BaseMessage[]
    const targetAgentNodes = ['travelAdvisor', 'sightseeingAdvisor', 'weatherAdvisor']
    const response = await callLLM(messages, targetAgentNodes, 'hotelAdvisor', [geocodeTool, hotelSearchTool, hotelDetailsTool, hotelReviewsTool])
    return handleLLMResponse(response, 'hotelResponse', 'hotelAdvisor')
  }

  async function weatherAdvisor(state: typeof AgentState.State): Promise<Command> {
    consola.info('weatherAdvisor')
    const systemPrompt
    = `Your name is Petey the Pirate and you are a travel expert that can show the user weather forecast 
    for a given destination and duration. After getting the weather forecast do not tell the user 
    the weather for each day, but tell the user what clothes to pack.  `
      + ` If you do not have Latitude, Longitude and location use the \'geocodeTool\' to get it `
      + 'Talk to the user like a pirate and use pirate related emojis '
      + 'If you need general travel help, go to \'travelAdvisor\' named Pluto the pup for help. '
      + 'If you need sightseeing or attraction recommendations, ask \'sightseeingAdvisor\' named Polly Parrot for help. '
      + 'If you need hotel recommendations, ask \'hotelAdvisor\' named Penny Restmore for help. '
      + 'Feel free to meantion the other agents by name, but in a pirate way'

    const promptMessage = new SystemMessage({ name: 'WeatherPrompt', content: systemPrompt })
    const messages = [promptMessage, ...state.messages] as BaseMessage[]
    const targetAgentNodes = ['travelAdvisor', 'sightseeingAdvisor', 'hotelAdvisor']
    const response = await callLLM(messages, targetAgentNodes, 'weatherAdvisor', [geocodeTool, weatherForecastTool])
    return handleLLMResponse(response, 'weatherResponse', 'weatherAdvisor')
  }

  async function handleLLMResponse(response: {
    response: string
    goto: string
    toolsToCall?: string | undefined
  }, messageName: string, senderName: string): Promise<Command> {
    const aiMessage = new AIMessage({ name: messageName, content: response.response })
    let toolsToCall = ''
    if (response.toolsToCall) {
      toolsToCall = response.toolsToCall
    }
    consola.info('toolsToCall', toolsToCall)
    let goto = response.goto
    if (goto === 'finish') {
      goto = 'deleteNode'
    }
    consola.info('goto', goto)
    return new Command({
      goto,
      update: {
        messages: [aiMessage],
        sender: senderName,
        toolsToCall,
      },
    })
  }

  let isInitMessageRemoved = false
  function deleteNode(state: typeof AgentState.State): Command {
    consola.info('deleteNode')
    if (state.messages.length > 4 && !isInitMessageRemoved) {
      consola.info('removing initMessage')
      const messages = state.messages
      const idsToRemove = []
      const initIndex = messages.findIndex(msg => msg.id === 'initMessage')
      // remove the initMessage and the one after it
      if (initIndex !== -1 && initIndex + 1 < messages.length) {
        idsToRemove.push(messages[initIndex].id)
        // apparent the response to the initMessage helps the LLM Route
        // idsToRemove.push(messages[initIndex + 1].id)
      }
      const removeMessages = idsToRemove.map(id => new RemoveMessage({ id: `${id}` }))
      isInitMessageRemoved = true
      return new Command({
        goto: 'human',
        update: {
          messages: removeMessages,
        },
      })
    }
    return new Command({
      goto: 'human',
    })
  }

  function humanNode(state: typeof AgentState.State): Command {
    consola.info('humanNode')
    const userInput: string = interrupt('Ready for user input.')

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

  async function callTools(state: typeof AgentState.State): Promise<Command> {
    consola.info('callTools node')
    const tools: StructuredToolInterface[]
    = (state.toolsToCall)
      ? state.toolsToCall.split(',')
          .map(name => toolsByName.get(name))
          .filter(tool => tool !== undefined)
      : []

    if (tools.length) {
      const tags = [toolTag]
      for (const tool of tools) {
        if (toolTagsByToolName.get(tool.name)) {
          tags.push(toolTagsByToolName.get(tool.name) as string)
        }
      }
      const modelWithTools = model.bindTools(tools)
      const result = await modelWithTools.invoke(state.messages, { parallel_tool_calls: false })
      const toolNode = new ToolNode(tools)
      const toolResults = await toolNode.invoke([...state.messages, result], { tags })
      return new Command({
        goto: state.sender,
        update: {
          messages: [result, ...toolResults],
          sender: 'callTools',
          toolsToCall: '',
        },
      })
    }
    console.error(`No tools to call for ${state.sender}`)
    return new Command({
      goto: state.sender,
    })
  }

  const builder = new StateGraph(AgentState)
    .addNode('travelAdvisor', travelAdvisor, {
      ends: ['deleteNode', 'sightseeingAdvisor', 'hotelAdvisor', 'weatherAdvisor'],
    })
    .addNode('sightseeingAdvisor', sightseeingAdvisor, {
      ends: ['deleteNode', 'travelAdvisor', 'hotelAdvisor', 'weatherAdvisor'],
    })
    .addNode('hotelAdvisor', hotelAdvisor, {
      ends: ['deleteNode', 'travelAdvisor', 'sightseeingAdvisor', 'weatherAdvisor'],
    })
  // This adds a node to collect human input, which will route
  // back to the active agent.
    .addNode('human', humanNode, {
      ends: ['hotelAdvisor', 'sightseeingAdvisor', 'travelAdvisor', 'weatherAdvisor', 'human'],
    })
  // add the weatherAdvsior
    .addNode('weatherAdvisor', weatherAdvisor, {
      ends: ['human', 'travelAdvisor', 'sightseeingAdvisor', 'hotelAdvisor', 'callTools'],
    })
    .addNode('callTools', callTools, {
      ends: ['hotelAdvisor', 'sightseeingAdvisor', 'travelAdvisor', 'weatherAdvisor'],
    })
    .addNode('deleteNode', deleteNode, {
      ends: ['human'],
    })
  // We'll always start with a general travel advisor.
    .addEdge(START, 'travelAdvisor')

  const graph = builder.compile({ checkpointer })

  return defineEventHandler(async (webEvent) => {
    const body = await readBody(webEvent)
    const { messages, sessionId } = body
    consola.info('\nReceived request sessionId', sessionId)

    const lastMessage: VercelChatMessage = messages[0]
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
    const tags = [modelTag, toolTag, weathToolTag, hotelDetailsTag]
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
                if (event.tags.includes(weathToolTag)) {
                  // 2 will send it to data from useChat
                  // 8 will send it to message.annotations on the client side
                  const part = `2:[{"id":"${id}","type":"weather","data":${content}}]\n`
                  controller.enqueue(part)
                }
                if (event.tags.includes(hotelDetailsTag)) {
                  const part = `2:[{"id":"${id}","type":"hotel-details","data":${content}}]\n`
                  controller.enqueue(part)
                }
                if (event.tags.includes(hotelSearchTag)) {
                  const part = `2:[{"id":"${id}","type":"hotel-search","data":${content}}]\n`
                  controller.enqueue(part)
                }
                if (event.tags.includes(sightSearchTag)) {
                  const part = `2:[{"id":"${id}","type":"sight-search","data":${content}}]\n`
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
