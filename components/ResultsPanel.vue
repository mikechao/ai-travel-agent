<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem'
import Dialog from 'primevue/dialog'
import Dock from 'primevue/dock'
import LocationList from './LocationList.vue'
import WeatherCard from './weather/WeatherCard.vue'

const dataItemStore = useDataItemStore()

const weatherData = ref()
const displayWeather = ref(false)

const hotelsData = ref()
const displayHotels = ref(false)

const sightseeingData = ref()
const displaySights = ref(false)

const baseZIndex = 5000
const weatherZIndex = ref(baseZIndex)
const hotelsZIndex = ref(baseZIndex)
const sightsZIndex = ref(baseZIndex)

let currentZIndex = baseZIndex

const weatherMenuItem: MenuItem = {
  label: 'Weather',
  icon: './weather-icon.jpg',
  disabled: true,
  command(_event: MenuItemCommandEvent) {
    if (weatherData.value) {
      currentZIndex += 1
      weatherZIndex.value = currentZIndex
      displayWeather.value = true
    }
  },
}

const hotelsMenuItem: MenuItem = {
  label: 'Hotels',
  icon: './hotel.png',
  disabled: true,
  command(_event: MenuItemCommandEvent) {
    if (hotelsData.value) {
      currentZIndex += 1
      hotelsZIndex.value = currentZIndex
      displayHotels.value = true
    }
  },
}

const sightseeingMenuItem: MenuItem = {
  label: 'Sights',
  icon: './sightseeing.png',
  disabled: true,
  command(_event: MenuItemCommandEvent) {
    if (sightseeingData.value) {
      currentZIndex += 1
      sightsZIndex.value = currentZIndex
      displaySights.value = true
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
const menuItems: Ref<MenuItem[]> = ref([sightseeingMenuItem, hotelsMenuItem, weatherMenuItem, settingMenuItem])

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
      // force vue to detect changes in menuItems
      menuItems.value = [...menuItems.value]
      currentZIndex += 1
      weatherZIndex.value = currentZIndex
      displayWeather.value = true
      break
    }
    case 'hotel-search': {
      hotelsData.value = dataItem.data
      hotelsMenuItem.disabled = false
      // force vue to detect changes in menuItems
      menuItems.value = [...menuItems.value]
      currentZIndex += 1
      hotelsZIndex.value = currentZIndex
      displayHotels.value = true
      break
    }
    case 'sight-search': {
      sightseeingData.value = dataItem.data
      sightseeingMenuItem.disabled = false
      // force vue to detect changes in menuItems
      menuItems.value = [...menuItems.value]
      currentZIndex += 1
      sightsZIndex.value = currentZIndex
      displaySights.value = true
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

function updateZIndex(type: 'weather' | 'hotels' | 'sights') {
  currentZIndex += 1
  switch (type) {
    case 'weather':
      weatherZIndex.value = currentZIndex
      break
    case 'hotels':
      hotelsZIndex.value = currentZIndex
      break
    case 'sights':
      sightsZIndex.value = currentZIndex
      break
  }
}
</script>

<template>
  <div>
    <Dock :model="menuItems" position="left">
      <template #item="{ item }">
        <a v-tooltip.top="item.label" href="javascript:void(0);" class="p-dock-item-link" @click="onDockItemClick($event, item)">
          <img :alt="typeof item.label === 'string' ? item.label : ''" :src="item.icon" style="width: 100%">
        </a>
      </template>
    </Dock>
    <Dialog
      v-model:visible="displayWeather"
      :auto-z-index="false"
      :base-z-index="weatherZIndex"
      :modal="false"
      header="Weather"
      position="left"
      :keep-in-view-port="true"
      :breakpoints="{ '960px': '50vw' }"
      :style="{ width: '40vw' }"
      :maximizable="true"
      :pt="{
        mask: {
          style: {
            zIndex: weatherZIndex,
          },
        },
      }"
      @mousedown="updateZIndex('weather')"
    >
      <WeatherCard :place="weatherData" />
    </Dialog>
    <Dialog
      v-model:visible="displayHotels"
      :auto-z-index="false"
      :base-z-index="hotelsZIndex"
      :modal="false"
      header="List of Hotel Locations"
      position="left"
      :keep-in-view-port="true"
      :breakpoints="{ '960px': '50vw' }"
      :style="{ width: '620px' }"
      :maximizable="true"
      :pt="{
        mask: {
          style: {
            zIndex: hotelsZIndex,
          },
        },
      }"
      @mousedown="updateZIndex('hotels')"
    >
      <LocationList :locations="hotelsData" />
    </Dialog>
    <Dialog
      v-model:visible="displaySights"
      :auto-z-index="false"
      :base-z-index="sightsZIndex"
      header="List of Sights to See"
      position="left"
      :keep-in-view-port="true"
      :breakpoints="{ '960px': '50vw' }"
      :style="{ width: '620px' }"
      :maximizable="true"
      :pt="{
        mask: {
          style: {
            zIndex: sightsZIndex,
          },
        },
      }"
      @mousedown="updateZIndex('sights')"
    >
      <LocationList :locations="sightseeingData" />
    </Dialog>
  </div>
</template>

<style scoped>

</style>
