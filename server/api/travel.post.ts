import { z } from "zod";
import { ChatOpenAI,} from "@langchain/openai";
import { 
  DynamicStructuredTool, 
  StructuredToolInterface 
} from "@langchain/core/tools"
import { 
  AIMessageChunk, 
  BaseMessage, 
  isAIMessageChunk, 
  SystemMessage, 
  ToolMessage
} from "@langchain/core/messages";
import {
  StateGraph,
  START,
  Command,
  interrupt,
  Annotation,
} from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { 
  Message as VercelChatMessage, 
  formatDataStreamPart 
} from 'ai'
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder 
} from "@langchain/core/prompts";

export default defineLazyEventHandler(async () => {
const runtimeConfig = useRuntimeConfig()

const modelTag = 'stream-out'
const toolTag = 'tool-out'

type AIMsg = { role: string; content: string; name: string; toolsToCall?: string }

const weatherForecastTool = new DynamicStructuredTool({
  name: 'weatherForecastTool',
  description: 'Use to forecast the weather for the location the user has expressed an interest in',
  schema: z.object({
    lat : z.number().describe('The Latitude in decimal degree of the location to get forecast for'),
    long: z.number().describe('The Longitude in decimal degree of the location to get forecast for')
  }),
  func: async (input: { lat: number; long: number }) => {
    const { lat, long } = input;
    console.log('weatherForecastTool callled!!!!')
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${runtimeConfig.weatherAPIKey}&q=${lat},${long}&days=7&aqi=no&alerts=no`
    console.log('url', url)
    const forecast = await $fetch(url)
    // comes back as object, JSON.stringify it since it will be stored in ToolMessage.content
    return JSON.stringify(forecast)
  }
})

const toolsByName = new Map<string, StructuredToolInterface>()
toolsByName.set(weatherForecastTool.name, weatherForecastTool)

const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.6,
  apiKey: runtimeConfig.openaiAPIKey,
})

const checkpointer = PostgresSaver.fromConnString(
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
);
await checkpointer.setup()

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  sender: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "human",
    default: () => "human",
  }),
})

async function callLLM(messages: BaseMessage[], targetAgentNodes: string[], runName = 'callLLM', toolsToUse: DynamicStructuredTool<any>[] = []) {
  // without this if/else it seems like it will loop a few times before the LLM figures out 
  // that we have already gotten the weather forecast for example
  if (toolsToUse.length) {
    const outputSchema = z.object({
      response: z.string().describe("A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user."),
      goto: z.enum(["finish", "callTools", ...targetAgentNodes])
        .describe(`The next agent to call, 'callTools' if a tool should be used 
          or 'finish' if the user's query has been resolved. Must be one of the specified values.`),
      toolsToCall: z.string().optional().describe('A comma seperated list of tools to call if any, can be empty')
    })
    const toolNames = toolsToUse.map((tool) => `name: ${tool.name}, description: ${tool.description}`).join("\n")
    const prompt = await ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are collaborating with other assistants." +
        " Use the provided tools to progress towards answering the question." +
        " You have access to the following tools: {tool_names}.\n"
      ],
      new MessagesPlaceholder("messages"),
    ]).partial({
      tool_names: toolNames
    })
    return prompt.pipe(model.withStructuredOutput(outputSchema, {name: "Response"})).invoke({messages: messages}, {tags: [modelTag], runName: runName })
  } else {
    const outputSchema = z.object({
      response: z.string().describe("A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user."),
      goto: z.enum(["finish", ...targetAgentNodes])
        .describe(`The next agent to call, 
          or 'finish' if the user's query has been resolved. Must be one of the specified values.`),
      toolsToCall: z.string().optional().describe('A comma seperated list of tools to call if any, can be empty')
    })
    return model.withStructuredOutput(outputSchema, {name: 'Response'}).invoke(messages, {tags: [modelTag], runName: runName })
  }
}

async function travelAdvisor(state: typeof AgentState.State): Promise<Command> {
  console.log('travelAdvisor')
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
  console.log('goto', goto)
  return new Command({
    goto, 
    update: { 
      "messages": [aiMsg],
      "sender": 'travelAdvisor'
    } 
  });
  
}

