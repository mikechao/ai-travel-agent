import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { URL } from 'url'

const runtimeConfig = useRuntimeConfig()

interface LocationSearchResult {
  data: any[],
  error: any
}
const hotelSearchTool = new DynamicStructuredTool({
  name: 'hotelSearchTool',
  description: 'Used to search for hotels for the location the user has expressed an interest in',
  schema: z.object({
    lat : z.number().describe('The Latitude in decimal degree of the location to search for hotels'),
    long: z.number().describe('The Longitude in decimal degree of the location to search for hotels'),
    searchQuery: z.string().describe('Text to use for searching based on the name of the location'),
    radius: z.number().optional()
      .default(10)
      .describe(`Length of the radius in miles from the provided lat, long pair to filter results.`)
  }),
  func: async ({ lat, long, searchQuery, radius = 10 }: { lat: number; long: number; searchQuery: string; radius?: number }) => {
    console.log(`hotelSearchTool called with lat: ${lat}, long: ${long}, searchQuery: ${searchQuery}, radius: ${radius}`)
    const locationSearchURL = new URL('https://api.content.tripadvisor.com/api/v1/location/search')
    locationSearchURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)
    locationSearchURL.searchParams.set('searchQuery', searchQuery)
    locationSearchURL.searchParams.set('category', 'hotels')
    locationSearchURL.searchParams.set('latLong', `${lat},${long}`)
    locationSearchURL.searchParams.set('radius', radius.toString())
    locationSearchURL.searchParams.set('radiusUnit', 'mi')
    console.log('locationSearchURL', locationSearchURL.toString())
    // https://tripadvisor-content-api.readme.io/reference/searchforlocations
    const {data , error} = await $fetch<LocationSearchResult>(locationSearchURL.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    })
    if (error) {
      console.error('error fetching location data', error)
      // need to figure out how to handle errors in tools for langchain
    }
    if (!data.length) {
      // not sure if this the right way to handle this
      return "No hotels found"
    }
    return JSON.stringify(data)
  }
})

export const getHotelSearchTool = () => hotelSearchTool