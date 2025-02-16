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

function toHTML(imageResults: ImageSearchApiResponse) {
  const galleryStart = `<div class="image-gallery grid grid-cols-2 gap-4 p-4">`
  const middle = imageResults.results.map(result =>
    `<div class="image-container relative rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
    onclick="window.dispatchEvent(new CustomEvent('show-full-image', { detail: { url: '${result.properties.url}', title: '${result.title}', caption: '${result.properties.url}' }}))"
    >
      <img src="${result.properties.url}" alt="${result.title}" class="w-full h-48 object-cover" loading="lazy">
      <div class="image-caption absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
        ${result.properties.url}
      </div>
    </div>`,
  ).join(' ')
  const galleryEnd = `</div>`
  return galleryStart + middle + galleryEnd
}

export class ImageSearchTool extends StructuredTool {
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
      const imageSearchResults = await $fetch<ImageSearchApiResponse>(searchURL.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': runtimeConfig.braveAPIKey,
        },
      })
      consola.debug({ tag: 'imageSearchTool', message: `${imageSearchResults.results.length} results` })
      const html = toHTML(imageSearchResults)
      return [`I found ${imageSearchResults.results.length} images related to ${searchTerm}`, html]
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
