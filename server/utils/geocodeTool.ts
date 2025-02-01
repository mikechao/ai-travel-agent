import { DynamicStructuredTool } from '@langchain/core/tools'
import { consola } from 'consola'
import opencage from 'opencage-api-client'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

const geocodeTool = new DynamicStructuredTool({
  name: 'geocodeTool',
  description: 'Provides Latitude, Longitude and location for a place or address the user has expressed an interest in',
  schema: z.object({
    location: z.string().describe('The location or address to get Latitude and Longitude for'),
  }),
  func: async (input: { location: string }) => {
    const { location } = input
    consola.info(`geocodeTool call for ${location}`)
    const data = await opencage.geocode({ q: `${location}`, key: `${runtimeConfig.opencageAPIKey}` })
    const place = data.results[0]
    consola.log('place.geometry', place.geometry)
    const result = {
      location: place.formatted,
      ...place.geometry,
    }
    consola.log('result', result)
    return JSON.stringify(result)
  },
})

export const getGeocodeTool = () => geocodeTool
