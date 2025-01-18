import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { 
  AIMessageChunk, 
  BaseMessage, 
  isAIMessageChunk 
} from "@langchain/core/messages";
import {
  MessagesAnnotation,
  StateGraph,
  START,
  Command,
  interrupt,
} from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { 
  Message as VercelChatMessage, 
  formatDataStreamPart 
} from 'ai'

export default defineLazyEventHandler(async () => {
const runtimeConfig = useRuntimeConfig()

const tag = 'stream-out'

const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.6,
  apiKey: runtimeConfig.openaiAPIKey,
})

const checkpointer = PostgresSaver.fromConnString(
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
);
await checkpointer.setup()

function callLLM(messages: BaseMessage[], targetAgentNodes: string[], runName = 'callLLM') {
  // define the schema for the structured output:
  // - model's text response (`response`)
  // - name of the node to go to next (or 'finish')
  const outputSchema = z.object({
    response: z.string().describe("A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user."),
    goto: z.enum(["finish", ...targetAgentNodes]).describe("The next agent to call, or 'finish' if the user's query has been resolved. Must be one of the specified values."),
  })

  return model.withStructuredOutput(outputSchema, {name: "Response"}).invoke(messages, {tags: [tag], runName: runName })
}

async function travelAdvisor(state: typeof MessagesAnnotation.State): Promise<Command> {
  const systemPrompt = 
      `Your name is Pluto the pup and you are a general travel expert that can recommend travel destinations (e.g. countries, cities, etc). 
       Be sure to bark a lot and use dog related emojis ` +
      `If you need specific sightseeing recommendations, ask 'sightseeingAdvisor' named Polly Parrot for help. ` +
      "If you need hotel recommendations, ask 'hotelAdvisor' named Penny Restmore for help. " +
      "If you need weather forecast and clothing to pack, ask 'weatherAdvisor named Petey the Pirate for help" +
      "If you have enough information to respond to the user, return 'finish'. " +
      "Feel free to mention the other agents by name, but call them your colleagues or similar.";

  const messages = [{"role": "system", "content": systemPrompt}, ...state.messages] as BaseMessage[];
  const targetAgentNodes = ["sightseeingAdvisor", "hotelAdvisor", "weatherAdvisor"];
  const response = await callLLM(messages, targetAgentNodes, 'travelAdvisor');
  const aiMsg = {"role": "ai", "content": response.response, "name": "travelAdvisor"};

  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }

  return new Command({goto, update: { "messages": [aiMsg] } });
}

async function sightseeingAdvisor(state: typeof MessagesAnnotation.State): Promise<Command> {
  const systemPrompt = 
      `Your name is Polly Parrot and you are a travel expert that can provid specific sightseeing recommendations for a given destination. 
      Be sure to Squawk a lot like a parrot and use emojis related to a parrot` +
      "If you need general travel help, go to 'travelAdvisor' named Pluto the pup for help. " +
      "If you need hotel recommendations, ask 'hotelAdvisor' named Penny Restmore for help.  " +
      "If you need weather forecast and clothing to pack, ask 'weatherAdvisor named Petey the Pirate for help" +
      "If you have enough information to respond to the user, return 'finish'. " +
      "Feel free to meantion the other agents by name, but in a Parrot way";

  const messages = [{"role": "system", "content": systemPrompt}, ...state.messages] as BaseMessage[];
  const targetAgentNodes = ["travelAdvisor", "hotelAdvisor", "weatherAdvisor"];
  const response = await callLLM(messages, targetAgentNodes);
  const aiMsg = {"role": "ai", "content": response.response, "name": "sightseeingAdvisor"};

  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }

  return new Command({ goto, update: {"messages": [aiMsg] } });
}

