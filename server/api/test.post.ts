import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { formatDataStreamPart } from 'ai'
import { BraveSearch } from 'brave-search/dist/braveSearch.js'
import consola from 'consola'
import { WebBrowser } from 'langchain/tools/webbrowser'
import { v4 as uuidv4 } from 'uuid'
import { RunnableTools } from '../toolkits/RunnableTools'

// just a simple test endpoint that will return some text
// or data based on certain content in the message
export default defineLazyEventHandler(async () => {
  // cSpell:disable
  const weatherData = {
    location: {
      name: 'Danville',
      region: 'California',
      country: 'United States of America',
      lat: 37.822,
      lon: -121.999,
      tz_id: 'America/Los_Angeles',
      localtime_epoch: 1739492091,
      localtime: '2025-02-13 16:14',
    },
    current: {
      last_updated: '2025-02-13 16:00',
      temp_f: 57.0,
      is_day: 1,
      condition: {
        text: 'Light rain',
        icon: '//cdn.weatherapi.com/weather/64x64/day/296.png',
        code: 1183,
      },
      wind_mph: 19.9,
      wind_degree: 223,
      wind_dir: 'SW',
      precip_in: 0.0,
      humidity: 87,
      cloud: 100,
      feelslike_f: 52.8,
      windchill_f: 48.5,
      heatindex_f: 53.5,
      dewpoint_f: 52.0,
      vis_miles: 3.0,
      uv: 0.2,
      gust_mph: 30.8,
    },
    forecast: {
      forecastday: [
        {
          date: '2025-02-13',
          day: {
            maxtemp_f: 54.5,
            mintemp_f: 49.8,
            avgtemp_f: 52.9,
            totalprecip_in: 2.07,
            avghumidity: 95,
            daily_will_it_rain: 1,
            daily_chance_of_rain: 86,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Heavy rain',
              icon: '//cdn.weatherapi.com/weather/64x64/day/308.png',
              code: 1195,
            },
            uv: 0.4,
          },
        },
        {
          date: '2025-02-14',
          day: {
            maxtemp_f: 52.5,
            mintemp_f: 42.8,
            avgtemp_f: 48.2,
            totalprecip_in: 0.17,
            avghumidity: 88,
            daily_will_it_rain: 0,
            daily_chance_of_rain: 65,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Patchy rain nearby',
              icon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
              code: 1063,
            },
            uv: 0.6,
          },
        },
        {
          date: '2025-02-15',
          day: {
            maxtemp_f: 54.7,
            mintemp_f: 34.9,
            avgtemp_f: 44.1,
            totalprecip_in: 0.0,
            avghumidity: 88,
            daily_will_it_rain: 0,
            daily_chance_of_rain: 0,
            daily_will_it_snow: 0,
            daily_chance_of_snow: 0,
            condition: {
              text: 'Overcast ',
              icon: '//cdn.weatherapi.com/weather/64x64/day/122.png',
              code: 1009,
            },
            uv: 0.7,
          },
        },
      ],
    },
  }

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

  // cSpell:enable

  const runtimeConfig = useRuntimeConfig()
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
    apiKey: runtimeConfig.openaiAPIKey,
  })
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: runtimeConfig.openaiAPIKey,
  })

  function weatherHTML() {
    return `<div class="w-fit border-2 border-primary rounded-xl shadow-lg p-4">
          <h1 class="text-center text-lg text-surface-700 dark:text-surface-0 font-bold">Currently</h1>
          <p class="text-center mb-2 text-surface-700 dark:text-surface-0 text-sm">${weatherData.location.name}, ${weatherData.location.region}</p>
          <hr class="border-t border-surface-200 dark:border-surface-700 my-2 mb-1" />
          <div class="flex items-center">
            <img 
              src="${weatherData.current.condition.icon}" 
              alt="${weatherData.current.condition.text}" 
              class="w-16 h-16"
            />
            <div class="ml-4 space-y-1">
              <h2 class="text-md text-surface-700 dark:text-surface-0 font-semibold">${weatherData.current.condition.text}</h2>
              <p class="text-surface-700 dark:text-surface-0 text-sm">Temperature: ${weatherData.current.temp_f}°F</p>
              <p class="text-surface-700 dark:text-surface-0 text-sm">Feels Like: ${weatherData.current.feelslike_f}°F</p>
              <p class="text-surface-700 dark:text-surface-0 text-sm mb-2 mr-2">Wind: ${weatherData.current.wind_mph} mph ${weatherData.current.wind_dir}</p>
            </div>
          </div>
        </div>`
  }

  async function webBrowser() {
    const browser = new WebBrowser({ model, embeddings })

    const urls = ['https://www.theneighborscat.com/blog/2017/8/25/top-five-cat-cafes-from-around-the-world', 'https://www.ministryofcat.com/blog/best-cat-friendly-travel-destinations']
    let allResults = ''
    for (const url of urls) {
      const result = await browser.invoke(`"${url}",""`)
      allResults += `${result}\n`
    }
    return allResults
  }

  const runnableTools = new RunnableTools(model, embeddings)
  async function runnables() {
    const mapChain = runnableTools.createWholeChain()
    const before = performance.now()
    const results = await mapChain.invoke({ interest: 'cats' })
    const after = performance.now()
    consola.info('runnables results', results)
    consola.info(`runnable time ${after - before} ms`)
    return results
  }

  async function piece() {
    const searchQuery = runnableTools.createSearchQueryRunnable()

    const runtimeConfig = useRuntimeConfig()
    const braveSearch = new BraveSearch(runtimeConfig.braveAPIKey)
    const searchExecution = runnableTools.createSearchExecutionRunnable(braveSearch)

    const searchSummary = runnableTools.createSearchSummaryRunnable()

    const beforeQuery = performance.now()
    const queries = await searchQuery.invoke({ interest: 'cats' })
    const afterQuery = performance.now()
    consola.info(`Took ${afterQuery - beforeQuery} ms to generate ${queries.length} queries`)

    const queryAndURLs = []
    for (const query of queries) {
      const queryBefore = performance.now()
      const queryAndURL = await searchExecution.invoke(query)
      const queryAfter = performance.now()
      consola.info(`Executed query ${query} took ${queryAfter - queryBefore} ms`)
      queryAndURLs.push(queryAndURL)
    }

    const summaryResults = []
    for (const queryAndURL of queryAndURLs) {
      const summaryBefore = performance.now()
      const result = await searchSummary.invoke(queryAndURL)
      const summaryAfter = performance.now()
      consola.info(`Took ${summaryAfter - summaryBefore} ms to summaries`)
      summaryResults.push(result)
    }

    return JSON.stringify(summaryResults)
  }

  const encoder = new TextEncoder()
  return defineEventHandler(async (webEvent) => {
    const body = await readBody(webEvent)
    const { messages } = body
    consola.info('messages', messages)

    if (messages[0].content === 'query') {
      const queries = {
        queries: [
          'Best travel destinations for cat lovers',
          'Cat-themed travel spots around the world',
          'Top cities with cat cafes and cat attractions',
          'Unique travel experiences for cat enthusiasts',
          'Cat lover travel blogs and itineraries',
        ],
      }
      const content = JSON.stringify(queries)
      const id = uuidv4()
      const part = `2:[{"id":"${id}","type":"search-query","data":${content}}]\n`
      return new ReadableStream({
        async start(controller) {
          controller.enqueue(part)
          controller.close()
        },
      })
    }

    if (messages[0].content === 'execute') {
      const results: SearchResult[] = []
      results.push({
        query: `best travel destinations for cat lovers`,
        url: `https://www.amatravel.ca/articles/travelling-destinations-for-cat-lovers`,
        title: `Travelling Destinations for Cat Lovers | AMA Travel`,
        description: `Why a Belgium <strong>cat</strong> festival, Malaysian <strong>cat</strong> museum, and Disneyland (Disneyland?) are some of the must-hits on every <strong>cat</strong>-<strong>lovers</strong> <strong>travel</strong> list.`,
      })
      results.push({
        query: `best travel destinations for cat lovers`,
        url: `https://expatexplore.com/blog/worlds-top-destinations-cat-lovers/`,
        title: `Top Destinations For Cat Lovers - Cat Cafes - Expat Explore`,
        description: `From exploring ancient cultures to discovering modern <strong>cat</strong> cafes - let Expat Explore be your guide to the <strong>best</strong> <strong>destinations</strong> <strong>for</strong> <strong>cat</strong> <strong>lovers</strong> around the world!`,
      })
      results.push({
        query: `best travel destinations for cat lovers`,
        url: `https://www.countryandtownhouse.com/travel/best-holiday-destinations-for-cat-lovers/`,
        title: `Best Holiday Destinations For Cat Lovers - Travel`,
        description: `Looking for the <strong>best</strong> countries to visit to see stray <strong>cats</strong>? This is the purrfect guide to the ultimate holiday <strong>destinations</strong> <strong>for</strong> <strong>cat</strong> <strong>lovers</strong>.`,
      })
      results.push({
        query: `best travel destinations for cat lovers`,
        url: `https://www.ministryofcat.com/blog/best-cat-friendly-travel-destinations`,
        title: `Best Cat-Friendly Travel Destinations | Ministry of Cat | Cat Cafe in Phnom Penh`,
        description: `Additionally, Amsterdam&#x27;s many ... easy to <strong>travel</strong> around the city with your <strong>cat</strong> in tow. Japan is a country that has a deep appreciation <strong>for</strong> <strong>cats</strong>, and Tokyo is no exception. <strong>Cat</strong> cafes, where customers can sip coffee while petting <strong>cats</strong>, are a popular attraction in the city. Additionally, there are many <strong>cat</strong>-themed shops and even a <strong>cat</strong> island, Tashirojima, where <strong>cats</strong> outnumber humans. Paris may be known as the city of love, but it&#x27;s also a great <strong>destination</strong> <strong>for</strong> <strong>cat</strong> <strong>lovers</strong>...`,
      })
      results.push({
        query: `best travel destinations for cat lovers`,
        url: `https://www.vacationsmadeeasy.com/TheBLT/Americas13BestTouristAttractionsforCatLovers.html`,
        title: `America’s 13 Best Tourist Attractions for Cat Lovers`,
        description: `To the delight of <strong>cat</strong> <strong>lovers</strong> everywhere, North America has officially jumped on the <strong>Cat</strong> Café wagon, with <strong>Cat</strong> Town Café[1] being the very first to open its doors in 2014. A <strong>cat</strong> café is a blend of a café and an adoption center, where adoptable <strong>cats</strong> are free to roam the establishment while ...`,
      })
      const content = JSON.stringify(results)
      const id = uuidv4()
      const part = `2:[{"id":"${id}","type":"search-execution","data":${content}}]\n`
      return new ReadableStream({
        async start(controller) {
          controller.enqueue(part)
          controller.close()
        },
      })
    }

    if (messages[0].content === 'summary') {
      const results = '### Best Travel Destinations for Cat Lovers\n\nThe text highlights various travel destinations that are ideal for cat lovers, specifically focusing on cat cafes, which are popular spots for feline enthusiasts to enjoy a cup of coffee while interacting with cats.\n\n### Relevant Links:\n- [Expat Explore Home Page](https://expatexplore.com/)\n- [Expat Explore Blog Home](https://expatexplore.com/blog/)\n- [Expat Explore Privacy Policy](https://expatexplore.com/privacy-policy/)\n- [Expat Explore Facebook](https://www.facebook.com/ExpatExploreTravel/)\n- [Expat Explore Instagram](https://www.instagram.com/expatexplore/)'
      const summary = {
        summary: results,
      }
      const content = JSON.stringify(summary)
      const id = uuidv4()
      const part = `2:[{"id":"${id}","type":"search-summary","data":${content}}]\n`
      return new ReadableStream({
        async start(controller) {
          controller.enqueue(part)
          controller.close()
        },
      })
    }

    if (messages[0].content === 'image') {
      return new ReadableStream({
        async start(controller) {
          // Create a gallery wrapper with CSS grid
          const galleryStart = `<div class="image-gallery grid grid-cols-2 gap-4 p-4">`
          const galleryEnd = `</div>`

          // Add images with consistent sizing and hover effects
          const images = [
            {
              url: 'https://i.pinimg.com/originals/68/c4/c9/68c4c9942917d5007f070fb556d2a73e.jpg',
              title: 'Image 1',
              caption: 'A beautiful cat lounging',
            },
            {
              url: 'https://www.catster.com/wp-content/uploads/2018/01/An-orange-tabby-cat-with-the-M-marking-on-the-forehead.jpg',
              title: 'Image 2',
              caption: 'Orange tabby cat',
            },
            {
              url: 'https://hips.hearstapps.com/hmg-prod/images/names-for-an-orange-cat-carrot-1597174306.jpg',
              title: 'Image 3',
              caption: 'Meeeow',
            },
          ]

          const imageMarkdown = images.map(img => `
            <div class="image-container relative rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            onclick="window.dispatchEvent(new CustomEvent('show-full-image', { detail: { url: '${img.url}', title: '${img.title}', caption: '${img.caption}' }}))"
            >
              <img src="${img.url}" alt="${img.title}" class="w-full h-48 object-cover" loading="lazy">
              <div class="image-caption absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                ${img.caption}
              </div>
            </div>`,
          ).join(' ')

          const markdown = galleryStart + imageMarkdown + galleryEnd
          const text = formatDataStreamPart('text', markdown)
          controller.enqueue(encoder.encode(text))
          controller.close()
        },
      })
    }

    if (messages[0].content === 'piece') {
      const result = await piece()
      return new ReadableStream({
        async start(controller) {
          const text = formatDataStreamPart('text', result)
          controller.enqueue(encoder.encode(text))
          controller.close()
        },
      })
    }

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

    if (messages[0].content === 'runnables') {
      return new ReadableStream({
        async start(controller) {
          const text = formatDataStreamPart('text', 'Running the runnables')
          controller.enqueue(encoder.encode(text))
          const results = await runnables()
          const part = formatDataStreamPart('text', JSON.stringify(results))
          controller.enqueue(encoder.encode(part))
          controller.close()
        },
      })
    }

    if (messages[0].content === 'weather') {
      const id = uuidv4()
      return new ReadableStream({
        async start(controller) {
          const text = formatDataStreamPart('text', weatherHTML())
          controller.enqueue(encoder.encode(text))
          const jsonWeather = JSON.stringify(weatherData)
          const part = `2:[{"id":"${id}","type":"weather","data":${jsonWeather}}]\n`
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
        const text = `hotel for some hotel Data<br/> 
        sights for some sights Data<br/>
        weather for some weather Data<br/>
        runnables to run the chained runnable test<br/>
        webbrowser to invoke the WebBrowser tool <br/>
        piece to run the runnables one by one for timing <br/>
        summary for searchSummaryTool data<br/>
        execute for searchExecutionTool data<br/>
        query for searchQueryTool data<br/>`
        const part = formatDataStreamPart('text', text)
        controller.enqueue(encoder.encode(part))

        controller.close() // Close the stream when done
      },
    })
  })
})
