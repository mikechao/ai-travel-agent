import consola from 'consola'

export default defineLazyEventHandler(() => {
  const runtimeConfig = useRuntimeConfig()

  interface DetailsResult {
    data: any
    error: any
  }

  return defineEventHandler(async (event) => {
    const { locationId } = getQuery(event)
    if (!locationId) {
      consola.error('Get details request failed, event missing locationId param', JSON.stringify(event))
      throw createError({
        statusCode: 400,
        statusMessage: 'Request is missing locationId param',
      })
    }
    const locationDetailsURL = new URL(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details`)
    locationDetailsURL.searchParams.set('key', `${runtimeConfig.tripAdvisorAPIKey}`)

    const { data, error } = await $fetch<DetailsResult>(locationDetailsURL.toString())
    if (error) {
      consola.error('error fetching details', error)
      setResponseStatus(event, 500, 'Error gettings details')
      return 'Unexpected error getting details'
    }
    if (!data) {
      return sendNoContent(event, 204)
    }
    return data
  })
})
