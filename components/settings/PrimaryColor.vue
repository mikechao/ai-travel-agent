<script setup lang="ts">
type PaletteShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

type ColorPalette = {
  [shade in PaletteShade]: string
}

interface ColorDefinition {
  name: string
  palette: ColorPalette
}

const currentPrimaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--p-primary-color')
  .trim()

const primevue = usePrimeVue()

const keys = Object.keys(primevue.config.theme.preset.primitive).filter(key => key !== 'borderRadius')

const selectedPrimaryColor = ref()

const primaryColors: ColorDefinition[] = []
for (const key of keys) {
  const values = primevue.config.theme.preset.primitive[key]
  if (values['500'] === currentPrimaryColor) {
    selectedPrimaryColor.value = key
  }
  primaryColors.push ({ name: key, palette: { ...values } })
}

function updatePrimaryColor(primaryColor: ColorDefinition) {
  selectedPrimaryColor.value = primaryColor.name
  Object.keys(primaryColor.palette).forEach((key) => {
    const shade = key as unknown as PaletteShade
    document.documentElement.style.setProperty(`--p-primary-${shade}`, primaryColor.palette[shade])
  })
}
</script>

<template>
  <div class="config-panel-colors">
    <span class="config-panel-label">Primary</span>
    <div>
      <button
        v-for="primaryColor of primaryColors"
        :key="primaryColor.name"
        type="button"
        :class="{ 'active-color': selectedPrimaryColor === primaryColor.name }"
        :style="{ backgroundColor: `${primaryColor.palette[500]}` }"
        @click="updatePrimaryColor(primaryColor)"
      />
    </div>
  </div>
</template>

<style scoped>
.config-panel-colors {
  > div {
    padding-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    button {
      border: none;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      padding: 0;
      cursor: pointer;
      outline-color: transparent;
      outline-width: 2px;
      outline-style: solid;

      &.active-color {
        outline-color: var(--primary-color);
      }
    }
  }
}
</style>
