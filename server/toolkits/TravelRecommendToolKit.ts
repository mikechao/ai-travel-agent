import type { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import type { EmbeddingsInterface } from '@langchain/core/embeddings'
import type { BaseLanguageModelInterface } from '@langchain/core/language_models/base'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface, ToolRunnableConfig } from '@langchain/core/tools'
import { BaseToolkit, StructuredTool } from '@langchain/core/tools'
import { BraveSearch } from 'brave-search/dist/braveSearch.js'
import { consola } from 'consola'
import { WebBrowser } from 'langchain/tools/webbrowser'
import { z } from 'zod'

interface SearchResult {
  query: string
  url: string
  title: string
  description: string
}

// seems like we need this to workaround
// vercel not being able to resolve it from
// the brave-search package
enum SafeSearchLevel {
  Off = 'off',
  Moderate = 'moderate',
  Strict = 'strict',
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

  protected async _call(input: { interest: string }, _runManager?: CallbackManagerForToolRun, parentConfig?: ToolRunnableConfig): Promise<any> {
    const { interest } = input
    consola.debug({ tag: 'searchQueryTool', message: `searchQueryTool called with ${interest}` })

    const queryPrompt = `You are a search query generator tasked with creating 
    targeted search queries to gather specific travel information or ideas related
    to the user's interest of ${interest}. 
    Generate at most 5 search queries that will help the user with their research 
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
    ], parentConfig)

    consola.debug({ tag: 'searchQueryTool', message: `result ${JSON.stringify(result)}` })
    return JSON.stringify(result)
  }
}

class SearchExecutionTool extends StructuredTool {
  name = 'searchExecutionTool'
  description = `Used to execute a search query related to the user's travel interests on the internet generated by the \'searchQueryTool\'`
  schema = z.object({
    query: z.string().describe(`List of search queries to execute, generated by the \'searchQueryTool\'.`),
  })

  braveSearch: BraveSearch
  constructor() {
    super({ responseFormat: 'content', verboseParsingErrors: false })
    const runtimeConfig = useRuntimeConfig()
    this.braveSearch = new BraveSearch(runtimeConfig.braveAPIKey)
  }

  protected async _call(input: { query: string }) {
    const { query } = input
    consola.debug({ tag: 'searchExecutionTool', message: `_call with ${query}` })
    const results: SearchResult[] = []
    try {
      const webSearchResult = await this.braveSearch.webSearch(query, {
        count: 5,
        safesearch: SafeSearchLevel.Moderate,
      })
      if (webSearchResult.web && webSearchResult.web.results.length > 0) {
        webSearchResult.web.results.forEach((result) => {
          results.push({ query, url: result.url, title: result.title, description: result.description })
        })
      }
    }
    catch (error) {
      consola.error('error executing search', error)
    }
    consola.debug({ tag: 'searchExecutionTool', message: `searchExecutionTool found ${results.length}` })
    return JSON.stringify(results)
  }
}

class SearchSummaryTool extends StructuredTool {
  name = 'searchSummaryTool'
  description = `Provides a summary or more details about a website that could be mentioned by title or search result that the user is interested in`
  schema = z.object({
    searchResult: z.object({
      query: z.string(),
      url: z.string(),
      title: z.string(),
      description: z.string(),
    }).describe('A Search Result that contains an url for a website to get summary for.'),
  })

  model: BaseLanguageModelInterface
  embeddings: EmbeddingsInterface
  constructor(llm: BaseLanguageModelInterface, embeddings: EmbeddingsInterface) {
    super({ responseFormat: 'content', verboseParsingErrors: false })
    this.model = llm
    this.embeddings = embeddings
  }

  protected async _call(input: { searchResult: SearchResult }, _runManager?: CallbackManagerForToolRun, parentConfig?: ToolRunnableConfig) {
    consola.debug({ tag: `searchSummaryTool`, message: 'called' })
    const before = performance.now()
    const browser = new WebBrowser({ model: this.model, embeddings: this.embeddings })
    try {
      const url = input.searchResult.url
      const query = input.searchResult.query
      const result = await browser.invoke(`"${url}","${query}"`, parentConfig)
      const after = performance.now()
      consola.debug({ tag: `searchSummaryTool`, message: `got results in ${after - before} ms` })
      return JSON.stringify(result)
    }
    catch (error) {
      consola.error('error using browser', error)
      return 'An error happened when I was using the webbrowser'
    }
  }
}

export class TravelRecommendToolKit extends BaseToolkit {
  tools: StructuredToolInterface[]

  private readonly searchQueryTool: StructuredTool
  private readonly searchExecutionTool: StructuredTool
  private readonly searchSummaryTool: StructuredTool
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