async function hotelAdvisor(state: typeof MessagesAnnotation.State): Promise<Command> {
  const systemPrompt = 
      `You name is Penny Restmore and you are a travel expert that can provide hotel recommendations for a given destination. ` +
      `When talking to the user be friendly, warm and playful with a sense of humor`
      "If you need general travel help, go to 'travelAdvisor' named Pluto the pup for help. " +
      "If you need specific sightseeing recommendations, ask 'sightseeingAdvisor' named Polly Parrot for help. " +
      "If you need weather forecast and clothing to pack, ask 'weatherAdvisor named Petey the Pirate for help" +
      "If you have enough information to respond to the user, return 'finish'. " +
      "Feel free to mention other agents by name, but call them synonyms of colleagues";

  const messages = [{"role": "system", "content": systemPrompt}, ...state.messages] as BaseMessage[];
  const targetAgentNodes = ["travelAdvisor", "sightseeingAdvisor", "weatherAdvisor"];
  const response = await callLLM(messages, targetAgentNodes);
  const aiMsg = {"role": "ai", "content": response.response, "name": "hotelAdvisor"};

  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }

  return new Command({ goto, update: {"messages": [aiMsg] } });
}

async function weatherAdvisor(state: typeof MessagesAnnotation.State): Promise<Command> {
  const systemPrompt = 
    `Your name is Petey the Pirate and you are a travel expert that can provide the weather forecast 
    for a given destination and duration. When you get a weather forecast also recommand what types 
    of clothes the user should pack for their trip ` +
    "Talke to the user like a pirate and use pirate related emojis " +
    "If you need general travel help, go to 'travelAdvisor' named Pluto the pup for help. " +
    "If you need specific sightseeing recommendations, ask 'sightseeingAdvisor' named Polly Parrot for help. " +
    "If you need hotel recommendations, ask 'hotelAdvisor' named Penny Restmore for help. " +
    "Feel free to meantion the other agents by name, but in a pirate way"

  const messages = [{"role": "system", "content": systemPrompt}, ...state.messages] as BaseMessage[]
  const targetAgentNodes = ["travelAdvisor", "sightseeingAdvisor", "hotelAdvisor"];
  const response = await callLLM(messages, targetAgentNodes);
  const aiMsg = {"role": "ai", "content": response.response, "name": "weatherAdvisor"};

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
  ends: ["sightseeingAdvisor", "hotelAdvisor", "weatherAdvisor"]
})
.addNode("sightseeingAdvisor", sightseeingAdvisor, {
  ends: ["human", "travelAdvisor", "hotelAdvisor", "weatherAdvisor"]
})
.addNode("hotelAdvisor", hotelAdvisor, {
  ends: ["human", "travelAdvisor", "sightseeingAdvisor", "weatherAdvisor"]
})
// This adds a node to collect human input, which will route
// back to the active agent.
.addNode("human", humanNode, {
  ends: ["hotelAdvisor", "sightseeingAdvisor", "travelAdvisor", "weatherAdvisor", "human"]
})
// add the weatherAdvior
.addNode("weatherAdvisor", weatherAdvisor, {
  ends: ["human", "travelAdvisor", "sightseeingAdvisor", "hotelAdvisor"]
})
// We'll always start with a general travel advisor.
.addEdge(START, "travelAdvisor")

const graph = builder.compile({ checkpointer })

return defineEventHandler(async webEvent => {
  const body = await readBody(webEvent)
  const { messages, sessionId } = body
  console.log('\nReceived request sessionId', sessionId)

  const lastMessage: VercelChatMessage = messages[0]
  console.log('lastMessage', lastMessage.content)

  const initMessage = {
    messages: [
      {role: "system", content: `Use the tools and agents you have to figure out what to ask the user.
        Introduce yourself and give the user a summary of your skills and knowledge `}
    ]
  }
  const input = isInitMessage(lastMessage) ? initMessage : new Command({resume: lastMessage.content})
  
  const encoder = new TextEncoder()

  const config = {version: "v2" as const, configurable: {thread_id: sessionId},}
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of graph.streamEvents(input, config, {includeTags: [tag]})) {
          if (event.event === 'on_chat_model_stream' && event.tags?.includes(tag)) {
            if (isAIMessageChunk(event.data.chunk)) {
              const aiMessageChunk = event.data.chunk as AIMessageChunk
              if (aiMessageChunk.tool_call_chunks?.length && aiMessageChunk.tool_call_chunks[0].args) {
                const toolChunk =  aiMessageChunk.tool_call_chunks[0].args
                // we can filter the toolChunk to exclude the {response:... but it depends on
                // how the model tokenizes and introduces overhead
                const part = formatDataStreamPart('text', toolChunk)
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