<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

const colorMode = useColorMode()
if (colorMode.value === 'dark') {
  document.documentElement.classList.add('p-dark')
}
</script>

<template>
  <ClientOnly>
    <Splitter class="h-screen splitter">
      <SplitterPanel class="flex" :size="50" :min-size="25">
        <ResultsPanel class="w-full h-full" />
      </SplitterPanel>
      <SplitterPanel class="flex" :size="50" :min-size="25">
        <ChatComponent class="w-full h-full" />
      </SplitterPanel>
    </Splitter>
  </ClientOnly>
</template>

<style scoped>
.splitter {
  position: relative;
  background-image: url('/window.webp');
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
