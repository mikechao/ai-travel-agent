<script setup lang="ts">
import { NodeNames } from '~/types/enums'

const props = defineProps({
  active: {
    type: Object as PropType<AdvisorTransferResult>,
    default: () => {
      return { goto: NodeNames.TravelAdvisor, agentName: 'Pluto the Pup' }
    },
  },
})

function isActiveCSS(name: string) {
  if (name === props.active.agentName) {
    return 'animate-bounce'
  }
  return ''
}
</script>

<template>
  <div class="bg-transparent">
    <p>Active: {{ active.agentName }}</p>
    <div class="flex flex-row gap-2">
      <p class="text-lg" :class="isActiveCSS('Pluto the Pup')">
        🐶
      </p>
      <p class="text-lg" :class="isActiveCSS('Petey the Pirate')">
        🏴‍☠️
      </p>
      <p class="text-lg" :class="isActiveCSS('Penny Restmore')">
        🏨
      </p>
      <p class="text-lg" :class="isActiveCSS('Polly Parrot')">
        🦜
      </p>
    </div>
  </div>
</template>
