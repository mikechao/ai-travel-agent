<!-- eslint-disable no-console -->
<script setup lang="ts">
const dataItemStore = useDataItemStore()
const { dataItems } = storeToRefs(dataItemStore)

watch(dataItems, (newDataItems) => {
  console.log('got newDataItems in ResultsPanel', newDataItems)
})
</script>

<template>
  <h1>Show some UI results here</h1>
  <div v-if="dataItems">
    <div v-for="(item, index) of dataItems" :key="index">
      {{ item }}
      {{ index }}
    </div>
  </div>
</template>
