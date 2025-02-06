import type { EmbeddingsInterface } from '@langchain/core/embeddings'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { RunnableEach, RunnableLambda } from '@langchain/core/runnables'
import { BraveSearch } from 'brave-search'
import { SafeSearchLevel } from 'brave-search/dist/types'
import { consola } from 'consola'
import { WebBrowser } from 'langchain/tools/webbrowser'
import { z } from 'zod'

interface SearchQueryInput {
  interest: string
}

interface SearchQueryOutput {
  queries: string[]
}

type SearchExecutionInput = SearchQueryOutput

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
    return RunnableLambda.from<SearchQueryInput, SearchQueryOutput>(async (input: SearchQueryInput) => {
      consola.info('searchQueryRunnable called with ', input.interest)

      const interest = input.interest

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
    })
  }

  createSearchExecutionRunnable(braveSearch: BraveSearch) {
    return RunnableLambda.from<SearchExecutionInput, QueryAndURL[]>(async (input: SearchExecutionInput) => {
      consola.info('searchExecutionRunnable called with ', input.queries)

      const results: QueryAndURL[] = []
      try {
        for (const query of input.queries) {
          const webSearchResult = await braveSearch.webSearch(query, {
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
      return results
    })
  }

  createSearchSummaryRunnable() {
    return RunnableLambda.from<QueryAndURL, string>(async (input: QueryAndURL) => {
      consola.info(`searchSummaryRunnable called with ${JSON.stringify(input)} ${performance.now()}`)
      const browser = new WebBrowser({model: this.llm, embeddings: this.embeddings})

      try{
        const url = input.url
        const query = input.query
        const result = await browser.invoke(`"${url}","${query}"`)
        return result
      } catch (error) {
        consola.error('error using browser', error)
      }
      return 'Error happened'
    })
  }

  createRunnableMap() {
    const runtimeConfig = useRuntimeConfig()
    const braveSearch = new BraveSearch(runtimeConfig.braveAPIKey)
    const searchQueryRunnable = this.createSearchQueryRunnable()
    const searchExecutionRunnable = this.createSearchExecutionRunnable(braveSearch)
    const searchSummaryRunnable = this.createSearchSummaryRunnable()
    const chain = searchQueryRunnable
      .pipe(searchExecutionRunnable)
      .pipe(new RunnableEach({
        bound: searchSummaryRunnable,
      }))

    return chain
  }
}
