import { URL } from 'node:url'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { consola } from 'consola'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

const hotelReviewsTool = new DynamicStructuredTool({
  name: 'hotelReviewsTool',
  description: 'Used to get hotel reivews, needs location_id from hotelSearchTool ',
  schema: z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named hotelSearchTool'),
  }),
  func: async ({ locationId }: { locationId: string }) => {
    consola.info(`hotelReviewsTool called with locationId: ${locationId}`)
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
      consola.error('error fetching hotel reviews', error)
      return 'Error fetching hotel reviews'
    }
  },
})

export const getHotelReviewsTool = () => hotelReviewsTool
