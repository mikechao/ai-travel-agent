import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { URL } from 'url'

const runtimeConfig = useRuntimeConfig()

const hotelDetailsTool = new DynamicStructuredTool({
  name: 'hotelDetailsTool',
  description: 'Used to get additional details about a hotel',
  schema: z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named hotelSearchTool')
  }),
  func: async ({ locationId }: { locationId: string }) => {
    console.log(`hotelDetailsTool called with locationId: ${locationId}`)
    const locationDetailsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details`)
    locationDetailsURL.searchParams.set('key',`${runtimeConfig.tripAdvisorAPIKey}`)
    console.log('locationDetailsURL', locationDetailsURL.toString())

    try {
      const response = $fetch(locationDetailsURL.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      })
      return JSON.stringify(response)
    } catch (error) {
      console.error('error fetching location details', error)
      return 'Error fetching location details'
    }

  }
})