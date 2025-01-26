<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
</script>

<template>
  <Splitter style="height: max-content;">
    <SplitterPanel class="flex items-center justify-center">
      <ResultsPanel class="h-max" />
    </SplitterPanel>
    <SplitterPanel class="flex items-center justify-center">
      <ChatComponent class="h-max" />
    </SplitterPanel>
  </Splitter>
</template>
