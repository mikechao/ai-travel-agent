<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem'
import Dialog from 'primevue/dialog'
import Dock from 'primevue/dock'
import WeatherCard from './weather/WeatherCard.vue'

const dataItemStore = useDataItemStore()

const weatherData = ref()
const displayWeather = ref(false)

const weatherMenuItem: MenuItem = {
  label: 'Weather',
  icon: './weather-icon.jpg',
  command(_event: MenuItemCommandEvent) {
    displayWeather.value = true
  },
}

const settingMenuItem: MenuItem = {
  label: 'Settings',
  icon: './settings-icon.jpg',
  command(event: MenuItemCommandEvent) {
    console.log('event inside settingsMenuItem', event)
  },
}
const menuItems: Ref<MenuItem[]> = ref([weatherMenuItem, settingMenuItem])

const processedDataItemIds = new Set()

watch(() => dataItemStore.dataItems, (newDataItems) => {
  console.log('got newDataItems.length in ResultsPanel', newDataItems.length)
  for (const dataItem of newDataItems) {
    if (!processedDataItemIds.has(dataItem.id)) {
      processDataItem(dataItem)
      processedDataItemIds.add(dataItem.id)
    }
  }
}, { deep: true })

function processDataItem(dataItem: DataItem) {
  switch (dataItem.type) {
    case 'weather': {
      weatherData.value = dataItem.data
      displayWeather.value = true
      break
    }
    default:
      console.error(`Unknown DataItem type ${dataItem.type}`)
  }
}

function onDockItemClick(event: MouseEvent, item: MenuItem) {
  console.log('onDockItemClick!!!!!!!')
  console.log('item', Object.prototype.toString.call(item))
  if (item.command) {
    item.command({ originalEvent: event, item })
  }

  event.preventDefault()
}
</script>

<template>
  <div class="dock-window">
    <Dock :model="menuItems" position="left">
      <template #item="{ item }">
        <a v-tooltip.top="item.label" href="#" class="p-dock-item-link" @click="onDockItemClick($event, item)">
          <img :alt="typeof item.label === 'string' ? item.label : ''" :src="item.icon" style="width: 100%">
        </a>
      </template>
    </Dock>
    <Dialog v-model:visible="displayWeather" header="Weather" :breakpoints="{ '960px': '50vw' }" :style="{ width: '40vw' }" :maximizable="true">
      <template #container>
        <WeatherCard :place="weatherData" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.dock-window {
  width: 100%;
  height: 100%;
  position: relative;
  background-image: url('https://primefaces.org/cdn/primevue/images/dock/window.jpg');
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
