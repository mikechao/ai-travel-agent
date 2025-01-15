import { ChatOpenAI } from "@langchain/openai"
import { tool } from "@langchain/core/tools"
import { StateGraph, MessagesAnnotation, START, END, MemorySaver, interrupt } from "@langchain/langgraph"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { AIMessage, isAIMessageChunk, ToolMessage } from "@langchain/core/messages"
import { z } from "zod"
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { formatDataStreamPart, Message } from "ai"

export default defineLazyEventHandler(() => {
  // https://h3.unjs.io/guide/event-handler#lazy-event-handlers
  // This will be executed only once

  const runtimeConfig = useRuntimeConfig()

  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
    apiKey: runtimeConfig.openaiAPIKey
  })

  const search = tool((_) => {
    return "It's sunny in San Francisco, but you better look out if you're a Gemini 😈.";
  }, {
    name: "search",
    description: "Call to surf the web.",
    schema: z.string(),
  })

  const tools = [search]
  const toolNode = new ToolNode<typeof MessagesAnnotation.State>(tools)

  const askHumanTool = tool((_) => {
    return "The human said XYZ";
  }, {
    name: "askHuman",
    description: "Ask the human for input.",
    schema: z.string(),
  });

  const modelWithTools = model.bindTools([...tools, askHumanTool])

  // Define the function that determines whether to continue or not
  function shouldContinue(state: typeof MessagesAnnotation.State): "action" | "askHuman" | typeof END {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    // If there is no function call, then we finish
    if (lastMessage && !lastMessage.tool_calls?.length) {
      return END;
    }
    // If tool call is askHuman, we return that node
    // You could also add logic here to let some system know that there's something that requires Human input
    // For example, send a slack message, etc
    if (lastMessage.tool_calls?.[0]?.name === "askHuman") {
      console.log("--- ASKING HUMAN ---")
      return "askHuman";
    }
    // Otherwise if it isn't, we continue with the action node
    return "action";
  }

  // Define the function that calls the model
  async function callModel(state: typeof MessagesAnnotation.State): Promise<Partial<typeof MessagesAnnotation.State>> {
    const messages = state.messages;
    const response = await modelWithTools.invoke(messages);
    // We return an object with a messages property, because this will get added to the existing list
    return { messages: [response] };
  }


  // We define a fake node to ask the human
  function askHuman(state: typeof MessagesAnnotation.State): Partial<typeof MessagesAnnotation.State> {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    const toolCallId = lastMessage.tool_calls?.[0].id;
    const location: string = interrupt("Please provide your location:");
    const newToolMessage = new ToolMessage({
      tool_call_id: toolCallId!,
      content: location,
    })
    return { messages: [newToolMessage] };
  }

  const messagesWorkflow = new StateGraph(MessagesAnnotation)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("action", toolNode)
  .addNode("askHuman", askHuman)
  // We now add a conditional edge
  .addConditionalEdges(
    // First, we define the start node. We use `agent`.
    // This means these are the edges taken after the `agent` node is called.
    "agent",
    // Next, we pass in the function that will determine which node is called next.
    shouldContinue
  )
  // We now add a normal edge from `action` to `agent`.
  // This means that after `action` is called, `agent` node is called next.
  .addEdge("action", "agent")
  // After we get back the human response, we go back to the agent
  .addEdge("askHuman", "agent")
  // Set the entrypoint as `agent`
  // This means that this node is the first one called
  .addEdge(START, "agent")

  const checkpointer = PostgresSaver.fromConnString(
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  );
  checkpointer.setup()

  const messagesApp = messagesWorkflow.compile({
    checkpointer: checkpointer,
})

function shouldUseInitMessage(message: Message) {
  if (message.data) {
    try {
      const initData = JSON.parse(message.data as string)
      return initData.hasOwnProperty('init') && initData['init']
    } catch (error) {
      return false
    }
  }
  return false
}

  return defineEventHandler(async (event) => {
    // This will be executed on every request
    const body = await readBody(event)
    const { messages, sessionId } = body
  
    console.log('Received request:', messages)
    console.log('Received sessionId:', sessionId)
    const lastMessage: Message = messages[messages.length - 1]
    const useInitMessage = shouldUseInitMessage(lastMessage)
    console.log("useInitMessage", useInitMessage)
    const input = {
      messages: [{
        role: "user",
        content: "Use the search tool to ask the user where they are, then look up the weather there",
      }]
    }
    const config = {version: 'v2', configurable: { thread_id: sessionId} }

    // for await (const {event, data} of messagesApp.streamEvents(input, {version: 'v2', configurable: { thread_id: sessionId} })) {
    //   console.log('event', event)
    //   console.log('data', data)
    // }
    const encoder = new TextEncoder()
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const { event, data } of messagesApp.streamEvents(input, {version: 'v2', configurable: { thread_id: sessionId}, })) {
            if (event === "on_chat_model_stream" && isAIMessageChunk(data.chunk)) {
              if (data.chunk.tool_call_chunks !== undefined && data.chunk.tool_call_chunks.length > 0) {
                for (const chunk of data.chunk.tool_call_chunks) {
                  const part = formatDataStreamPart('text', chunk.args as string)
                  controller.enqueue(encoder.encode(part))
                }
              }
            }
          }
        } finally {
          controller.close()
        }
      },
    })
  })
})