export {}

declare global {
  /**
   * Represents the response from
   * http://api.weatherapi.com/v1/forecast.json?key=${APIK_KEY}&q=37.7792588,-122.4193286&days=7&aqi=no&alerts=no
   */
  interface WeatherResponse {
    location: Location
    current: Current
    forecast: Forecast
  }

  interface Location {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime_epoch: number
    localtime: string
  }

  interface Current {
    last_updated: string
    temp_f: number
    is_day: number
    condition: Condition
    wind_mph: number
    wind_degree: number
    wind_dir: string
    precip_in: number
    humidity: number
    cloud: number
    feelslike_f: number
    windchill_f: number
    heatindex_f: number
    dewpoint_f: number
    vis_miles: number
    uv: number
    gust_mph: number
  }

  interface Forecast {
    forecastday: ForecastDay[]
  }

  interface ForecastDay {
    date: string
    day: Day
  }

  interface Day {
    maxtemp_f: number
    mintemp_f: number
    avgtemp_f: number
    totalprecip_in: number
    avghumidity: number
    daily_will_it_rain: number
    daily_chance_of_rain: number
    daily_will_it_snow: number
    daily_chance_of_snow: number
    condition: Condition
    uv: number
  }

  interface Condition {
    text: string
    icon: string
    code: number
  }

}
