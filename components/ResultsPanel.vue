<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem'
import Dialog from 'primevue/dialog'
import Dock from 'primevue/dock'
import LocationList from './LocationList.vue'
import WeatherCard from './weather/WeatherCard.vue'

const dataItemStore = useDataItemStore()

const dockKey = ref(newDockKey())

const weatherData = ref()
const displayWeather = ref(false)

const locationsData = ref()
const displayLocations = ref(false)

const weatherMenuItem: MenuItem = {
  label: 'Weather',
  icon: './weather-icon.jpg',
  disabled: true,
  command(_event: MenuItemCommandEvent) {
    if (weatherData.value) {
      displayWeather.value = true
    }
  },
}

const hotelsMenuItem: MenuItem = {
  label: 'Hotels',
  icon: './hotel.png',
  disabled: true,
  command(_event: MenuItemCommandEvent) {
    if (locationsData.value) {
      displayLocations.value = true
    }
  },
}

const settingMenuItem: MenuItem = {
  label: 'Settings',
  icon: './settings-icon.jpg',
  command(event: MenuItemCommandEvent) {
    console.log('event inside settingsMenuItem', event)
  },
}
const menuItems: Ref<MenuItem[]> = ref([hotelsMenuItem, weatherMenuItem, settingMenuItem])

const processedDataItemIds = new Set()

watch(() => dataItemStore.dataItems, (newDataItems) => {
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
      weatherMenuItem.disabled = false
      dockKey.value = newDockKey()
      displayWeather.value = true
      break
    }
    case 'hotel-search': {
      locationsData.value = dataItem.data
      hotelsMenuItem.disabled = false
      dockKey.value = newDockKey()
      displayLocations.value = true
      break
    }
    default:
      console.error(`Unknown DataItem type ${dataItem.type}`)
  }
}

function onDockItemClick(event: MouseEvent, item: MenuItem) {
  if (item.command) {
    item.command({ originalEvent: event, item })
  }

  event.preventDefault()
}

function newDockKey() {
  return Math.random() * 10000
}
</script>

<template>
  <div>
    <Dock :key="dockKey" :model="menuItems" position="left">
      <template #item="{ item }">
        <a v-tooltip.top="item.label" href="#" class="p-dock-item-link" @click="onDockItemClick($event, item)">
          <img :alt="typeof item.label === 'string' ? item.label : ''" :src="item.icon" style="width: 100%">
        </a>
      </template>
    </Dock>
    <Dialog v-model:visible="displayWeather" header="Weather" position="left" :keep-in-view-port="true" :breakpoints="{ '960px': '50vw' }" :style="{ width: '40vw' }" :maximizable="true">
      <WeatherCard :place="weatherData" />
    </Dialog>
    <Dialog v-model:visible="displayLocations" header="List of Hotel Locations" position="left" :keep-in-view-port="true" :breakpoints="{ '960px': '50vw' }" :style="{ width: '620px' }" :maximizable="true">
      <LocationList :locations="locationsData" />
    </Dialog>
  </div>
</template>

<style scoped>

</style>
