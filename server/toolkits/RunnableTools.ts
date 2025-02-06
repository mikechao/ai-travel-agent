import type { EmbeddingsInterface } from '@langchain/core/embeddings'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { Runnable, RunnableEach, RunnableLambda, RunnableMap, RunnablePick } from '@langchain/core/runnables'
import { consola } from 'consola'

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

interface SearchExecutionOuput {
  queryAndURLs: QueryAndURL[]
}

type SearchSummaryInput = QueryAndURL

interface SearchSummaryOutput {
  results: string[]
}

export class RunnableTools {
  llm: BaseChatModel
  embeddings: EmbeddingsInterface

  constructor(llm: BaseChatModel, embeddings: EmbeddingsInterface) {
    this.llm = llm
    this.embeddings = embeddings
  }

  createSearchQueryRunnable() {
    return RunnableLambda.from<SearchQueryInput, SearchQueryOutput>((input: SearchQueryInput) => {
      consola.info('searchQueryRunnable called with ', input.interest)
      const results = ['best cat cafes in the world', 'cat travel tips']
      return { queries: results }
    })
  }

  createSearchExecutionRunnable() {
    return RunnableLambda.from<SearchExecutionInput, QueryAndURL[]>((input: SearchExecutionInput) => {
      consola.info('searchExecutionRunnable called with ', input.queries)

      const results: QueryAndURL[] = [
        { query: 'best cat cafes in the world', url: 'https://www.cats.com' },
        { query: 'cat travel tips', url: 'https://www.cat-travel-tips.com' },
      ]

      return results
    })
  }

  createSearchSummaryRunnable() {
    return RunnableLambda.from<QueryAndURL, SearchSummaryOutput>((input: QueryAndURL) => {
      consola.info(`searchSummaryRunnable called with ${JSON.stringify(input)} ${performance.now()}`)
      const results: string[] = [`summary 1 ${JSON.stringify(input)}`]

      return { results }
    })
  }

  createRunnableMap() {
    const searchQueryRunnable = this.createSearchQueryRunnable()
    const searchExecutionRunnable = this.createSearchExecutionRunnable()
    const searchSummaryRunnable = this.createSearchSummaryRunnable()
    const chain = searchQueryRunnable
      .pipe(searchExecutionRunnable)
      .pipe(new RunnableEach({
        bound: searchSummaryRunnable,
      }))

    return chain
  }
}
