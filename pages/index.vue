<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
</script>

<template>
  <Splitter style="height: max-content;">
    <SplitterPanel class="flex items-center justify-center" :size="50" :min-size="25">
      <ResultsPanel class="h-max" />
    </SplitterPanel>
    <SplitterPanel class="flex items-center justify-center" :size="50" :min-size="25">
      <ChatComponent class="h-max" />
    </SplitterPanel>
  </Splitter>
</template>
