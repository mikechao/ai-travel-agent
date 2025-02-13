<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { updatePrimaryColors } from '~/composables/updatePrimaryColors'
import { updateSurfaceColors } from '~/composables/updateSurfaceColors'

onMounted(() => {
  // const { initBackground } = useBackground()
  // initBackground()

  const colorMode = useColorMode()
  // have to use a watch here since color mode
  // is detected on the client side
  watch(
    () => colorMode.value,
    (newValue) => {
      if (newValue === 'dark') {
        document.documentElement.classList.add('p-dark')
      }
      else {
        document.documentElement.classList.remove('p-dark')
      }
    },
  )
  const primaryColor = localStorage.getItem('ai-travel-agent-pColor')
  if (primaryColor) {
    const primevue = usePrimeVue()
    if (primevue.config.theme.preset.primitive) {
      const key = Object.keys(primevue.config.theme.preset.primitive).find(k => k === primaryColor)
      if (key) {
        const values = primevue.config.theme.preset.primitive[key]
        const colorDef = { name: key, palette: { ...values } }
        updatePrimaryColors(colorDef)
      }
    }
  }
  const surfaceColor = localStorage.getItem('ai-travel-agent-sColor')
  if (surfaceColor) {
    const primevue = usePrimeVue()
    if (primevue.config.theme.preset.primitive) {
      const key = Object.keys(primevue.config.theme.preset.primitive).find(k => k === surfaceColor)
      if (key) {
        const values = primevue.config.theme.preset.primitive[key]
        const colorDef = { name: key, palette: { ...values } }
        updateSurfaceColors(colorDef)
      }
    }
  }
})
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
