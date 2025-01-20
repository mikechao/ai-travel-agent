import { z } from "zod"
import { DynamicStructuredTool, StructuredTool, tool } from '@langchain/core/tools'
import { Annotation, Command, END, interrupt, MessagesAnnotation } from '@langchain/langgraph'
import { 
  Message as VercelChatMessage, 
  formatDataStreamPart 
} from 'ai'
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { ChatOpenAI } from "@langchain/openai"
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages"
import { Runnable } from "@langchain/core/runnables"
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

  const toolNode = new ToolNode([weatherForecastTool])

  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.6,
    apiKey: runtimeConfig.openaiAPIKey,
  })

  const modelWithTools = model.bindTools([weatherForecastTool])
  
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

  async function callModel(state: typeof MessagesAnnotation.State): Promise<Partial<typeof MessagesAnnotation.State>> {
    console.log('callModel called')
    const messages = state.messages;
    const response = await modelWithTools.invoke(messages);
    if (response.content && response.content.length > 0) {
      console.log("response.content", response.content)
    } else if (response.tool_calls && response.tool_calls.length > 0) {
      console.log('response.tool_calls[0].name', response.tool_calls[0].name)
      console.log('response.tool_calls[0].args', response.tool_calls[0].args)
    } else {
      console.dir(response)
    }
    // We return an object with a messages property, because this will get added to the existing list
    return { messages: [response] };
  }

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