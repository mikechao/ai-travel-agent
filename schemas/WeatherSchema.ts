import { z } from 'zod'

// the weather data from https://www.weatherapi.com/my/fields.aspx
export const WeatherSchema = z.object({
  location: z.object({
    name: z.string(),
    region: z.string(),
    country: z.string(),
    lat: z.number(),
    lon: z.number(),
    tz_id: z.string(),
    localtime_epoch: z.number(),
    localtime: z.string(),
  }),
  current: z.object({
    last_updated: z.string(),
    temp_f: z.number(),
    is_day: z.number(),
    condition: z.object({
      text: z.string(),
      icon: z.string(),
      code: z.number(),
    }),
    wind_mph: z.number(),
    wind_degree: z.number(),
    wind_dir: z.string(),
    pressure_mb: z.number(),
    pressure_in: z.number(),
    precip_in: z.number(),
    humidity: z.number(),
    cloud: z.number(),
    feelslike_f: z.number(),
    windchill_f: z.number(),
    heatindex_f: z.number(),
    dewpoint_f: z.number(),
    vis_miles: z.number(),
    uv: z.number(),
    gust_mph: z.number(),
  }),
  forecast: z.object({
    forecastday: z.array(
      z.object({
        date: z.string(),
        day: z.object({
          maxtemp_f: z.number(),
          mintemp_f: z.number(),
          avgtemp_f: z.number(),
          totalprecip_in: z.number(),
          avghumidity: z.number(),
          daily_will_it_rain: z.number(),
          daily_chance_of_rain: z.number(),
          daily_will_it_snow: z.number(),
          daily_chance_of_snow: z.number(),
          condition: z.object({
            text: z.string(),
            icon: z.string(),
            code: z.number(),
          }),
          uv: z.number(),
        }),
      })
    ),
  }),
});
