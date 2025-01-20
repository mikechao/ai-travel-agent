import { z } from "zod"
import { DynamicStructuredTool, StructuredTool, tool } from '@langchain/core/tools'
import { Annotation, Command, END, interrupt, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { 
  Message as VercelChatMessage, 
  formatDataStreamPart 
} from 'ai'
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { ChatOpenAI } from "@langchain/openai"
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, isAIMessageChunk, SystemMessage, ToolMessage } from "@langchain/core/messages"
import { Runnable, RunnableConfig } from "@langchain/core/runnables"
import { convertToOpenAITool } from "@langchain/core/utils/function_calling"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"

export default defineLazyEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()

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

  const tools = [weatherForecastTool, ]
  const toolNode = new ToolNode<typeof AgentState.State>(tools)

  const llm = new ChatOpenAI({
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
      reducer: (x, y) => y ?? x ?? "user",
      default: () => "user",
    }),
  })

  type Resposne = {
    response: string,
    goto: string
  }
  const parser = new JsonOutputParser<Resposne>()

  async function createAgent({
    llm,
    tools,
    systemMessage,
    targetAgentNodes,
  }: {
    llm: ChatOpenAI;
    tools: StructuredTool[];
    systemMessage: string;
    targetAgentNodes: string[];
  }): Promise<Runnable> {
    const functionName = "Response"
    const toolNames = tools.map((tool) => tool.name).join(", ") + ',' + functionName;
    const formattedTools = tools.map((t) => convertToOpenAITool(t));
  
  const formatInstructions = `Respond only in valid JSON. The JSON object you return should match the following schema:
      {response: "string", goto: "string} 
      Where response is A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user. 
      goto is The next agent to call, or 'finish' if the user's query has been resolved.
      goto must be one of the following values: ['finish', ${targetAgentNodes.join(',')}]
  `

    let prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are collaborating with other assistants." +
        " Use the provided tools to progress towards answering the question." +
        " You have access to the following tools: {tool_names}.\n{system_message} " +
        "Wrap the output in `json` tags\n{format_instructions}"
      ],
      new MessagesPlaceholder("messages"),
    ]);
    prompt = await prompt.partial({
      system_message: systemMessage,
      tool_names: toolNames,
      format_instructions: formatInstructions
    });

    return prompt.pipe(llm.bind({ tools: formattedTools }));
  }

  async function runAgentNode(props: {
    state: typeof AgentState.State;
    agent: Runnable;
    name: string;
    config?: RunnableConfig;
  }) {
    const { state, agent, name, config } = props;
    console.log(`runAgentNode name: ${name}`)
    const result = await agent.invoke(state, config);
    const aiMessageCheck = result as AIMessageChunk
    if (aiMessageCheck.content) {
      const parsed = await parser.parse(aiMessageCheck.content as string)
      const aiMsg = {"role": "ai", "content": parsed.response, "name": name}
      let goto = parsed.goto
      if (goto === "finish") {
          goto = "human"
      }
      console.log(`goto: ${goto} result:${result}`)
      return new Command({
        goto,
        update: { 
          "messages": [aiMsg],
          "sender": name
        }
      })
    } else {
      console.log('here')
      return new Command({
        goto: 'call_tool',
        update: {
          "messages": [result],
          "sender": name
        }
      })
    }

  }

  const travelAdvisor = await createAgent({
    llm,
    tools: [],
    systemMessage: `Your name is Pluto the pup and you are a general travel expert that can recommend travel destinations (e.g. countries, cities, etc). 
    Be sure to bark a lot and use dog related emojis ` +
    "If you need weather forecast and clothing to pack, ask 'WeatherAdvisor' named Petey the Pirate for help" +
    "Feel free to mention the other agents by name, but call them your colleagues or similar.",
    targetAgentNodes: ["WeatherAdvisor", 'human']
  })

  async function travelAdvisorNode(
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    const result = await runAgentNode({
      state: state,
      agent: travelAdvisor,
      name: "TravelAdvisor",
      config
    })
    return result
  }

  const weatherAdvsior = await createAgent({
    llm,
    tools: [weatherForecastTool],
    systemMessage:     `Your name is Petey the Pirate and you are a travel expert that can provide the weather forecast 
    for a given destination and duration. When you get a weather forecast also recommand what types 
    of clothes the user should pack for their trip ` +
    "Talke to the user like a pirate and use pirate related emojis " +
    "If you need general travel help, go to 'TravelAdvisor' named Pluto the pup for help. " +
    "Feel free to meantion the other agents by name, but in a pirate way",
    targetAgentNodes: ['TravelAdvisor', 'human']
  })

  async function weatherAdvisorNode(
    staet: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    console.log('weatherAdvisorNode')
    const result = runAgentNode({
      state: staet,
      agent: weatherAdvsior,
      name: "WeatherAdvisor",
      config
    })
    return result
  }

  function humanNode(state: typeof AgentState.State): Command {
    const userInput: string = interrupt("Ready for user input.");
    console.log(`userInput ${userInput}`)
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
    console.log(`activeAgent ${activeAgent}`)
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

  async function callToolsNode(state: typeof AgentState.State): Promise<Command> {
    console.log('callToolsNode state.sender', state.sender)
    const lastMessage = state.messages[state.messages.length - 1]
    const toolResult = await toolNode.invoke([lastMessage], {tags: ["tools"]})
    const resultMessages = [lastMessage, ...toolResult]
    console.log(resultMessages)
    return new Command({
      goto: state.sender,
      update: { "messages": [...toolResult]}
    })
  }

  const workflow = new StateGraph(AgentState)
    .addNode("TravelAdvisor", travelAdvisorNode, {
      ends: ["WeatherAdvisor", "call_tool"]
    })
    .addNode("WeatherAdvisor", weatherAdvisorNode, {
      ends: ["TravelAdvisor", "call_tool", "human"]
    })
    .addNode("human", humanNode, {
      ends: ["TravelAdvisor", "WeatherAdvisor"]
    })
    .addNode("call_tool", callToolsNode, {
      ends: ["TravelAdvisor", "WeatherAdvisor", "human"]
    })
    .addEdge(START, "TravelAdvisor")

  const graph = workflow.compile()

  return defineEventHandler(async (webEvent) => {
    const body = await readBody(webEvent)
    const { messages, sessionId } = body
    console.log('\nReceived request sessionId', sessionId)
  
    const lastMessage: VercelChatMessage = messages[0]
    console.log('lastMessage', lastMessage.content)
  
    const initMessage = {
      messages: [
        new SystemMessage({content: `Use the tools and agents you have to figure out what to ask the user.
          Introduce yourself and give the user a summary of your skills and knowledge `})
      ]
    }
    const userMessage = {
      messages: [
        new HumanMessage({ content: lastMessage.content})
      ]
    }
    const input = isInitMessage(lastMessage) ? initMessage : userMessage

    const encoder = new TextEncoder()
    const config = {version: "v2" as const, configurable: {thread_id: sessionId},}
    return new ReadableStream({
      async start(controller) {

        //events Set(10) {
  // 'on_chain_start',
  // 'on_chain_end',
  // 'on_prompt_start',
  // 'on_prompt_end',
  // 'on_chat_model_start',
  // 'on_chat_model_stream',
  // 'on_chat_model_end',
  // 'on_parser_start',
  // 'on_parser_end',
  // 'on_chain_stream' }
        const set = new Set()
        try {
          for await (const event of graph.streamEvents(input, config)) {
            set.add(event.event)
            if (event.event === 'on_chat_model_stream') {
              if (isAIMessageChunk(event.data.chunk)) {
                const aiMessageChunk = event.data.chunk as AIMessageChunk
                if (aiMessageChunk.content) {
                  const part = formatDataStreamPart('text', aiMessageChunk.content as string)
                  controller.enqueue(encoder.encode(part))
                }
              }
            }
            if (event.event === 'on_tool_end') {
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
          // console.log('events', set)
          controller.close()
        }
      },
    })
  })
})