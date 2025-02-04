import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { BaseToolkit, DynamicStructuredTool, Tool } from '@langchain/core/tools'
import { consola } from 'consola'
import { z } from 'zod'

class SearchQueryTool extends DynamicStructuredTool {
  static lc_name(): string {
    return 'SearchQueryTool'
  }

  llm: BaseChatModel

  constructor(llm: BaseChatModel) {
    super({
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

        const outputSchema = z.object({
          queries: z.array(z.string()).describe('List of search queries.'),
        })

        const structuredLLM = llm.withStructuredOutput(outputSchema)

        const result = await structuredLLM.invoke([
          { role: 'system', content: queryPrompt },
          { role: 'user', content: `Please generate a list of search queries related to my travel interest of ${interest}` },
        ])

        consola.info('result', result)
        return JSON.stringify(result)
      },
    })
    this.llm = llm
  }
}

export class TravelRecommendToolKit extends BaseToolkit {
  tools: StructuredToolInterface[]

  constructor(llm: BaseChatModel) {
    super()
    this.tools = [
      new SearchQueryTool(llm),
    ]
  }
}
