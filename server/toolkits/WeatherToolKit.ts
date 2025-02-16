import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { GeocodeToolKit } from './GeocodeToolKit'

export const WeatherToolTags = Object.freeze({
  WeatherSearch: 'weather-tool' as const,
})

const runtimeConfig = useRuntimeConfig()

function toHTML(weather: WeatherResponse) {
  return `<div class="bg-blue-600 p-4">
          <h1 class="text-white text-2xl font-bold">${weather.location.name}</h1>
          <p class="text-blue-100">${weather.location.region}, ${weather.location.country}</p>
          <p class="text-blue-100 text-sm">Local Time: ${weather.location.localtime}</p>
        </div>
        <!-- Current Weather Section -->
        <div class="p-4">
          <div class="flex items-center">
            <img 
              src="${weather.current.condition.icon}" 
              alt="${weather.current.condition.text}" 
              class="w-16 h-16"
            />
            <div class="ml-4">
              <h2 class="text-xl font-semibold">${weather.current.condition.text}</h2>
              <p class="text-gray-600">Temperature: ${weather.current.temp_f}°F</p>
              <p class="text-gray-600 text-sm">Feels Like: ${weather.current.feelslike_f}°F</p>
              <p class="text-gray-600 text-sm">Wind: ${weather.current.wind_mph} mph ${weather.current.wind_dir}</p>
            </div>
          </div>
        </div>`
}

class WeatherSearchTool extends StructuredTool {
  name = 'weatherForecastTool'
  description = 'Use to forecast the weather given Latitude and Longitude'
  schema = z.object({
    lat: z.number().describe('The Latitude in decimal degree of the location to get forecast for'),
    long: z.number().describe('The Longitude in decimal degree of the location to get forecast for'),
  })

  responseFormat = 'content_and_artifact'

  protected async _call(input: { lat: number, long: number }) {
    const { lat, long } = input
    consola.debug({ tag: 'weatherForecastTool', message: 'weatherForecastTool called!' })
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${runtimeConfig.weatherAPIKey}&q=${lat},${long}&days=7&aqi=no&alerts=no`
    consola.debug({ tag: 'weatherForecastTool', message: `url ${url}` })
    const forecast = await $fetch<WeatherResponse>(url)
    const html = toHTML(forecast)
    return [JSON.stringify(forecast), html]
  }
}

export class WeatherToolKit extends GeocodeToolKit {
  // this.tools do not need to define this, as it will
  // shadow/overwrite the parent class
  private readonly weatherSearchTool: StructuredTool
  private readonly toolTags: Map<string, string>
  constructor() {
    super()
    this.weatherSearchTool = new WeatherSearchTool()
    this.tools.push(this.weatherSearchTool)
    this.toolTags = new Map<string, string>([
      [this.weatherSearchTool.name, WeatherToolTags.WeatherSearch],
    ])
  }

  /**
   *
   * @returns A Map where the key is the name of the tool
   *
   * And the value are tags that should be used when they are invoked
   *
   */
  getToolTags(): Map<string, string> {
    return this.toolTags
  }
}
