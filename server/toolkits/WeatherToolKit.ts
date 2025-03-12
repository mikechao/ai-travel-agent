import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { GeocodeToolKit } from './GeocodeToolKit'

export const WeatherToolTags = Object.freeze({
  WeatherSearch: 'weather-tool' as const,
})

const runtimeConfig = useRuntimeConfig()

function toHTML(weather: WeatherResponse) {
  return `<div class="w-fit border-2 border-primary rounded-xl shadow-lg p-1">
          <h1 class="text-center text-lg text-surface-700 dark:text-surface-0 font-bold">Currently</h1>
          <p class="text-center text-surface-700 dark:text-surface-0 text-sm mb-1">${weather.location.name}, ${weather.location.region}</p>
          <hr class="border-t border-surface-200 dark:border-surface-700 my-2" />
          <div class="flex items-center">
            <img 
              src="${weather.current.condition.icon}" 
              alt="${weather.current.condition.text}" 
              class="w-16 h-16"
            />
            <div class="ml-4 space-y-1">
              <h2 class="text-md text-surface-700 dark:text-surface-0 font-semibold">${weather.current.condition.text}</h2>
              <p class="text-surface-700 dark:text-surface-0 text-sm">Temperature: ${weather.current.temp_f}°F</p>
              <p class="text-surface-700 dark:text-surface-0 text-sm">Feels Like: ${weather.current.feelslike_f}°F</p>
              <p class="text-surface-700 dark:text-surface-0 text-sm mb-2 mr-2">Wind: ${weather.current.wind_mph} mph ${weather.current.wind_dir}</p>
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
    try {
      const url = `http://api.weatherapi.com/v1/forecast.json?key=${runtimeConfig.weatherAPIKey}&q=${lat},${long}&days=7&aqi=no&alerts=no`
      consola.debug({ tag: 'weatherForecastTool', message: `url ${url}` })
      const forecast = await $fetch<WeatherResponse>(url)
      const html = toHTML(forecast)
      return [JSON.stringify(forecast), html]
    }
    catch (error: any) {
      consola.error({ tag: 'weatherForecastTool', message: 'Error fetching weather forecast', error })
      return [`*Error* Unable to get weather forecast for the location with Latitude ${lat} and Longitude ${long}`, '']
    }
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
