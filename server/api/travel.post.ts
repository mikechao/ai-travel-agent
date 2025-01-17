import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, isAIMessageChunk } from "@langchain/core/messages";
import {
  MessagesAnnotation,
  StateGraph,
  START,
  Command,
  interrupt,
  MemorySaver,
  UnreachableNodeError
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid"
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { LangChainAdapter, createDataStreamResponse, formatDataStreamPart, streamText,} from 'ai'
import { convertLangChainMessageToVercelMessage } from "../utils/messageConvert";

export default defineLazyEventHandler(async () => {
const runtimeConfig = useRuntimeConfig()

const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
  apiKey: runtimeConfig.openaiAPIKey
})

const checkpointer = PostgresSaver.fromConnString(
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
);
await checkpointer.setup()

function callLlm(messages: BaseMessage[], targetAgentNodes: string[]) {
  // define the schema for the structured output:
  // - model's text response (`response`)
  // - name of the node to go to next (or 'finish')
  const outputSchema = z.object({
    response: z.string().describe("A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user."),
    goto: z.enum(["finish", ...targetAgentNodes]).describe("The next agent to call, or 'finish' if the user's query has been resolved. Must be one of the specified values."),
  })
  return model.withStructuredOutput(outputSchema, { name: "Response" }).invoke(messages)
}

async function travelAdvisor(state: typeof MessagesAnnotation.State): Promise<Command> {
  const systemPrompt = 
      "You are a general travel expert that can recommend travel destinations (e.g. countries, cities, etc). " +
      "If you need specific sightseeing recommendations, ask 'sightseeingAdvisor' for help. " +
      "If you need hotel recommendations, ask 'hotelAdvisor' for help. " +
      "If you have enough information to respond to the user, return 'finish'. " +
      "Never mention other agents by name.";

  const messages = [{"role": "system", "content": systemPrompt}, ...state.messages] as BaseMessage[];
  const targetAgentNodes = ["sightseeingAdvisor", "hotelAdvisor"];
  const response = await callLlm(messages, targetAgentNodes);
  const aiMsg = {"role": "ai", "content": response.response, "name": "travelAdvisor"};

  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }

  return new Command({goto, update: { "messages": [aiMsg] } });
}

async function sightseeingAdvisor(state: typeof MessagesAnnotation.State): Promise<Command> {
  const systemPrompt = 
      "You are a travel expert that can provide specific sightseeing recommendations for a given destination. " +
      "If you need general travel help, go to 'travelAdvisor' for help. " +
      "If you need hotel recommendations, go to 'hotelAdvisor' for help. " +
      "If you have enough information to respond to the user, return 'finish'. " +
      "Never mention other agents by name.";

  const messages = [{"role": "system", "content": systemPrompt}, ...state.messages] as BaseMessage[];
  const targetAgentNodes = ["travelAdvisor", "hotelAdvisor"];
  const response = await callLlm(messages, targetAgentNodes);
  const aiMsg = {"role": "ai", "content": response.response, "name": "sightseeingAdvisor"};

  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }

  return new Command({ goto, update: {"messages": [aiMsg] } });
}

async function hotelAdvisor(state: typeof MessagesAnnotation.State): Promise<Command> {
  const systemPrompt = 
      "You are a travel expert that can provide hotel recommendations for a given destination. " +
      "If you need general travel help, ask 'travelAdvisor' for help. " +
      "If you need specific sightseeing recommendations, ask 'sightseeingAdvisor' for help. " +
      "If you have enough information to respond to the user, return 'finish'. " +
      "Never mention other agents by name.";

  const messages = [{"role": "system", "content": systemPrompt}, ...state.messages] as BaseMessage[];
  const targetAgentNodes = ["travelAdvisor", "sightseeingAdvisor"];
  const response = await callLlm(messages, targetAgentNodes);
  const aiMsg = {"role": "ai", "content": response.response, "name": "hotelAdvisor"};

  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }

  return new Command({ goto, update: {"messages": [aiMsg] } });
}

function humanNode(state: typeof MessagesAnnotation.State): Command {
  const userInput: string = interrupt("Ready for user input.");

  let activeAgent: string | undefined = undefined;

  // Look up the active agent
  for (let i = state.messages.length - 1; i >= 0; i--) {
      if (state.messages[i].name) {
          activeAgent = state.messages[i].name;
          break;
      }
  }

  if (!activeAgent) {
      throw new Error("Could not determine the active agent.");
  }

  return new Command({
      goto: activeAgent,
      update: {
        "messages": [
            {
                "role": "human",
                "content": userInput,
            }
        ]
      }
  });
}

const builder = new StateGraph(MessagesAnnotation)
.addNode("travelAdvisor", travelAdvisor, {
  ends: ["sightseeingAdvisor", "hotelAdvisor"]
})
.addNode("sightseeingAdvisor", sightseeingAdvisor, {
  ends: ["human", "travelAdvisor", "hotelAdvisor"]
})
.addNode("hotelAdvisor", hotelAdvisor, {
  ends: ["human", "travelAdvisor", "sightseeingAdvisor"]
})
// This adds a node to collect human input, which will route
// back to the active agent.
.addNode("human", humanNode, {
  ends: ["hotelAdvisor", "sightseeingAdvisor", "travelAdvisor", "human"]
})
// We'll always start with a general travel advisor.
.addEdge(START, "travelAdvisor")

const graph = builder.compile({ checkpointer })

return defineEventHandler(async event => {
  
  //test
  const threadConfig = { configurable: { thread_id: uuidv4() }, streamMode: "values" as const };
  
  const inputs = [
    // 1st round of conversation
    {
      messages: [
        { role: "user", content: "i wanna go somewhere warm in the caribbean" }
      ]
    },
    // Since we're using `interrupt`, we'll need to resume using the Command primitive.
    // 2nd round of conversation
    new Command({
      resume: "could you recommend a nice hotel in one of the areas and tell me which area it is."
    }),
    // Third round of conversation
    new Command({ resume: "could you recommend something to do near the hotel?" }),
  ]

  const input = inputs[0]
  console.log('input', input)
  
  //const eventStream = await graph.streamEvents(input, {version: 'v2', configurable: { thread_id: uuidv4()}, })
  // the list of events from the graph
  //   'on_chain_start',
  //   'on_chain_end',
  //   'on_chat_model_start',
  //   'on_chat_model_stream',
  //   'on_chat_model_end',
  //   'on_parser_start',
  //   'on_parser_end',
  //   'on_chain_stream' }

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const { event, data } of graph.streamEvents(input, {version: 'v2', configurable: { thread_id: uuidv4()}, })) {
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