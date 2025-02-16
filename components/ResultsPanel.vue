<script setup lang="ts">
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem'
import Dialog from 'primevue/dialog'
import Dock from 'primevue/dock'
import { useToast } from 'primevue/usetoast'
import { useActiveAgentStore } from '~/stores/activeAgentStore'
import { DataItemTypes } from '~/types/constants'
import ActiveAgent from './agent/ActiveAgent.vue'

const LocationList = defineAsyncComponent(() => import('./LocationList.vue'))
const TravelRecommend = defineAsyncComponent(() => import('./recommend/TravelRecommend.vue'))
const WeatherCard = defineAsyncComponent(() => import('./weather/WeatherCard.vue'))
const SettingsPanel = defineAsyncComponent(() => import('./settings/SettingsPanel.vue'))

const toast = useToast()
const dataItemStore = useDataItemStore()
const activeAgentStore = useActiveAgentStore()

const activeAgent = ref()

const weatherData = ref()
const displayWeather = ref(false)

const hotelsData = ref()
const displayHotels = ref(false)

const sightseeingData = ref()
const displaySights = ref(false)

const displaySettings = ref(false)

const activeTab = ref()
const searchQueryData = ref()
const searchResultData = ref()
const searchSummaryData = ref()
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
    if (searchQueryData.value || searchResultData.value || searchSummaryData.value) {
      currentZIndex += 1
      recommendZIndex.value = currentZIndex
      displayRecommend.value = true
    }
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

const dataItemHandlers = {
  [DataItemTypes.SearchQuery]: {
    dataRef: searchQueryData,
    menuItem: recommendMenuItem,
    tab: 'queries',
    zIndex: recommendZIndex,
    display: displayRecommend,
  },
  [DataItemTypes.SearchExecution]: {
    dataRef: searchResultData,
    menuItem: recommendMenuItem,
    tab: 'results',
    zIndex: recommendZIndex,
    display: displayRecommend,
  },
  [DataItemTypes.SearchSummary]: {
    dataRef: searchSummaryData,
    menuItem: recommendMenuItem,
    tab: 'summary',
    zIndex: recommendZIndex,
    display: displayRecommend,
  },
  [DataItemTypes.Weather]: {
    dataRef: weatherData,
    menuItem: weatherMenuItem,
    zIndex: weatherZIndex,
    display: displayWeather,
  },
  [DataItemTypes.HotelSearch]: {
    dataRef: hotelsData,
    menuItem: hotelsMenuItem,
    zIndex: hotelsZIndex,
    display: displayHotels,
  },
  [DataItemTypes.SightSearch]: {
    dataRef: sightseeingData,
    menuItem: sightseeingMenuItem,
    zIndex: sightsZIndex,
    display: displaySights,
  },
}

function handleDataItem(config: {
  dataRef: Ref
  menuItem: MenuItem
  tab?: string
  zIndex: Ref<number>
  display: Ref<boolean>
}, data: string) {
  config.dataRef.value = data
  if (config.tab) {
    activeTab.value = config.tab
  }
  config.menuItem.disabled = false
  menuItems.value = [...menuItems.value]
  currentZIndex += 1
  config.zIndex.value = currentZIndex
  config.display.value = true
  toast.removeAllGroups()
}

function processDataItem(dataItem: DataItem) {
  switch (dataItem.type) {
    case DataItemTypes.SearchQuery:
    case DataItemTypes.SearchExecution:
    case DataItemTypes.SearchSummary:
    case DataItemTypes.Weather:
    case DataItemTypes.HotelSearch:
    case DataItemTypes.SightSearch: {
      const config = dataItemHandlers[dataItem.type]
      handleDataItem(config, dataItem.data)
      break
    }
    case DataItemTypes.TransferToHotel:
    case DataItemTypes.TransferToSights:
    case DataItemTypes.TransferToTravel:
    case DataItemTypes.TransferToWeather: {
      const transferResult = dataItem.data as unknown as AdvisorTransferResult
      activeAgentStore.setActiveAgent(transferResult.agentName)
      activeAgent.value = dataItem.data
      break
    }
    default: {
      console.error('Unknown dataItem.type', dataItem.type)
    }
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
  'For example:\nCan you show me the weather in San Francisco, CA?',
  'For example:\nCan you suggest some sights to see near San Francisco, CA?',
  'For example:\nCan you show me some hotels near San Francisco, CA?',
  'For example:\nCan you suggest travel destinations based on my interest in cats?',
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
    <Toast
      position="top-left"
      group="initial"
      :style="{
        position: 'fixed',
        top: '20px',
        left: 'calc((100vw / 4))',
        transform: 'translateX(-50%)',
      }"
      :pt="{
        messageContent: {
          class: 'bg-white/10 border border-white/10 rounded-xl',
        },
        message: {
          class: 'bg-white/10 border border-white/10 rounded-xl',
        },
        summary: {
          class: 'text-surface-900 dark:text-surface-200 font-semibold',
        },
        closeButton: {
          class: [
            'w-8 h-8 rounded-full transition-colors duration-200',
            'hover:bg-surface-100 dark:hover:bg-surface-800',
            'focus:outline-none focus:outline-offset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-400',
            '!outline-surface-400',
          ],
          style: {
            outline: 'none',
          },
        },
        closeIcon: {
          class: 'text-surface-900 dark:text-surface-200',
        },
      }"
    >
      <template #messageicon>
        <font-awesome icon="fa-regular fa-lightbulb" class="text-surface-900 dark:text-surface-200" />
      </template>
    </Toast>
  </div>
  <div class="flex justify-center">
    <ActiveAgent
      :active="activeAgent"
      :style="{
        position: 'fixed',
        bottom: '0px',
        left: 'calc((100vw / 4))',
        transform: 'translateX(-50%)',
      }"
    />
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
      }"
      @mousedown.stop="updateZIndex('weather')"
    >
      <template #header>
        <span class="p-dialog-title">
          <font-awesome icon="fa-solid fa-cloud-sun" class="mr-1" />Weather
        </span>
      </template>
      <WeatherCard :weather="weatherData" />
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
      }"
      @mousedown.stop="updateZIndex('recommend')"
    >
      <template #header>
        <span class="p-dialog-title">
          <font-awesome icon="fa-solid fa-magnifying-glass-plus" class="mr-1" />Recommendations
        </span>
      </template>
      <TravelRecommend :active-tab="activeTab" :queries="searchQueryData" :results="searchResultData" :summary="searchSummaryData" />
    </Dialog>
  </div>
</template>

<style scoped>
</style>
