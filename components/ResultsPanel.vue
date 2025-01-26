<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem'
import Dock from 'primevue/dock'
import WeatherCard from './weather/WeatherCard.vue'

const dataItemStore = useDataItemStore()
const { dataItems } = storeToRefs(dataItemStore)

const weatherMenuItem: MenuItem = {
  label: 'Weather',
  icon: './weather-icon.jpg',
  command(event: MenuItemCommandEvent) {
    console.log('event inside weatherMenuItem', event)
  },
}

const settingMenuItem: MenuItem = {
  label: 'Settings',
  icon: 'https://primefaces.org/cdn/primevue/images/dock/finder.svg',
  command(event: MenuItemCommandEvent) {
    console.log('event inside settingsMenuItem', event)
  },
}
const menuItems: Ref<MenuItem[]> = ref([weatherMenuItem, settingMenuItem])

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
