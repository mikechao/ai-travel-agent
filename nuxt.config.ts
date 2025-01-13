// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      // for now leave on public for client side demo of langchain examples
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    }
  }
})
