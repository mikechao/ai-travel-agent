<script setup lang="ts">
const currentPrimaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--p-primary-color')
  .trim()
const currentSurfaceColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--p-surface-500')
  .trim()

const surfaceColorNames = ['slate', 'gray', 'zinc', 'neutral', 'stone']
const primevue = usePrimeVue()
const selectedPrimaryColor = ref()
const selectedSurfaceColor = ref()

const primaryColorKeys = Object.keys(primevue.config.theme.preset.primitive).filter(key => key !== 'borderRadius' && !surfaceColorNames.includes(key))

const primaryColors = ref<ColorDefinition[]>([])
for (const key of primaryColorKeys) {
  const values = primevue.config.theme.preset.primitive[key]
  if (values['500'] === currentPrimaryColor) {
    selectedPrimaryColor.value = key
  }
  primaryColors.value.push ({ name: key, palette: { ...values } })
}

const surfaceColorKeys = Object.keys(primevue.config.theme.preset.primitive).filter(key => surfaceColorNames.includes(key))
const surfaceColors: ColorDefinition[] = []
for (const key of surfaceColorKeys) {
  const values = primevue.config.theme.preset.primitive[key]
  if (values['500'] === currentSurfaceColor) {
    selectedSurfaceColor.value = key
  }
  surfaceColors.push({ name: key, palette: { ...values } })
}

function updatePrimaryColor(primaryColor: ColorDefinition) {
  selectedPrimaryColor.value = primaryColor.name
  Object.keys(primaryColor.palette).forEach((key) => {
    const shade = key as unknown as PaletteShade
    document.documentElement.style.setProperty(`--p-primary-${shade}`, primaryColor.palette[shade])
  })
}

function updateSurfaceColor(surfaceColor: ColorDefinition) {
  selectedSurfaceColor.value = surfaceColor.name
  Object.keys(surfaceColor.palette).forEach((key) => {
    const shade = key as unknown as PaletteShade
    document.documentElement.style.setProperty(`--p-surface-${shade}`, surfaceColor.palette[shade])
  })
}

function primaryColorOutline(name: string) {
  if (selectedPrimaryColor.value === name) {
    return 'outline-black dark:outline-white'
  }
  return 'outline-transparent'
}

function surfaceColorOutline(name: string) {
  if (selectedSurfaceColor.value === name) {
    return 'outline-black dark:outline-white'
  }
  return 'outline-transparent'
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-sm text-surface-700 dark:text-surface-0 font-semibold leading-none">Primary Color</span>
    <div class="grid grid-cols-5 gap-2 pt-2">
      <button
        v-for="primaryColor in primaryColors"
        :key="primaryColor.name"
        type="button"
        class="w-5 h-5 rounded-full cursor-pointer outline-2 outline"
        :class="primaryColorOutline(primaryColor.name)"
        :style="{ backgroundColor: `${primaryColor.palette[500]}` }"
        @click="updatePrimaryColor(primaryColor)"
      />
    </div>
  </div>
  <div class="flex flex-col gap-2 mt-2">
    <span class="text-sm text-surface-700 dark:text-surface-0 font-semibold leading-none">Surface Color</span>
    <div class="grid grid-cols-5 gap-2 pt-2">
      <button
        v-for="surfaceColor in surfaceColors"
        :key="surfaceColor.name"
        type="button"
        class="w-5 h-5 rounded-full cursor-pointer outline-2 outline"
        :class="surfaceColorOutline(surfaceColor.name)"
        :style="{ backgroundColor: `${surfaceColor.palette[500]}` }"
        @click="updateSurfaceColor(surfaceColor)"
      />
    </div>
  </div>
</template>
