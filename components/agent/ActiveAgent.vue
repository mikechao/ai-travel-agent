<script setup lang="ts">
import { type AgentName, AgentNames, AgentToEmoji } from '~/types/constants'
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
  <div class="bg-white/10 border border-white/10 rounded-xl p-1">
    <p class="text-surface-900 dark:text-surface-0">
      Active: {{ active.agentName }}
    </p>
    <div class="flex flex-row gap-3">
      <p
        v-for="(emoji, name) in AgentToEmoji"
        :key="name"
        class="text-xl transition-all duration-300"
        :class="isActiveCSS(name)"
        :aria-label="name"
      >
        {{ emoji }}
      </p>
    </div>
  </div>
</template>
