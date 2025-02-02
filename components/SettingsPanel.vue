<script setup lang="ts">
import type { SelectButtonChangeEvent } from 'primevue/selectbutton'

const value = ref(null)
const options = ref([
  { icon: 'fa-regular fa-moon', text: 'Dark' },
  { icon: 'fa-regular fa-sun', text: 'Light' },
])

function buttonChanged(event: SelectButtonChangeEvent) {
  console.log('event', event)
}
</script>

<template>
  <div class="flex justify-center">
    <SelectButton v-model="value" :options="options" option-label="text" @change="buttonChanged">
      <template #option="slotProps">
        <span>{{ slotProps.option.text }}</span>
        <font-awesome :icon="slotProps.option.icon" />
      </template>
    </SelectButton>
  </div>
</template>
