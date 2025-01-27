/* eslint-disable node/prefer-global/process */
import { defineNuxtConfig } from 'nuxt/config'
import Nora from '@primevue/themes/nora'
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
    '@primevue/nuxt-module',
    '@pinia/nuxt',
  ],
  css: [
    './assets/styles/tailwind.css',
    './assets/styles/base.css',
  ],
  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: Nora
      }
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@ai-sdk/vue',
        'uuid',
        'primevue/tooltip',
        'primevue/dock',
      ],
    },
  },
  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss': {},
      'autoprefixer': {},
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
        'gear',
        'route',
      ],
      regular: [
        'paper-plane',
      ],
    },
  },
})
