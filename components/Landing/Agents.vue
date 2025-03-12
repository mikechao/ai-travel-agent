<script setup lang="ts">
import { AgentDetails, AgentNames } from '~/types/constants'

const features = [
  {
    ...AgentDetails[AgentNames.PLUTO],
    description:
      'The general travel agent who helps users explore their travel interests by generating search queries and surfing the web for information.',
  },
  {
    ...AgentDetails[AgentNames.PETEY],
    description:
      'Our weather forecasting agent provides real-time weather updates for your travel destinations. Also provides advice on what to pack for your trip based on the weather.',
  },
  {
    ...AgentDetails[AgentNames.PENNY],
    description:
      'The hotel specialist agent who helps users find the best hotels and accommodations for their travel destinations.',
  },
  {
    ...AgentDetails[AgentNames.POLLY],
    description:
      'The sightseeing agent who helps users find the best tourist attractions and activities for their travel destinations.',
  },
]
</script>

<template>
  <div
    id="meet-agents"
    class="w-full py-24 px-4 md:px-8"
  >
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="text-center mb-16">
        <h2 class="text-3xl font-medium text-primary-50 lg:text-4xl dark:text-dark-50 mb-4">
          Meet the Agents
        </h2>
        <p class="text-lg text-primary-50 dark:text-dark-50/50 max-w-3xl mx-auto">
          There are a total of 4 AI Agents in our network, each with a unique set of skills and knowledge to help you explore various travel destinations.
        </p>
      </div>

      <!-- Card Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card v-for="(feat, index) in features" :key="index" class="h-full">
          <template #title>
            <div class="flex items-center gap-3">
              <span class="text-2xl flex-shrink-0">{{ feat.emoji }}</span>
              <span class="text-xl font-semibold text-primary-50">{{ feat.name }}</span>
            </div>
          </template>
          <template #content>
            <p class="text-primary-50/80 dark:text-dark-50/80">
              {{ feat.description }}
            </p>
          </template>
        </Card>
      </div>

      <div class="flex justify-center mt-10">
        <NuxtLink to="/chat" :prefetch="false">
          <Button
            label="Chat with Our Agents"
            class="text-lg"
          >
            <template #icon>
              <font-awesome icon="fa-solid fa-comments" class="p-button-icon-right" />
            </template>
          </Button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: transparent !important;
  box-shadow: none !important;
}

:deep(.p-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.p-card-content) {
  flex: 1;
}
</style>
