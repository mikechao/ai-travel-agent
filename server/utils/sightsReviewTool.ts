import { URL } from 'node:url'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { consola } from 'consola'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

const sightsReviewsTool = new DynamicStructuredTool({
  name: 'sightsReviewsTool',
  description: 'Used to get sights or attractions reivews, needs location_id from sightseeingSearchTool ',
  schema: z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named sightseeingSearchTool'),
  }),
  func: async ({ locationId }: { locationId: string }) => {
    consola.info(`sightsReviewsTool called with locationId: ${locationId}`)
    const reviewsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/reviews`)
    reviewsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    consola.info('reviewsURL', reviewsURL.toString())
    try {
      const response = await $fetch(reviewsURL.toString(), {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      })
      return JSON.stringify(response)
    }
    catch (error) {
      consola.error('error fetching sights reviews', error)
      return 'Error fetching sights reviews'
    }
  },
})

export const getSightsReviewsTool = () => sightsReviewsTool
