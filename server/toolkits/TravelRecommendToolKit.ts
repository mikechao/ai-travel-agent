import type { EmbeddingsInterface } from '@langchain/core/embeddings'
import type { BaseLanguageModelInterface } from '@langchain/core/language_models/base'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { BaseToolkit, StructuredTool } from '@langchain/core/tools'
import { BraveSearch } from 'brave-search'
import { SafeSearchLevel } from 'brave-search/dist/types'
import { consola } from 'consola'
import { WebBrowser } from 'langchain/tools/webbrowser'
import { z } from 'zod'

interface QueryAndURL {
  query: string
  url: string
}

class SearchQueryTool extends StructuredTool {
  name = 'searchQueryTool'
  description = `Used to generate search queries that are relevant to a user's travel interest`
  schema = z.object({
    interest: z.string().describe(`The user's travel interest to generate search queries for`),
  })

  llm: BaseChatModel
  constructor(llm: BaseChatModel) {
    super({ responseFormat: 'content', verboseParsingErrors: false })
    this.llm = llm
  }

  protected async _call(input: { interest: string }): Promise<any> {
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

    const structuredLLM = this.llm.withStructuredOutput(outputSchema)

    const result = await structuredLLM.invoke([
      { role: 'system', content: queryPrompt },
      { role: 'user', content: `Please generate a list of search queries related to my travel interest of ${interest}` },
    ])

    consola.info('result', result)
    return result
  }
}

class SearchExecutionTool extends StructuredTool {
  name = 'searchExecutionTool'
  description = `Used to execute search queries generated by the \'searchQueryTool\'`
  schema = z.object({
    queries: z.array(z.string()).describe(`List of search queries to execute, generated by the \'searchQueryTool\'.`),
  })

  braveSearch: BraveSearch
  constructor() {
    super({ responseFormat: 'content', verboseParsingErrors: false })
    const runtimeConfig = useRuntimeConfig()
    this.braveSearch = new BraveSearch(runtimeConfig.braveAPIKey)
  }

  protected async _call(input: { queries: string[] }) {
    const { queries } = input
    consola.info('searchExecutionTool _call with ', queries)
    const results: QueryAndURL[] = []
    try {
      for (const query of queries) {
        const webSearchResult = await this.braveSearch.webSearch(query, {
          count: 10,
          safesearch: SafeSearchLevel.Moderate,
        })
        if (webSearchResult.web && webSearchResult.web.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * webSearchResult.web.results.length)
          const randomResult = webSearchResult.web.results[randomIndex]
          results.push({ query, url: randomResult.url })
        }
      }
    }
    catch (error) {
      consola.error('error executing search', error)
    }
    consola.info('results', results)
    return { queryAndURLs: results }
  }
}

class SearchSummaryTool extends StructuredTool {
  name = 'searchSummaryTool'
  description = 'Use to get a summary of an array of URLs'
  schema = z.object({
    queryAndURLs: z.array(z.object({
      query: z.string(),
      url: z.string(),
    })).describe('An array of query and URL pairs to get summaries for.'),
  })

  model: BaseLanguageModelInterface
  embeddings: EmbeddingsInterface
  constructor(llm: BaseLanguageModelInterface, embeddings: EmbeddingsInterface) {
    super({ responseFormat: 'content', verboseParsingErrors: false })
    this.model = llm
    this.embeddings = embeddings
  }

  protected async _call(input: { queryAndURLs: QueryAndURL[] }) {
    const results = []

    const browser = new WebBrowser({ model: this.model, embeddings: this.embeddings })
    try {
      for (const queryAndURL of input.queryAndURLs) {
        const url = queryAndURL.url
        const query = queryAndURL.query
        const result = await browser.invoke(`"${url}","${query}"`)
        consola.info('single result', result)
        results.push(result)
      }
    }
    catch (error) {
      consola.error('error using browser', error)
    }
    return results
  }
}

export class TravelRecommendToolKit extends BaseToolkit {
  tools: StructuredToolInterface[]

  searchQueryTool: StructuredTool
  searchExecutionTool: StructuredTool
  searchSummaryTool: StructuredTool
  constructor(llm: BaseChatModel, embeddings: EmbeddingsInterface) {
    super()
    this.searchQueryTool = new SearchQueryTool(llm)
    this.searchExecutionTool = new SearchExecutionTool()
    this.searchSummaryTool = new SearchSummaryTool(llm, embeddings)
    this.tools = [
      this.searchQueryTool,
      this.searchExecutionTool,
      this.searchSummaryTool,
    ]
  }

  getSearchQueryTool() {
    return this.searchQueryTool
  }

  getSearchExecutionTool() {
    return this.searchExecutionTool
  }

  getSearchSummaryTool() {
    return this.searchSummaryTool
  }
}
