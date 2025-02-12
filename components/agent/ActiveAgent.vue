<script setup lang="ts">
import { NodeNames } from '~/types/enums'

defineProps({
  active: {
    type: Object as PropType<AdvisorTransferResult>,
    default: () => {
      return { goto: NodeNames.TravelAdvisor, agentName: 'Pluto the Pup' }
    },
  },
})
</script>

<template>
  <div>
    <pre>
      {{ active.agentName }}
    </pre>
  </div>
</template>
