/* eslint-disable node/prefer-global/process */
import { defineNuxtConfig } from 'nuxt/config'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    openaiAPIKey: '',
    weatherAPIKey: '',
    tripAdvisorAPIKey: process.env.NUXT_TRIPADVISOR_API_KEY,
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@vesp/nuxt-fontawesome',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
  ],
  css: [
    './assets/styles/tailwind.css',
    './assets/styles/base.css',
  ],
  primevue: {
    options: {
      theme: 'none',
    },
  },
  vite: {
    optimizeDeps: {
      include: ['@ai-sdk/vue', 'uuid'],
    },
  },
  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss': {},
      'autoprefixer': {},
    },
  },
  icon: {
    serverBundle: {
      collections: ['line-md'],
    },
  },
  fontawesome: {
    icons: {
      solid: [
        'arrow-right',
        'location-dot',
        'clock',
        'droplet',
        'fan',
        'sun',
        'temperature-half',
        'umbrella',
        'wind',
        'xmark',
      ],
      regular: [
        'paper-plane',
      ],
    },
  },
})
