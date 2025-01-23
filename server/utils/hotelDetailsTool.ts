import { URL } from 'node:url'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { consola } from 'consola'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

const hotelDetailsTool = new DynamicStructuredTool({
  name: 'hotelDetailsTool',
  description: 'Used to get additional details about a hotel',
  schema: z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named hotelSearchTool'),
  }),
  func: async ({ locationId }: { locationId: string }) => {
    consola.info(`hotelDetailsTool called with locationId: ${locationId}`)
    const locationDetailsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details`)
    locationDetailsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    consola.info('locationDetailsURL', locationDetailsURL.toString())

    try {
      const response = await $fetch(locationDetailsURL.toString(), {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      })
      return JSON.stringify(response)
    }
    catch (error) {
      console.error('error fetching location details', error)
      return 'Error fetching location details'
    }
  },
})

export const getHotelDetailsTool = () => hotelDetailsTool
