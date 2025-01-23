import type { AIMessage, BaseMessage } from '@langchain/core/messages'
import type { Message as VercelChatMessage } from 'ai'
import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search'
import { HumanMessage, isAIMessageChunk, SystemMessage, ToolMessage } from '@langchain/core/messages'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { tool } from '@langchain/core/tools'
import { Annotation, Command, END, interrupt, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import { formatDataStreamPart } from 'ai'
import { consola } from 'consola'
import { forecast } from 'duck-duck-scrape'
import { z } from 'zod'
import { isInitMessage } from '../utils/isInitMessage'

export default defineLazyEventHandler(() => {
  // https://h3.unjs.io/guide/event-handler#lazy-event-handlers
  // This will be executed only once
  const runtimeConfig = useRuntimeConfig()

  const AskHumanStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>,
    locationQuestion: Annotation<string>,
  })

  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.88,
    apiKey: runtimeConfig.openaiAPIKey,
  })

  const duckDuckGoSearch = new DuckDuckGoSearch({ maxResults: 1 })

  const search = tool(async ({ searchTerm }) => {
    consola.info('search tool invoked with ', searchTerm)

    try {
      const forcastResult = await forecast(searchTerm)
      if (forcastResult && 'currentWeather' in forcastResult) {
        return forcastResult.currentWeather
      }
    }
    catch (error) {
      console.error('forecast error', error)
    }
    const result = await duckDuckGoSearch.invoke(searchTerm)
    consola.info('result', result)
    return result
  }, {
    name: 'search',
    description: 'Call to surf the web.',
    schema: z.object({
      searchTerm: z.string().describe('The terms to search for'),
    }),
  })

  const tools = [search]
  const toolNode = new ToolNode<typeof MessagesAnnotation.State>(tools)

  const askHumanTool = tool((_) => {
    consola.info('askHumanTool invoked')
    return 'The human said XYZ'
  }, {
    name: 'askHuman',
    description: 'Ask the human for input.',
    schema: z.string(),
  })

  const generateQuestionTool = tool((_) => {
    consola.info('generateQuestionTool invoked')
    return 'Generated Question'
  }, {
    name: 'generateQuestion',
    description: 'Generate a question to ask the human for input',
    schema: z.string(),
  })

  const modelWithTools = model.bindTools([...tools, askHumanTool, generateQuestionTool])

  // Define the function that determines whether to continue or not
  function shouldContinue(state: typeof MessagesAnnotation.State): 'action' | 'askHuman' | 'generateQuestion' | typeof END {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage
    // If there is no function call, then we finish
    if (lastMessage && !lastMessage.tool_calls?.length) {
      consola.info('END REACHED!!!!!')
      return END
    }
    // If tool call is askHuman, we return that node
    // You could also add logic here to let some system know that there's something that requires Human input
    // For example, send a slack message, etc
    if (lastMessage.tool_calls?.[0]?.name === 'askHuman') {
      consola.info('--- ASKING HUMAN ---')
      return 'askHuman'
    }
    else if (lastMessage.tool_calls?.[0]?.name === 'generateQuestion') {
      consola.info('---Generate Question ---')
      return 'generateQuestion'
    }
    // Otherwise if it isn't, we continue with the action node
    return 'action'
  }

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', 'You are a pirate and a weather man'],
    new MessagesPlaceholder('msgs'),
  ])

  // Define the function that calls the model
  async function callModel(state: typeof MessagesAnnotation.State): Promise<Partial<typeof MessagesAnnotation.State>> {
    consola.info('callModel called')
    const messages = state.messages
    const promptValues = await promptTemplate.invoke({
      msgs: messages,
    })
    const response = await modelWithTools.invoke(promptValues)
    if (response.content && response.content.length > 0) {
      consola.info('response.content', response.content)
    }
    else if (response.tool_calls && response.tool_calls.length > 0) {
      consola.info('response.tool_calls[0].name', response.tool_calls[0].name)
      consola.info('response.tool_calls[0].args', response.tool_calls[0].args)
    }
    else {
      consola.info(response)
    }
    // We return an object with a messages property, because this will get added to the existing list
    return { messages: [response] }
  }

  const askHuman = async (state: typeof AskHumanStateAnnotation.State) => {
    consola.info('askHuman async method')
    consola.info('state.locationQuestion', state.locationQuestion)
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage
    const toolCallId = lastMessage.tool_calls?.[0].id
    const location: string = interrupt(state.locationQuestion)
    consola.info('location', location)
    const newToolMessage = new ToolMessage({
      tool_call_id: toolCallId!,
      content: location,
    })
    return { messages: [newToolMessage] }
  }

  const generateQuestion = async (state: typeof AskHumanStateAnnotation.State) => {
    consola.info('generateQuestion')
    let question = state.locationQuestion
    consola.info('question', question)
    if (!question) {
      // generate the question to ask in this node to pass to the askHuman node
      // where the interrupt happens to wait user input, so that we do not
      // generate twice when the askHuman node resumes after interrupt
      const locationQuesion = await model.invoke([
        new SystemMessage(`You are a pirate and a weather man, but you need to know the user's location. Forumlate a question to find 
          the user's location. Your question will be the first in a chat so take that into account. Include a short self bio`),
      ])
      question = locationQuesion.content as string
    }
    return { locationQuestion: question }
  }

  const messagesWorkflow = new StateGraph(MessagesAnnotation)
  // Define the two nodes we will cycle between
    .addNode('agent', callModel)
    .addNode('action', toolNode)
    .addNode('askHuman', askHuman, { input: AskHumanStateAnnotation })
    .addNode('generateQuestion', generateQuestion, { input: AskHumanStateAnnotation })
  // We now add a conditional edge
    .addConditionalEdges(
    // First, we define the start node. We use `agent`.
    // This means these are the edges taken after the `agent` node is called.
      'agent',
      // Next, we pass in the function that will determine which node is called next.
      shouldContinue,
    )
  // We now add a normal edge from `action` to `agent`.
  // This means that after `action` is called, `agent` node is called next.
    .addEdge('action', 'agent')
  // After we get back the human response, we go back to the agent
    .addEdge('askHuman', 'agent')
    .addEdge('generateQuestion', 'askHuman')
  // Set the entrypoint as `agent`
  // This means that this node is the first one called
    .addEdge(START, 'agent')

  const checkpointer = PostgresSaver.fromConnString(
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  )
  checkpointer.setup()

  const messagesApp = messagesWorkflow.compile({
    checkpointer,
  })

  return defineEventHandler(async (event) => {
    // This will be executed on every request
    const body = await readBody(event)
    const { messages, sessionId } = body

    consola.info('\nReceived request')
    const lastMessage: VercelChatMessage = messages[0]
    const useInitMessage = isInitMessage(lastMessage)
    consola.info('lastMessage', lastMessage)
    const humanMessage = new HumanMessage({
      content: 'Use the generateQuestion tool to generate a question. Use the search tool to ask the user where they are, then look up the weather there',
    })
    const input = useInitMessage ? { messages: [humanMessage] } : new Command({ resume: lastMessage.content })
    const encoder = new TextEncoder()
    const stream = await messagesApp.stream(input, { configurable: { thread_id: sessionId }, streamMode: 'messages' as const })
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const [message, _metadata] of stream) {
            if (isAIMessageChunk(message) && !message.tool_call_chunks?.length) {
              const part = formatDataStreamPart('text', message.content as string)
              controller.enqueue(encoder.encode(part))
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
