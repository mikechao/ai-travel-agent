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
import { AIMessage, BaseMessage, HumanMessage, ToolMessage } from "@langchain/core/messages"
import { Runnable, RunnableConfig } from "@langchain/core/runnables"
import { convertToOpenAITool } from "@langchain/core/utils/function_calling"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"

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

  const askHumanTool = tool((_) => {
    const userInput = interrupt('ready for user input')
    return userInput
  }, {
    name: "askHuman",
    description: "Ask the human for input.",
    schema: z.string(),
  });
  const tools = [weatherForecastTool, askHumanTool]
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

  async function createAgent({
    llm,
    tools,
    systemMessage,
  }: {
    llm: ChatOpenAI;
    tools: StructuredTool[];
    systemMessage: string;
  }): Promise<Runnable> {
    const toolNames = tools.map((tool) => tool.name).join(", ");
    const formattedTools = tools.map((t) => convertToOpenAITool(t));
  
    let prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a helpful AI assistant, collaborating with other assistants." +
        " Use the provided tools to progress towards answering the question." +
        " If you are unable to fully answer, that's OK, another assistant with different tools " +
        " will help where you left off. Execute what you can to make progress." +
        " If you or any of the other assistants have the final answer or deliverable," +
        " prefix your response with FINAL ANSWER so the team knows to stop." +
        " You have access to the following tools: {tool_names}.\n{system_message}",
      ],
      new MessagesPlaceholder("messages"),
    ]);
    prompt = await prompt.partial({
      system_message: systemMessage,
      tool_names: toolNames,
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
    let result = await agent.invoke(state, config);
    // We convert the agent output into a format that is suitable
    // to append to the global state
    if (!result?.tool_calls || result.tool_calls.length === 0) {
      // If the agent is NOT calling a tool, we want it to
      // look like a human message.
      result = new HumanMessage({ ...result, name: name });
    }
    return {
      messages: [result],
      // Since we have a strict workflow, we can
      // track the sender so we know who to pass to next.
      sender: name,
    };
  }

  const travelAdvisor = await createAgent({
    llm,
    tools: [askHumanTool],
    systemMessage: `Your name is Pluto the pup and you are a general travel expert that can recommend travel destinations (e.g. countries, cities, etc). 
    Be sure to bark a lot and use dog related emojis ` +
    "If you need weather forecast and clothing to pack, ask 'weatherAdvisor named Petey the Pirate for help" +
    "Feel free to mention the other agents by name, but call them your colleagues or similar."
  })

  async function travelAdvisorNode(
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    return runAgentNode({
      state: state,
      agent: travelAdvisor,
      name: "TravelAdvisor",
      config
    })
  }

  const weatherAdvsior = await createAgent({
    llm,
    tools: [askHumanTool, weatherForecastTool],
    systemMessage:     `Your name is Petey the Pirate and you are a travel expert that can provide the weather forecast 
    for a given destination and duration. When you get a weather forecast also recommand what types 
    of clothes the user should pack for their trip ` +
    "Talke to the user like a pirate and use pirate related emojis " +
    "If you need general travel help, go to 'travelAdvisor' named Pluto the pup for help. " +
    "Feel free to meantion the other agents by name, but in a pirate way"
  })

  async function weatherAdvisorNode(
    staet: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    return runAgentNode({
      state: staet,
      agent: weatherAdvsior,
      name: "WeatherAdvisor",
      config
    })
  }

  function router(state: typeof AgentState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
      // The previous agent is invoking a tool
      return "call_tool";
    }
    if (
      typeof lastMessage.content === "string" &&
      lastMessage.content.includes("FINAL ANSWER")
    ) {
      // Any agent decided the work is done
      return "end";
    }
    return "continue";
  }

  const workflow = new StateGraph(AgentState)
    .addNode("TravelAdvisor", travelAdvisorNode)
    .addNode("WeatherAdvisor", weatherAdvisorNode)
    .addNode("call_tool", toolNode)

  workflow.addConditionalEdges("WeatherAdvisor", router, {
    continue: "TravelAdvisor",
    call_tool: "call_tool",
    end: END
  })

  workflow.addConditionalEdges("call_tool", (x) => x.sender, {
    TravelAdvisor: "TravelAdvisor",
    WeatherAdvisor: "WeatherAdvisor"
  })

  workflow.addEdge(START, "TravelAdvisor")

  const graph = workflow.compile()

  return defineEventHandler(async (webEvent) => {
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
    
  })
})