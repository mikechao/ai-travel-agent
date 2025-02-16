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

class ImageSearchTool extends StructuredTool {
  name = 'imageSearchTool'
  description = `Searches the internet for images that are related to the user's interests`
  schema = z.object({
    searchTerm: z.string().describe('The term to search the internet for images of'),
  })

  responseFormat = 'content_and_artifact'

  protected async _call(input: { searchTerm: string }) {
    const searchTerm = input.searchTerm
    consola.debug({ tag: 'imageSearchTool', message: `called with ${searchTerm}` })
    const searchURL = new URL('https://api.search.brave.com/res/v1/images/search')
    searchURL.searchParams.set('q', searchTerm)
    searchURL.searchParams.set('safesearch', 'strict')
    searchURL.searchParams.set('count', '6')

    try {
      const results = await $fetch(searchURL.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': runtimeConfig.braveAPIKey,
        },
      })
      return [`I found 6 images related to ${searchTerm}`, '']
    }
    catch (error) {
      consola.error('error searching for images', error)
      return ['Something went wrong when searching for images', '']
    }
  }
}

export class GeocodeToolKit extends BaseToolkit {
  tools: StructuredToolInterface[]

  constructor() {
    super()
    this.tools = [new GeocodeTool(), new ImageSearchTool()]
  }
}
