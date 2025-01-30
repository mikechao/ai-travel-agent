import { URL } from 'node:url'
import { consola } from 'consola'

export default defineLazyEventHandler(() => {
  const runtimeConfig = useRuntimeConfig()

  interface PhotoSearchResult {
    data: any[]
    error: any
  }

  return defineEventHandler(async (event) => {
    const { locationId } = getQuery(event)
    if (!locationId) {
      consola.error('Get photos request failed, event missing locationId param', JSON.stringify(event))
      throw createError({
        statusCode: 400,
        statusMessage: 'Request is missing locationId param',
      })
    }
    const photoURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos`)
    photoURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)

    const { data, error } = await $fetch<PhotoSearchResult>(photoURL.toString(), {
      method: 'GET',
    })
    if (error) {
      consola.error('error fetching photos', error)
      setResponseStatus(event, 500, 'Error gettings photos')
      return 'Unexpected error getting photos'
    }
    if (!data || !data.length) {
      return sendNoContent(event, 204)
    }

    const urls = data.map(item => item.images.large.url)
    return urls
  })
})
