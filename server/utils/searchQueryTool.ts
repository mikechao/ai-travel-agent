import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { consola } from 'consola'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.6,
  apiKey: runtimeConfig.openaiAPIKey,
})

const outputSchema = z.object({
  queries: z.array(z.string()).describe('List of search queries.'),
})

const searchQueryTool = new DynamicStructuredTool({
  name: 'searchQueryTool',
  description: `Used to generate search queries that are relevant to a user's travel interest`,
  schema: z.object({
    interest: z.string().describe(`The user's travel interest to generate search queries for`),
  }),
  func: async (input: { interest: string }) => {
    const { interest } = input
    consola.info(`searchQueryTool called with ${interest}`)

    const queryPrompt = `You are a search query generator tasked with creating 
    targeted search queries to gather specific travel information or ideas related
    to the user's interest of ${interest}. 
    Generate at most 3 search queries that will help the user with their reasearch 
    about their travel interest. 
    Your query should: 
    1. Focus on finding factual, interesting travel information and ideas 
    2. Target travel news, blogs and other travel related sources 
    3. Prioritize finding information that matches the user's interest of ${interest} 
    4. Be specific enough to avoid irrelevant results 
    Create a focused query that will maximize the chances of finding relevant information`

    const structuredLLM = model.withStructuredOutput(outputSchema)

    const result = structuredLLM.invoke([
      { role: 'system', content: queryPrompt },
      { role: 'user', content: `Please generate a list of search queries related to my travel interest of ${interest}` },
    ])

    consola.info('result', result)
    return JSON.stringify(result)
  },
})

export const getSearchQueryTool = () => searchQueryTool
