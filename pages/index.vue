<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
</script>

<template>
  <Splitter style="height: max-content;">
    <SplitterPanel class="flex items-center justify-center">
      <ResultsPanel />
    </SplitterPanel>
    <SplitterPanel class="flex items-center justify-center">
      <ChatComponent />
    </SplitterPanel>
  </Splitter>
</template>
