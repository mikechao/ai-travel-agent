// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    openaiAPIKey: '',
    weatherAPIKey: '',
    tripAdvisorAPIKey: process.env.NUXT_TRIPADVISOR_API_KEY,
  },
  modules: ['@nuxtjs/tailwindcss', '@vesp/nuxt-fontawesome'],
  fontawesome: {
    icons: {
      solid: [
        'arrow-right', 'location-dot', 'clock', 
        'droplet', 'fan', 'sun', 'temperature-half', 
        'umbrella', 'wind','xmark'
      ],
    }
  }
})