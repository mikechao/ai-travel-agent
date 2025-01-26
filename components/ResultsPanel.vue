<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import Dock from 'primevue/dock'
import WeatherCard from './weather/WeatherCard.vue'

const dataItemStore = useDataItemStore()
const { dataItems } = storeToRefs(dataItemStore)
const menuItems: Ref<MenuItem[]> = ref([])

watch(dataItems, (newDataItems) => {
  console.log('got newDataItems in ResultsPanel', newDataItems)
})

function getComponentType(item: DataItem) {
  switch (item.type) {
    case 'weather':
      return WeatherCard
    default:
      throw new Error('Unknown component type')
  }
}

function getComponentProps(item: DataItem): Record<string, any> {
  switch (item.type) {
    case 'weather':
      return { place: item.data }
    default:
      return {}
  }
}
</script>

<template>
  <Dock :model="menuItems" position="left">
    <template #itemicon="{ item }">
      <img v-tooltip.top="typeof item.label === 'function' ? item.label() : item.label" :alt="typeof item.label === 'function' ? item.label() : item.label" :src="item.icon" style="width: 100%">
    </template>
  </Dock>
</template>
