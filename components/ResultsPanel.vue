<script setup lang="ts">
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem'
import Dialog from 'primevue/dialog'
import Dock from 'primevue/dock'
import { useToast } from 'primevue/usetoast'
import { DataItemTypes } from '~/types/constants'
import LocationList from './LocationList.vue'
import TravelRecommend from './recommend/TravelRecommend.vue'
import WeatherCard from './weather/WeatherCard.vue'

const toast = useToast()
const dataItemStore = useDataItemStore()

const weatherData = ref()
const displayWeather = ref(false)

const hotelsData = ref()
const displayHotels = ref(false)

const sightseeingData = ref()
const displaySights = ref(false)

const displaySettings = ref(false)

const searchQueryData = ref()
const displayRecommend = ref(false)

const baseZIndex = 5000
const weatherZIndex = ref(baseZIndex)
const hotelsZIndex = ref(baseZIndex)
const sightsZIndex = ref(baseZIndex)
const settingsZIndex = ref(baseZIndex)
const recommendZIndex = ref(baseZIndex)

let currentZIndex = baseZIndex

const recommendMenuItem: MenuItem = {
  label: `Recommendations`,
  icon: './recommend.png',
  disabled: true,
  command(_event: MenuItemCommandEvent) {
    // for now do nothing
  },
}

const weatherMenuItem: MenuItem = {
  label: 'Weather',
  icon: './weather-icon.webp',
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
  icon: './hotel.webp',
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
  icon: './sightseeing.webp',
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
  icon: './settings-icon.webp',
  command(_event: MenuItemCommandEvent) {
    currentZIndex += 1
    settingsZIndex.value = currentZIndex
    displaySettings.value = true
  },
}
const menuItems: Ref<MenuItem[]> = ref([recommendMenuItem, sightseeingMenuItem, hotelsMenuItem, weatherMenuItem, settingMenuItem])

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
    case DataItemTypes.Weather: {
      weatherData.value = dataItem.data
      weatherMenuItem.disabled = false
      // force vue to detect changes in menuItems
      menuItems.value = [...menuItems.value]
      currentZIndex += 1
      weatherZIndex.value = currentZIndex
      displayWeather.value = true
      toast.removeAllGroups()
      break
    }
    case DataItemTypes.HotelSearch: {
      hotelsData.value = dataItem.data
      hotelsMenuItem.disabled = false
      // force vue to detect changes in menuItems
      menuItems.value = [...menuItems.value]
      currentZIndex += 1
      hotelsZIndex.value = currentZIndex
      displayHotels.value = true
      toast.removeAllGroups()
      break
    }
    case DataItemTypes.SightSearch: {
      sightseeingData.value = dataItem.data
      sightseeingMenuItem.disabled = false
      // force vue to detect changes in menuItems
      menuItems.value = [...menuItems.value]
      currentZIndex += 1
      sightsZIndex.value = currentZIndex
      displaySights.value = true
      toast.removeAllGroups()
      break
    }
    case DataItemTypes.SearchQuery: {
      searchQueryData.value = dataItem.data
      recommendMenuItem.disabled = false
      menuItems.value = [...menuItems.value]
      currentZIndex += 1
      recommendZIndex.value = currentZIndex
      displayRecommend.value = true
      toast.removeAllGroups()
      break
    }
    default:
      console.error(`Unknown DataItem type ${dataItem.type}`)
  }
}

function onDockItemClick(event: MouseEvent, item: MenuItem) {
  if (item.disabled) {
    event.preventDefault()
    return
  }
  if (item.command) {
    item.command({ originalEvent: event, item })
  }

  event.preventDefault()
}

function updateZIndex(type: 'weather' | 'hotels' | 'sights' | 'settings' | 'recommend') {
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
    case 'settings':
      settingsZIndex.value = currentZIndex
      break
    case 'recommend':
      recommendZIndex.value = currentZIndex
      break
  }
}

const toastDetails = [
  'For example:\nCan you show me the weather in San Francisco,CA?',
  'For example:\nCan you suggest some sights to see near San Francisco,CA?',
  'For example:\nCan you show me some hotels near San Francisco,CA?',
]

const randomToastDetail = computed(() =>
  toastDetails[Math.floor(Math.random() * toastDetails.length)],
)

onMounted(() => {
  toast.add({
    severity: 'info',
    summary: 'Results from chat will be shown on this side',
    detail: randomToastDetail.value,
    group: 'initial',
  })
})
</script>

<template>
  <div class="flex justify-center">
    <Toast position="top-left" group="initial">
      <template #messageicon>
        <font-awesome icon="fa-regular fa-lightbulb" />
      </template>
    </Toast>
  </div>
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
      :base-z-index="weatherZIndex"
      :modal="false"
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
        header: {
          class: 'px-4 py-2',
        },
      }"
      @mousedown.stop="updateZIndex('weather')"
    >
      <template #header>
        <span class="p-dialog-title">
          <font-awesome icon="fa-solid fa-cloud-sun" class="mr-1" />Weather
        </span>
      </template>
      <WeatherCard :place="weatherData" />
    </Dialog>
    <Dialog
      v-model:visible="displayHotels"
      :base-z-index="hotelsZIndex"
      :modal="false"
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
        header: {
          class: 'px-4 py-2',
        },
      }"
      @mousedown.stop="updateZIndex('hotels')"
    >
      <template #header>
        <span class="p-dialog-title">
          <font-awesome icon="fa-solid fa-hotel" class="mr-1" />Hotel Locations
        </span>
      </template>
      <LocationList :locations="hotelsData" />
    </Dialog>
    <Dialog
      v-model:visible="displaySights"
      :base-z-index="sightsZIndex"
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
        header: {
          class: 'px-4 py-2',
        },
      }"
      @mousedown.stop="updateZIndex('sights')"
    >
      <template #header>
        <span class="p-dialog-title">
          <font-awesome icon="fa-solid fa-binoculars" class="mr-1" />Sights to See
        </span>
      </template>
      <LocationList :locations="sightseeingData" />
    </Dialog>
    <Dialog
      v-model:visible="displaySettings"
      :base-z-index="settingsZIndex"
      position="left"
      :keep-in-view-port="true"
      :pt="{
        mask: {
          style: {
            zIndex: settingsZIndex,
          },
        },
        header: {
          class: 'px-4 py-2',
        },
      }"
      @mousedown.stop="updateZIndex('settings')"
    >
      <template #header>
        <span class="p-dialog-title">
          <font-awesome icon="fa-solid fa-gears" class="mr-1" />Settings
        </span>
      </template>
      <SettingsPanel />
    </Dialog>
    <Dialog
      v-model:visible="displayRecommend"
      :base-z-index="recommendZIndex"
      :modal="false"
      position="left"
      :keep-in-view-port="true"
      :breakpoints="{ '960px': '50vw' }"
      :style="{ width: '40vw' }"
      :maximizable="true"
      :pt="{
        mask: {
          style: {
            zIndex: recommendZIndex,
          },
        },
        header: {
          class: 'px-4 py-2',
        },
      }"
      @mousedown.stop="updateZIndex('recommend')"
    >
      <template #header>
        <span class="p-dialog-title">
          <font-awesome icon="fa-solid fa-magnifying-glass-plus" class="mr-1" />Recommendations
        </span>
      </template>
      <TravelRecommend :queries="searchQueryData" />
    </Dialog>
  </div>
</template>

<style scoped>
</style>
