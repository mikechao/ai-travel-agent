<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

const ChatComponent = defineAsyncComponent(() => import('~/components/ChatComponent.vue'))
const ResultPanel = defineAsyncComponent(() => import('~/components/ResultsPanel.vue'))
</script>

<template>
  <Splitter style="height: max-content;">
    <SplitterPanel class="flex items-center justify-center">
      <ResultPanel />
    </SplitterPanel>
    <SplitterPanel class="flex items-center justify-center">
      <ChatComponent />
    </SplitterPanel>
  </Splitter>
</template>
