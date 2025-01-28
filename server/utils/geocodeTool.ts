import { DynamicStructuredTool } from '@langchain/core/tools'
import { consola } from 'consola'
import opencage from 'opencage-api-client'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

const geocodeTool = new DynamicStructuredTool({
  name: 'geocodeTool',
  description: 'Use to get the Latitude and Longitude for a location the user has expressed an interest in',
  schema: z.object({
    location: z.string().describe('The location to get Latitude and Longitude for'),
  }),
  func: async (input: { location: string }) => {
    const { location } = input
    consola.info(`geocodeTool call for ${location}`)
    const data = await opencage.geocode({ q: `${location}`, key: `${runtimeConfig.opencageAPIKey}` })
    const place = data.results[0]
    consola.log('place.geometry', place.geometry)
    return JSON.stringify(place.geometry)
  },
})

export const getGeocodeTool = () => geocodeTool
