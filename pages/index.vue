<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
</script>

<template>
  <Splitter class="h-screen splitter">
    <SplitterPanel class="flex" :size="50" :min-size="25">
      <ResultsPanel class="w-full h-full" />
    </SplitterPanel>
    <SplitterPanel class="flex" :size="50" :min-size="25">
      <ChatComponent class="w-full h-full" />
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
.splitter {
  position: relative;
  background-image: url('/window.webp');
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
