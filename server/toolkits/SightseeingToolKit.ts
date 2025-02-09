import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { GeocodeToolKit } from './GeocodeToolKit'

export const SightseeingToolTags = {
  SightSearch: 'sight-search',
} as const

const runtimeConfig = useRuntimeConfig()

interface LocationSearchResult {
  data: any[]
  error: any
}

class SightSeeingSearchTool extends StructuredTool {
  name = 'sightseeingSearchTool'
  description = `Used to search for sights or attractions to see given Latitude and Longitude and location`
  schema = z.object({
    lat: z.number().describe('The Latitude in decimal degree of the location to search for sightseeing locations'),
    long: z.number().describe('The Longitude in decimal degree of the location to search for sightseeing locations'),
    searchQuery: z.string().describe('Text to use for searching based on the name of the location or attractions '),
    radius: z.number().optional().default(10).describe(`Length of the radius in miles from the provided lat, long pair to filter results.`),
  })

  protected async _call({ lat, long, searchQuery, radius = 10 }: { lat: number, long: number, searchQuery: string, radius?: number }) {
    consola.debug({ tag: 'sightseeingSearchTool', message: `called with lat: ${lat}, long: ${long}, searchQuery: ${searchQuery}, radius: ${radius}` })
    const sightseeingURL = new URL('https://api.content.tripadvisor.com/api/v1/location/search')
    sightseeingURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    sightseeingURL.searchParams.set('searchQuery', searchQuery)
    sightseeingURL.searchParams.set('category', 'attractions')
    sightseeingURL.searchParams.set('latLong', `${lat},${long}`)
    sightseeingURL.searchParams.set('radius', radius.toString())
    sightseeingURL.searchParams.set('radiusUnit', 'mi')
    consola.debug({ tag: 'sightseeingSearchTool', message: `sightseeingURL ${sightseeingURL.toString()}` })

    const { data, error } = await $fetch<LocationSearchResult>(sightseeingURL.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    })
    if (error) {
      console.error('error fetching sightseeing data', error)
      // need to figure out how to handle errors in tools for langchain
    }
    if (!data.length) {
      // not sure if this the right way to handle this
      return 'No sights found'
    }
    return JSON.stringify(data)
  }
}

class SightDetailsTool extends StructuredTool {
  name = 'sightsDetailsTool'
  description = 'Used to get additional details about a sight to see, needs location_id from sightseeingSearchTool'
  schema = z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named sightseeingSearchTool'),
  })

  protected async _call({ locationId }: { locationId: string }) {
    consola.debug({ tag: 'sightsDetailsTool', message: `called with locationId ${locationId}` })
    const sightDetailsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details`)
    sightDetailsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    consola.debug({ tag: 'sightsDetailsTool', message: `sightDetailsURL ${sightDetailsURL.toString()}` })

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
  }
}

class SightsReviewTool extends StructuredTool {
  name = 'sightsReviewsTool'
  description = 'Used to get sights or attractions reviews, needs location_id from sightseeingSearchTool'
  schema = z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named sightseeingSearchTool'),
  })

  protected async _call({ locationId }: { locationId: string }) {
    consola.debug({ tag: 'sightsReviewsTool', message: `called with locationId: ${locationId}` })
    const reviewsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/reviews`)
    reviewsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    consola.debug({ tag: 'sightsReviewsTool', message: `reviewsURL ${reviewsURL.toString()}` })

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
  }
}

export class SightseeingToolKit extends GeocodeToolKit {
  private toolTags: Map<string, string>
  constructor() {
    super()
    this.tools.push(
      new SightSeeingSearchTool(),
      new SightDetailsTool(),
      new SightsReviewTool(),
    )
    this.toolTags = new Map<string, string>()
    this.toolTags.set('sightseeingSearchTool', SightseeingToolTags.SightSearch)
  }

  getToolTags(): Map<string, string> {
    return this.toolTags
  }
}
