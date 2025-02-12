/* eslint-disable node/prefer-global/process */
import Nora from '@primevue/themes/nora'
import { defineNuxtConfig } from 'nuxt/config'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    dev: process.env.NODE_ENV !== 'production',
    openaiAPIKey: '',
    weatherAPIKey: '',
    tripAdvisorAPIKey: process.env.NUXT_TRIPADVISOR_API_KEY,
    opencageAPIKey: process.env.NUXT_OPENCAGE_API_KEY,
    braveAPIKey: process.env.NUXT_BRAVE_API_KEY,
    postgresURL: process.env.NUXT_POSTGRES_URL,
    consolaLevel: process.env.NUXT_CONSOLE_LEVEL || 'info',
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@vesp/nuxt-fontawesome',
    '@nuxt/eslint',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
  ],
  css: [
    './assets/styles/tailwind.css',
    './assets/styles/base.css',
  ],
  colorMode: {
    preference: 'system',
    dataValue: 'theme',
    fallback: 'light',
    storage: 'localStorage',
    storageKey: 'ai-travel-agent-color-mode',
  },
  primevue: {
    components: {
      include: ['Tooltip', 'Toast'],
    },
    directives: {
      include: ['tooltip'],
    },
    options: {
      ripple: true,
      theme: {
        preset: Nora,
        options: {
          darkModeSelector: '.p-dark',
          cssLayer: {
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities',
          },
        },
      },
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@ai-sdk/vue',
        'uuid',
        'primevue/tooltip',
        'primevue/dock',
        'primevue/splitter',
        'primevue/splitterpanel',
        'primevue/dialog',
        'primevue/ripple',
        '@primevue/forms',
        'primevue/avatar',
        'primevue/button',
        'primevue/inputtext',
        'primevue/panel',
        'primevue/card',
        'primevue/selectbutton',
        'primevue/scrollpanel',
        'primevue/galleria',
        'primevue/divider',
        'primevue/carousel',
        'primevue/toast',
        'primevue/usetoast',
        'primevue/tab',
        'primevue/tablist',
        'primevue/tabpanel',
        'primevue/tabpanels',
        'primevue/tabs',
        'markdown-it',
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
        'gears',
        'route',
        'chevron-down',
        'chevron-up',
        'cloud-sun',
        'hotel',
        'binoculars',
        'circle-info',
        'list',
        'comments',
        'magnifying-glass-plus',
      ],
      regular: [
        'paper-plane',
        'thumbs-up',
        'face-sad-tear',
        'sun',
        'moon',
        'lightbulb',
        'circle-user',
      ],
    },
  },
})
