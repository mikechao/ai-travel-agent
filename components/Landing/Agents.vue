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
    class="grid h-auto w-full grid-cols-12 gap-y-24 py-24 xl:gap-x-24 xl:gap-y-0 xl:px-4"
  >
    <div
      class="col-span-full flex flex-col items-start justify-center gap-y-8 xl:col-span-4"
    >
      <h1
        class="mx-auto text-left text-3xl font-medium text-primary-50 md:w-11/12 md:text-center lg:text-4xl xl:w-full xl:text-left dark:text-dark-50"
      >
        Meet the Agents
      </h1>
      <p
        class="mx-auto w-full text-left text-lg text-primary-50 md:w-10/12 md:text-center xl:w-full xl:text-left dark:text-dark-50/50"
      >
        There are a total of 4 AI Agents in our network, each with a unique set of skills and knowledge to help you explore various travel destinations.
      </p>
    </div>
    <div
      class="col-span-full grid w-full grid-cols-subgrid gap-y-12 md:gap-x-6 xl:col-span-8"
    >
      <template v-for="(feat, index) in features" :key="index">
        <div
          class="col-span-full flex h-auto flex-col justify-center gap-x-4 gap-y-4 rounded-lg transition-all duration-300 ease-in-out md:col-span-6 md:items-center xl:col-span-4"
        >
          <div
            class="border-primary-500/50 bg-primary-100/10 dark:bg-primary-50/10 flex h-12 w-12 flex-auto items-center justify-center rounded-full border p-3"
          >
            <span class="text-xl size-8">
              {{ feat.emoji }}
            </span>
          </div>
          <span class="text-xl font-semibold text-primary-50">{{
            feat.name
          }}</span>
          <p
            class="px-0 text-left text-base font-normal text-primary-50 md:text-center dark:text-dark-50/50"
          >
            {{ feat.description }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
