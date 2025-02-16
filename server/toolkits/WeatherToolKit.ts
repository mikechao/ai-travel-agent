import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { GeocodeToolKit } from './GeocodeToolKit'

export const WeatherToolTags = Object.freeze({
  WeatherSearch: 'weather-tool' as const,
})

const runtimeConfig = useRuntimeConfig()

class WeatherSearchTool extends StructuredTool {
  name = 'weatherForecastTool'
  description = 'Use to forecast the weather given Latitude and Longitude'
  schema = z.object({
    lat: z.number().describe('The Latitude in decimal degree of the location to get forecast for'),
    long: z.number().describe('The Longitude in decimal degree of the location to get forecast for'),
  })

  protected async _call(input: { lat: number, long: number }) {
    const { lat, long } = input
    consola.debug({ tag: 'weatherForecastTool', message: 'weatherForecastTool called!' })
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${runtimeConfig.weatherAPIKey}&q=${lat},${long}&days=7&aqi=no&alerts=no`
    consola.debug({ tag: 'weatherForecastTool', message: `url ${url}` })
    const forecast = await $fetch<WeatherResponse>(url)
    // comes back as object, JSON.stringify it since it will be stored in ToolMessage.content
    return JSON.stringify(forecast)
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