async function sightseeingAdvisor(state: typeof AgentState.State): Promise<Command> {
  console.log('sightseeingAdvisor')
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
  const response = await callLLM(messages, targetAgentNodes, 'sightseeingAdvisor');
  const aiMsg = {"role": "ai", "content": response.response, "name": "sightseeingAdvisor"};
  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }  
  return new Command({
    goto, 
    update: { 
      "messages": [aiMsg],
      "sender": 'sightseeingAdvisor'
    } 
  });
}

async function hotelAdvisor(state: typeof AgentState.State): Promise<Command> {
  console.log('hotelAdvisor')
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
  const response = await callLLM(messages, targetAgentNodes, 'hotelAdvisor');
  const aiMsg = {"role": "ai", "content": response.response, "name": "hotelAdvisor"};
  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }  
  return new Command({
    goto, 
    update: { 
      "messages": [aiMsg] ,
      "sender": 'hotelAdvisor'
    } 
  });
}


async function weatherAdvisor(state: typeof AgentState.State): Promise<Command> {
  console.log('weatherAdvisor')
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
  let response;
  if (state.sender === 'callTools') {
    response = await callLLM(messages, targetAgentNodes, 'weatherAdvisor')
  } else {
    response = await callLLM(messages, targetAgentNodes, 'weatherAdvisor', [weatherForecastTool]);
  }

  const aiMsg: AIMsg = {
    role: "ai",
    content: response.response,
    name: "weatherAdvisor",
  }
  if (response.toolsToCall) {
    aiMsg.toolsToCall = response.toolsToCall
  }
  let goto = response.goto;
  if (goto === "finish") {
      goto = "human";
  }
  console.log('goto', goto)
  return new Command({
    goto, 
    update: { 
      "messages": [aiMsg],
      "sender": "weatherAdvisor",
    } 
  });

}

function humanNode(state: typeof AgentState.State): Command {
  console.log('humanNode')
  const userInput: string = interrupt("Ready for user input.");

  return new Command({
      goto: state.sender,
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

async function callTools(state: typeof AgentState.State): Promise<Command> {
  console.log('callTools')
  const lastMessage = state.messages[state.messages.length - 1] 
  const aiMsg = lastMessage as unknown as AIMsg
  const tools: StructuredToolInterface[] = 
    (aiMsg.toolsToCall) ? 
      aiMsg.toolsToCall.split(',')
        .map((name) => toolsByName.get(name))
        .filter(tool => tool !== undefined)
    : []

  if (tools.length) {
    const modelWithTools = model.bindTools(tools)
    const result = await modelWithTools.invoke(state.messages)
    const toolNode = new ToolNode(tools)
    const toolResults = await toolNode.invoke([...state.messages, result])
    return new Command({
      goto: state.sender,
      update: {
        "messages": [result, ...toolResults],
        "sender": "callTools"
      }
    })
  }

  return new Command({
    goto: state.sender
  })
}

const builder = new StateGraph(AgentState)
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
// add the weatherAdvsior
.addNode("weatherAdvisor", weatherAdvisor, {
  ends: ["human", "travelAdvisor", "sightseeingAdvisor", "hotelAdvisor", "callTools"]
})
.addNode("callTools", callTools, {
  ends: ["hotelAdvisor", "sightseeingAdvisor", "travelAdvisor", "weatherAdvisor"]
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
      new SystemMessage({content:`Use the tools and agents you have to figure out what to ask the user.
        Introduce yourself and give the user a summary of your skills and knowledge `})
    ]
  }
  const input = isInitMessage(lastMessage) ? initMessage : new Command({resume: lastMessage.content})
  
  const encoder = new TextEncoder()

  const config = {version: "v2" as const, configurable: {thread_id: sessionId},}
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of graph.streamEvents(input, config, {includeTags: [modelTag, toolTag]})) {
          if (event.event === 'on_chat_model_stream' && event.tags?.includes(modelTag)) {
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
          if (event.event === 'on_tool_end' && event.tags?.includes(toolTag)) {
            if (event.data.output && (event.data.output as ToolMessage).content.length) {
              const content = (event.data.output as ToolMessage).content as string
              console.log('on_tool_end content\n', Object.prototype.toString.call(content))
              const testObj = {
                banana: 'yes'
              }
    
              const part = `2:[${JSON.stringify(testObj)}]\n`
              controller.enqueue(part)
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