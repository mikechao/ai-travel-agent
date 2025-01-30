import consola from 'consola'

export default defineLazyEventHandler(() => {
  const runtimeConfig = useRuntimeConfig()

  return defineEventHandler(async (event) => {
    const { locationId } = getQuery(event)
    if (!locationId) {
      consola.error('Get reviews request failed, event missing locationId param', JSON.stringify(event))
      throw createError({
        statusCode: 400,
        statusMessage: 'Request is missing locationId param',
      })
    }
    const reviewsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/reviews`)
    reviewsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)

    try {
      const response = await $fetch(reviewsURL.toString(), { method: 'GET' })
      return response
    }
    catch (error) {
      consola.error('error fetching reviews', error)
      setResponseStatus(event, 500, 'Error gettings reviews')
      return 'Unexpected error getting reviews'
    }
  })
})
