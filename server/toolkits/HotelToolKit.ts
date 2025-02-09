import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { GeocodeToolKit } from './GeocodeToolKit'

const runtimeConfig = useRuntimeConfig()

interface LocationSearchResult {
  data: any[]
  error: any
}

class HotelSearchTool extends StructuredTool {
  name = 'hotelSearchTool'
  description = 'Used to search for hotels given Latitude and Longitude and location'
  schema = z.object({
    lat: z.number().describe('The Latitude in decimal degree of the location to search for hotels'),
    long: z.number().describe('The Longitude in decimal degree of the location to search for hotels'),
    searchQuery: z.string().describe('Text to use for searching based on the name of the location'),
    radius: z.number().optional().default(10).describe(`Length of the radius in miles from the provided lat, long pair to filter results.`),
  })

  protected async _call({ lat, long, searchQuery, radius = 10 }: { lat: number, long: number, searchQuery: string, radius?: number }) {
    consola.debug({ tag: 'hotelSearchTool', message: `called with lat: ${lat}, long: ${long}, searchQuery: ${searchQuery}, radius: ${radius}` })
    const locationSearchURL = new URL('https://api.content.tripadvisor.com/api/v1/location/search')
    locationSearchURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    locationSearchURL.searchParams.set('searchQuery', searchQuery)
    locationSearchURL.searchParams.set('category', 'hotels')
    locationSearchURL.searchParams.set('latLong', `${lat},${long}`)
    locationSearchURL.searchParams.set('radius', radius.toString())
    locationSearchURL.searchParams.set('radiusUnit', 'mi')
    consola.debug({ tag: 'hotelSearchTool', message: `locationSearchURL ${locationSearchURL.toString()}` })
    // https://tripadvisor-content-api.readme.io/reference/searchforlocations
    const { data, error } = await $fetch<LocationSearchResult>(locationSearchURL.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    })
    if (error) {
      consola.error('error fetching location data', error)
      // need to figure out how to handle errors in tools for langchain
    }
    if (!data.length) {
      // not sure if this the right way to handle this
      return 'No hotels found'
    }
    return JSON.stringify(data)
  }
}

class HotelReviewsTool extends StructuredTool {
  name = 'hotelReviewsTool'
  description = 'Used to get hotel reviews, needs location_id from hotelSearchTool '
  schema = z.object({
    locationId: z.string().describe('The location_id from previous results of the tool named hotelSearchTool'),
  })

  protected async _call({ locationId }: { locationId: string }) {
    consola.debug({ tag: 'hotelReviewsTool', message: `called with locationId: ${locationId}` })
    const reviewsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/reviews`)
    reviewsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    consola.debug({ tag: 'hotelReviewsTool', message: `reviewsURL ${reviewsURL.toString()}` })
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
  }
}

export class HotelToolKit extends GeocodeToolKit {
  constructor() {
    super()
    this.tools.push(
      new HotelSearchTool(),
      new HotelReviewsTool(),
    )
  }
}
