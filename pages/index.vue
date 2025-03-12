<script setup lang="ts">
import { useHead, useSeoMeta } from '#app/composables/head'

useSeoMeta({
  title: 'AI Travel Agent Chat',
  ogTitle: 'AI Travel Agent Chat',
  ogType: 'website',
  ogUrl: 'https://ai-travel-agent-pied.vercel.app/',
  description: 'A multi AI agent network helping you explore various travel destinations',
  ogDescription: 'A multi AI agent network helping you explore various travel destinations',
})

useHead({
  htmlAttrs: {
    lang: 'en',
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
  ],
})
</script>

<template>
  <div class="hero-container flex flex-col">
    <LandingHero />
    <LandingAgents />
  </div>
</template>

<style scoped>
.hero-container {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 100vh;
  width: 100%;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  /* Background image with gradient overlay */
  background-image: linear-gradient(to bottom, rgba(0, 10, 50, 0.6), rgba(0, 20, 80, 0.8)), url('/window.webp');

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
