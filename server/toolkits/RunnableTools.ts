import type { EmbeddingsInterface } from '@langchain/core/embeddings'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { RunnableEach, RunnableLambda } from '@langchain/core/runnables'
import { BraveSearch } from 'brave-search/dist/braveSearch.js'
import { consola } from 'consola'
import { WebBrowser } from 'langchain/tools/webbrowser'
import { z } from 'zod'

// seems like we need this to workaround
// vercel not being able to resolve it from
// the brave-search package
enum SafeSearchLevel {
  Off = 'off',
  Moderate = 'moderate',
  Strict = 'strict',
}

interface SearchQueryInput {
  interest: string
}

interface QueryAndURL {
  query: string
  url: string
}

export class RunnableTools {
  llm: BaseChatModel
  embeddings: EmbeddingsInterface

  constructor(llm: BaseChatModel, embeddings: EmbeddingsInterface) {
    this.llm = llm
    this.embeddings = embeddings
  }

  createSearchQueryRunnable() {
    return RunnableLambda.from<SearchQueryInput, string[]>(async (input: SearchQueryInput) => {
      consola.info('searchQueryRunnable called with ', input.interest)

      const interest = input.interest

      const queryPrompt = `You are a search query generator tasked with creating 
      targeted search queries to gather specific travel information or ideas related
      to the user's interest of ${interest}. 
      Generate at most 3 search queries that will help the user with their research 
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
      return result.queries
    })
  }

  createSearchExecutionRunnable(braveSearch: BraveSearch) {
    return RunnableLambda.from<string, QueryAndURL>(async (input: string) => {
      consola.info(`searchExecutionRunnable called with ${input} ${performance.now()}`)

      try {
        const webSearchResult = await braveSearch.webSearch(input, {
          count: 10,
          safesearch: SafeSearchLevel.Moderate,
        })
        if (webSearchResult.web && webSearchResult.web.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * webSearchResult.web.results.length)
          const randomResult = webSearchResult.web.results[randomIndex]
          return { query: input, url: randomResult.url }
        }
      }
      catch (error) {
        consola.error('error executing search', error)
      }
      return { query: input, url: 'error' }
    })
  }

  createSearchSummaryRunnable() {
    return RunnableLambda.from<QueryAndURL, string>(async (input: QueryAndURL) => {
      consola.info(`searchSummaryRunnable called with ${JSON.stringify(input)} ${performance.now()}`)
      if (input.url === 'error') {
        return ''
      }
      const browser = new WebBrowser({ model: this.llm, embeddings: this.embeddings })

      try {
        const url = input.url
        const query = input.query
        const result = await browser.invoke(`"${url}","${query}"`)
        return result
      }
      catch (error) {
        consola.error('error using browser', error)
      }
      return 'Error happened'
    })
  }

  /**
   *
   * @returns a chainable runnable where we will
   * generate 3 search queries based on an input of interest
   * then run in parallel the execution of each search query
   * and the summarization of the search results
   */
  createWholeChain() {
    const runtimeConfig = useRuntimeConfig()
    const braveSearch = new BraveSearch(runtimeConfig.braveAPIKey)
    const searchQueryRunnable = this.createSearchQueryRunnable()
    const searchExecutionRunnable = this.createSearchExecutionRunnable(braveSearch)
    const searchSummaryRunnable = this.createSearchSummaryRunnable()

    // we parallelize the searchExecution and summary but overall it is still
    // pretty slow
    const chain = searchQueryRunnable
      .pipe(new RunnableEach({
        bound: searchExecutionRunnable.pipe(searchSummaryRunnable),
      }))

    return chain
  }
}
