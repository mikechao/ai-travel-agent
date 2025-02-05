import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { formatDataStreamPart } from 'ai'
import consola from 'consola'
import { WebBrowser } from 'langchain/tools/webbrowser'
import { v4 as uuidv4 } from 'uuid'

// just a simple test endpoint that will return some text
// or data based on certain content in the message
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
      localtime: '2025-01-24 22:09',
    },
    current: {
      last_updated: '2025-01-24 22:05',
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

  const sightsData = JSON.stringify([
    {
      location_id: '15266827',
      name: 'AR Workshop Danville',
      distance: '0.057751323328638283',
      bearing: 'south',
      address_obj: {
        street1: '355 Hartz Ave',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3337',
        address_string: '355 Hartz Ave, Danville, CA 94526-3337',
      },
    },
    {
      location_id: '10533214',
      name: 'Danville Massage',
      distance: '0.08893569689731762',
      bearing: 'north',
      address_obj: {
        street1: '199 E Linda Mesa Ave',
        street2: 'Suite A',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3339',
        address_string: '199 E Linda Mesa Ave Suite A, Danville, CA 94526-3339',
      },
    },
    {
      location_id: '6542005',
      name: 'Museum of the San Ramon Valley',
      distance: '0.12036769615105866',
      bearing: 'south',
      address_obj: {
        street1: '205 Railroad Ave',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3892',
        address_string: '205 Railroad Ave, Danville, CA 94526-3892',
      },
    },
    {
      location_id: '7222647',
      name: 'Auburn James Winery',
      distance: '0.028748811975822887',
      bearing: 'south',
      address_obj: {
        street1: '321 Hartz Ave',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3336',
        address_string: '321 Hartz Ave, Danville, CA 94526-3336',
      },
    },
    {
      location_id: '12555104',
      name: 'St. Isidore Catholic Church',
      distance: '0.3637733037222501',
      bearing: 'northwest',
      address_obj: {
        street1: '440 La Gonda Way',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-2562',
        address_string: '440 La Gonda Way, Danville, CA 94526-2562',
      },
    },
    {
      location_id: '23183728',
      name: 'Good Life Spa',
      distance: '0.16436203744151404',
      bearing: 'west',
      address_obj: {
        street1: '158 W Linda Mesa Ave',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3333',
        address_string: '158 W Linda Mesa Ave, Danville, CA 94526-3333',
      },
    },
    {
      location_id: '17780940',
      name: 'San Damiano Retreat',
      distance: '1.0645003893283982',
      bearing: 'southwest',
      address_obj: {
        street1: '710 Highland Dr',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3704',
        address_string: '710 Highland Dr, Danville, CA 94526-3704',
      },
    },
    {
      location_id: '12922261',
      name: 'Hand & Stone Massage and Facial Spa',
      distance: '0.20422414711687198',
      bearing: 'northwest',
      address_obj: {
        street1: '11 Railroad Ave',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3873',
        address_string: '11 Railroad Ave, Danville, CA 94526-3873',
      },
    },
    {
      location_id: '2475305',
      name: 'Front Street Cottage Inc',
      distance: '0.1802254437961061',
      bearing: 'east',
      address_obj: {
        street1: '212 Front St',
        street2: '',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526-3402',
        address_string: '212 Front St, Danville, CA 94526-3402',
      },
    },
    {
      location_id: '117180',
      name: 'Iron Horse Trail',
      distance: '0.2997450420014402',
      bearing: 'west',
      address_obj: {
        city: 'Dublin',
        state: 'California',
        country: 'United States',
        address_string: 'Dublin, CA',
      },
    },
  ])

  const hotelsData = JSON.stringify([
    {
      location_id: '617187',
      name: 'Best Western Danville Sycamore Inn',
      distance: '0.894566366267708',
      bearing: 'southeast',
      address_obj: {
        street1: '803 Camino Ramon',
        street2: '',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94526',
        address_string: '803 Camino Ramon, Danville, CA 94526',
      },
    },
    {
      location_id: '235451',
      name: 'Extended Stay America - San Ramon - Bishop Ranch - East',
      distance: '3.2039439427959677',
      bearing: 'southeast',
      address_obj: {
        street1: '2100 Camino Ramon',
        street2: '',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94583-1362',
        address_string: '2100 Camino Ramon, San Ramon, CA 94583-1362',
      },
    },
    {
      location_id: '250131',
      name: 'HYATT house San Ramon',
      distance: '3.233720267744259',
      bearing: 'south',
      address_obj: {
        street1: '2323 San Ramon Valley Blvd',
        street2: '',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94583-1607',
        address_string: '2323 San Ramon Valley Blvd, San Ramon, CA 94583-1607',
      },
    },
    {
      location_id: '1147338',
      name: 'National at Pinnacle Crow Canyo',
      distance: '3.22589942308101',
      bearing: 'south',
      address_obj: {
        street1: '1700 Promontory Ter',
        street2: '',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94583-1580',
        address_string: '1700 Promontory Ter, San Ramon, CA 94583-1580',
      },
    },
    {
      location_id: '20144998',
      name: 'San Ramon Valley Monthly Vacation Home',
      distance: '4.434286347565809',
      bearing: 'southeast',
      address_obj: {
        street1: '50 Crestridge Ct',
        city: 'Danville',
        state: 'California',
        country: 'United States',
        postalcode: '94506-1107',
        address_string: '50 Crestridge Ct, Danville, CA 94506-1107',
      },
    },
    {
      location_id: '81779',
      name: 'San Ramon Marriott',
      distance: '4.473933962159359',
      bearing: 'southeast',
      address_obj: {
        street1: '2600 Bishop Dr',
        street2: '',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94583-2338',
        address_string: '2600 Bishop Dr, San Ramon, CA 94583-2338',
      },
    },
    {
      location_id: '217300',
      name: 'Extended Stay America - San Ramon - Bishop Ranch - West',
      distance: '4.535170248336561',
      bearing: 'southeast',
      address_obj: {
        street1: '18000 San Ramon Valley Blvd',
        street2: '',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94583-4401',
        address_string: '18000 San Ramon Valley Blvd, San Ramon, CA 94583-4401',
      },
    },
    {
      location_id: '80082',
      name: 'Sonesta Select San Ramon',
      distance: '4.799962867495464',
      bearing: 'southeast',
      address_obj: {
        street1: '18090 San Ramon Valley Blvd.',
        street2: '',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94583',
        address_string: '18090 San Ramon Valley Blvd., San Ramon, CA 94583',
      },
    },
    {
      location_id: '17656548',
      name: 'Global Luxury Suites In San Ramon',
      distance: '4.13654646900972',
      bearing: 'southeast',
      address_obj: {
        street1: '125 Shoreline Cir',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94582-4648',
        address_string: '125 Shoreline Cir, San Ramon, CA 94582-4648',
      },
    },
    {
      location_id: '80077',
      name: 'Residence Inn San Ramon',
      distance: '4.770957813749616',
      bearing: 'southeast',
      address_obj: {
        street1: '1071 Market Place',
        street2: '',
        city: 'San Ramon',
        state: 'California',
        country: 'United States',
        postalcode: '94583',
        address_string: '1071 Market Place, San Ramon, CA 94583',
      },
    },
  ])

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
  async function webBrowser() {
    const runtimeConfig = useRuntimeConfig()
    const model = new ChatOpenAI({
      temperature: 0,
      apiKey: runtimeConfig.openaiAPIKey,
    })
    const embeddings = new OpenAIEmbeddings()

    const browser = new WebBrowser({ model, embeddings })

    const result = await browser.invoke(
      `"https://www.themarginalian.org/2015/04/09/find-your-bliss-joseph-campbell-power-of-myth","who is joseph campbell"`,
    )
    return result
  }

  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  const encoder = new TextEncoder()
  return defineEventHandler(async (webEvent) => {
    const body = await readBody(webEvent)
    const { messages } = body
    consola.info('messages', messages)

    if (messages[0].content === 'webbrowser') {
      const result = await webBrowser()
      return new ReadableStream({
        async start(controller) {
          const text = formatDataStreamPart('text', result)
          controller.enqueue(encoder.encode(text))
          controller.close()
        },
      })
    }

    if (messages[0].content === 'weather') {
      const id = uuidv4()
      return new ReadableStream({
        async start(controller) {
          const text = formatDataStreamPart('text', 'Here is some weather for you')
          controller.enqueue(encoder.encode(text))
          const part = `2:[{"id":"${id}","type":"weather","data":${weatherData}}]\n`
          controller.enqueue(part)
          controller.close()
        },
      })
    }

    if (messages[0].content === 'sights') {
      const id = uuidv4()
      return new ReadableStream({
        async start(controller) {
          const text = formatDataStreamPart('text', 'Here is some sights for you')
          controller.enqueue(encoder.encode(text))
          const part = `2:[{"id":"${id}","type":"sight-search","data":${sightsData}}]\n`
          controller.enqueue(part)
          controller.close()
        },
      })
    }

    if (messages[0].content === 'hotel') {
      const id = uuidv4()
      return new ReadableStream({
        async start(controller) {
          const text = formatDataStreamPart('text', 'Here is some hotels for you')
          controller.enqueue(encoder.encode(text))
          const part = `2:[{"id":"${id}","type":"hotel-search","data":${hotelsData}}]\n`
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
