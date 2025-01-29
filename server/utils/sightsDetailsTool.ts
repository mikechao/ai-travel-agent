import { URL } from 'node:url'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { consola } from 'consola'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

const sightsDetailsTool = new DynamicStructuredTool({
  name: 'sightsDetailsTool',
  description: 'Used to get additional details about a sight to see, needs location_id from sightseeingSearchTool',
  schema: z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named sightseeingSearchTool'),
  }),
  func: async ({ locationId }: { locationId: string }) => {
    consola.info(`sightsDetailsTool called with locationId ${locationId}`)
    const sightDetailsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details`)
    sightDetailsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    consola.info('sightDetailsURL', sightDetailsURL.toString())

    try {
      const response = await $fetch(sightDetailsURL.toString(), {
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

export const getSightsDetailsTool = () => sightsDetailsTool
