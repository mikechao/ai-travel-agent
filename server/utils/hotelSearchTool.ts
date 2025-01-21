import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

const hotelSearchTool = new DynamicStructuredTool({
  name: 'hotelSearchTool',
  description: 'Used to search for hotels for the location the user has expressed an interest in',
  schema: z.object({
    lat : z.number().describe('The Latitude in decimal degree of the location to search for hotels'),
    long: z.number().describe('The Longitude in decimal degree of the location to search for hotelsr'),
    searchQuery: z.string().describe('Text to use for searching based on the name of the location'),
    radius: z.number().optional()
      .default(10)
      .describe(`Length of the radius in miles from the provided lat, long pair to filter results.`)
  }),
  func: async (input: { lat: number; long: number; searchQuery: string; radius?: number }) => {
    const { lat, long, searchQuery,  radius} = input
    console.log(`hotelSearchTool called with lat: ${lat}, long: ${long}, searchQuery: ${searchQuery}, radius: ${radius}`)

    return "DoubleTree by Hilton Hotel Berkeley Marina. 200 Marina Blvd, Berkeley, CA 94710"
  }
})

export const getHotelSearchTool = () => hotelSearchTool