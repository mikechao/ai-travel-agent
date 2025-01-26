<!-- eslint-disable no-console -->
<script setup lang="ts">
import WeatherCard from './weather/WeatherCard.vue'

const dataItemStore = useDataItemStore()
const { dataItems } = storeToRefs(dataItemStore)

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
  <div v-if="dataItems && dataItems.length">
    <div v-for="(item, index) of dataItems" :key="index">
      <component
        :is="getComponentType(item)"
        :key="item.id"
        v-bind="getComponentProps(item)"
        class="mt-2"
      />
    </div>
  </div>
  <div v-else>
    <h1>Show some UI results here</h1>
  </div>
</template>
