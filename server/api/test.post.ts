import { formatDataStreamPart } from 'ai'
import consola from 'consola'
import { v4 as uuidv4 } from 'uuid'

// just a simple test endpoint that will return some text
export default defineLazyEventHandler(async () => {
  const weatherData = JSON.stringify({
    location: {
      name: 'London',
      region: 'City of London, Greater London',
      country: 'United Kingdom',
      lat: 51.5171,
      lon: -0.1062,
      tz_id: 'Europe/London',
      localtime_epoch: 1737758994,
      localtime: '2025-01-24 22:49',
    },
    current: {
      last_updated: '2025-01-24 22:45',
      temp_f: 45.1,
      is_day: 0,
      condition: {
        text: 'Overcast',
        icon: '//cdn.weatherapi.com/weather/64x64/night/122.png',
        code: 1009,
      },
      wind_mph: 4.7,
      wind_degree: 193,
      wind_dir: 'SSW',
      precip_in: 0.0,
      humidity: 81,
      cloud: 100,
      feelslike_f: 42.7,
      windchill_f: 39.9,
      heatindex_f: 42.7,
      dewpoint_f: 34.7,
      vis_miles: 6.0,
      uv: 0.0,
      gust_mph: 7.6,
    },
    forecast: {
      forecastday: [
        {
          date: '2025-01-24',
          day: {
            maxtemp_f: 52.0,
            mintemp_f: 42.3,
            avgtemp_f: 47.4,
            totalprecip_in: 0.22,
            avghumidity: 74,
            daily_will_it_rain: 1,
            daily_chance_of_rain: 99,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Moderate rain',
              icon: '//cdn.weatherapi.com/weather/64x64/day/302.png',
              code: 1189,
            },
            uv: 0.1,
          },
        },
        {
          date: '2025-01-25',
          day: {
            maxtemp_f: 43.4,
            mintemp_f: 37.0,
            avgtemp_f: 41.1,
            totalprecip_in: 0.1,
            avghumidity: 76,
            daily_will_it_rain: 1,
            daily_chance_of_rain: 91,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Patchy rain nearby',
              icon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
              code: 1063,
            },
            uv: 0.1,
          },
        },
        {
          date: '2025-01-26',
          day: {
            maxtemp_f: 45.5,
            mintemp_f: 36.1,
            avgtemp_f: 41.3,
            totalprecip_in: 0.49,
            avghumidity: 81,
            daily_will_it_rain: 1,
            daily_chance_of_rain: 88,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Moderate rain',
              icon: '//cdn.weatherapi.com/weather/64x64/day/302.png',
              code: 1189,
            },
            uv: 0.1,
          },
        },
        {
          date: '2025-01-27',
          day: {
            maxtemp_f: 46.8,
            mintemp_f: 42.0,
            avgtemp_f: 44.2,
            totalprecip_in: 0.12,
            avghumidity: 75,
            daily_will_it_rain: 1,
            daily_chance_of_rain: 86,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Patchy rain nearby',
              icon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
              code: 1063,
            },
            uv: 0.1,
          },
        },
        {
          date: '2025-01-28',
          day: {
            maxtemp_f: 45.6,
            mintemp_f: 41.9,
            avgtemp_f: 44.3,
            totalprecip_in: 0.07,
            avghumidity: 85,
            daily_will_it_rain: 1,
            daily_chance_of_rain: 87,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Patchy rain nearby',
              icon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
              code: 1063,
            },
            uv: 0.1,
          },
        },
        {
          date: '2025-01-29',
          day: {
            maxtemp_f: 46.3,
            mintemp_f: 39.2,
            avgtemp_f: 41.8,
            totalprecip_in: 0.09,
            avghumidity: 84,
            daily_will_it_rain: 0,
            daily_chance_of_rain: 57,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Patchy rain nearby',
              icon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
              code: 1063,
            },
            uv: 2.0,
          },
        },
        {
          date: '2025-01-30',
          day: {
            maxtemp_f: 40.8,
            mintemp_f: 38.0,
            avgtemp_f: 38.9,
            totalprecip_in: 0.04,
            avghumidity: 87,
            daily_will_it_rain: 1,
            daily_chance_of_rain: 89,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Patchy rain nearby',
              icon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
              code: 1063,
            },
            uv: 1.0,
          },
        },
      ],
    },
  })

  const text1 = `
Two roads diverged in a yellow wood,<br/>
And sorry I could not travel both<br/>
And be one traveler, long I stood<br/>
And looked down one as far as I could<br/>
To where it bent in the undergrowth;<br/>
<br/>
The poem should be above weather data.<br/>
<br/>
`

  const text2 = `
<br/>
The weather data should be above this poem<br/>
Is this the last time I’ll admire the guys<br/>
in their neon-yellow slickers, guiding us<br/>
to our parking spots before we head up<br/>
 <br/>
two flights to the passenger deck,<br/>
to the cafeteria where a man in a black derby<br/>
and black suspenders nods and smiles<br/>
 <br/>
`
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  const encoder = new TextEncoder()
  return defineEventHandler(async (webEvent) => {
    const body = await readBody(webEvent)
    const { messages } = body
    consola.info('messages', messages)
    if (messages[0].content === 'weather') {
      const id = uuidv4()
      return new ReadableStream({
        async start(controller) {
          const part = `2:[{"id":"${id}","type":"weather","data":${weatherData}}]\n`
          controller.enqueue(part)
          controller.close()
        },
      })
    }
    return new ReadableStream({
      async start(controller) {
        for (const chunk of text1.split(' ')) {
          // simluate some delay
          await delay(50)
          const part = formatDataStreamPart('text', chunk)
          controller.enqueue(encoder.encode(part))
        }
        for (const chunk of text2.split(' ')) {
          // simluate some delay
          await delay(50)
          const part = formatDataStreamPart('text', chunk)
          controller.enqueue(encoder.encode(part))
        }
        controller.close() // Close the stream when done
      },
    })
  })
})
