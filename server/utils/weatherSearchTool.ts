import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

const runtimeConfig = useRuntimeConfig()

const weatherForecastTool = new DynamicStructuredTool({
  name: 'weatherForecastTool',
  description: 'Use to forecast the weather for the location the user has expressed an interest in',
  schema: z.object({
    lat : z.number().describe('The Latitude in decimal degree of the location to get forecast for'),
    long: z.number().describe('The Longitude in decimal degree of the location to get forecast for')
  }),
  func: async (input: { lat: number; long: number }) => {
    const { lat, long } = input;
    console.log('weatherForecastTool callled!!!!')
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${runtimeConfig.weatherAPIKey}&q=${lat},${long}&days=7&aqi=no&alerts=no`
    console.log('url', url)
    const forecast = await $fetch(url)
    // comes back as object, JSON.stringify it since it will be stored in ToolMessage.content
    return JSON.stringify(forecast)
  }
})

export const getWeatherForecastTool = () => weatherForecastTool