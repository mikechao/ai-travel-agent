<script setup lang="ts">
import { type AgentName, AgentNames } from '~/types/constants'
import { NodeNames } from '~/types/enums'

const props = defineProps({
  active: {
    type: Object as PropType<AdvisorTransferResult>,
    default: () => {
      return { goto: NodeNames.TravelAdvisor, agentName: AgentNames.PLUTO }
    },
  },
})

function isActiveCSS(name: AgentName) {
  if (name === props.active.agentName) {
    return 'animate-bounce'
  }
  return ''
}
</script>

<template>
  <div class="bg-transparent">
    <p>Active: {{ active.agentName }}</p>
    <div class="flex flex-row gap-3">
      <p class="text-xl" :class="isActiveCSS(AgentNames.PLUTO)">
        🐶
      </p>
      <p class="text-xl" :class="isActiveCSS(AgentNames.PETEY)">
        🏴‍☠️
      </p>
      <p class="text-xl" :class="isActiveCSS(AgentNames.PENNY)">
        🏨
      </p>
      <p class="text-xl" :class="isActiveCSS(AgentNames.POLLY)">
        🦜
      </p>
    </div>
  </div>
</template>
