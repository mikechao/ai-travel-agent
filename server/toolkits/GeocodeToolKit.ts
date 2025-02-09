import type { StructuredToolInterface } from '@langchain/core/tools'
import { BaseToolkit, StructuredTool } from '@langchain/core/tools'
import { consola } from 'consola'
import opencage from 'opencage-api-client'
import { z } from 'zod'

const runtimeConfig = useRuntimeConfig()

class GeocodeTool extends StructuredTool {
  name = 'geocodeTool'
  description = 'Provides Latitude, Longitude and location for a place or address the user has expressed an interest in'
  schema = z.object({
    location: z.string().describe('The location or address to get Latitude and Longitude for'),
  })

  protected async _call(input: { location: string }) {
    const location = input.location
    consola.debug({ tag: 'geocodeTool', message: `geocodeTool call for ${location}` })
    const data = await opencage.geocode({ q: `${location}`, key: `${runtimeConfig.opencageAPIKey}` })
    const place = data.results[0]
    const result = {
      location: place.formatted,
      ...place.geometry,
    }
    consola.debug({ tag: 'geocodeTool', message: `result ${JSON.stringify(result)}` })
    return JSON.stringify(result)
  }
}

export class GeocodeToolKit extends BaseToolkit {
  tools: StructuredToolInterface[]

  constructor() {
    super()
    this.tools = [new GeocodeTool()]
  }
}
