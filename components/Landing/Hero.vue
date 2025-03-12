<script setup lang="ts">
import Button from 'primevue/button'
</script>

<template>
  <div
    class="relative flex h-full min-h-dvh w-full items-center justify-center bg-dark-50 dark:bg-dark-950"
  >
    <div class="relative z-20 w-11/12 md:w-10/12">
      <div class="flex flex-col items-center justify-center">
        <h1
          class="mt-8 text-center text-5xl font-semibold text-dark-900 sm:text-6xl md:text-7xl dark:text-dark-100"
        >
          AI Travel Agent Chat
        </h1>
        <p
          class="text-primary-950/60 dark:text-primary-50/50 mt-4 w-full text-center text-lg leading-8 sm:w-1/2 2xl:w-1/3 2xl:text-xl"
        >
          A multi agent network helping you explore various travel destinations
        </p>
        <div
          class="mt-8 flex flex-col-reverse items-center justify-center gap-4 lg:flex-row"
        >
          <NuxtLink to="#">
            <Button label="More Info" to="#">
              <template #icon>
                <font-awesome icon="fa-solid fa-arrow-down-long" class="p-button-icon-right" />
              </template>
            </Button>
          </NuxtLink>
          <NuxtLink to="/chat">
            <Button label="Get Started">
              <template #icon>
                <font-awesome icon="fa-solid fa-suitcase" class="p-button-icon-right" />
              </template>
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
