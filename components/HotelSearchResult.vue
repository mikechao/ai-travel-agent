<script setup lang="ts">
import Card from 'primevue/card'

export interface Props {
  locations: Location[]
}
defineProps<Props>()

function roundDistance(distance: string) {
  return parseFloat(distance).toFixed(2)
}
</script>

<template>
  <div class="w-[600px] bg-white rounded-lg shadow-lg">
    <div class="p-6">
      <h1 class="text-3xl font-title text-neutral-950 border-b border-neutral-300 pb-4 mb-6">
        List of Locations
      </h1>
      <div class="space-y-4">
        <Card v-for="location in locations" :key="location.location_id" class="flex items-start bg-neutral-50 border border-neutral-200 rounded-md shadow-md hover:shadow-xl transition-all">
          <template #title>
            <p class="text-lg font-semibold text-neutral-950 mb-1">
              {{ location.name }}
            </p>
          </template>
          <template #content>
            <div class="flex-1">
              <p class="text-neutral-700 flex items-center">
                <font-awesome icon="fa-solid fa-route" class="mr-1 rounded-full" />
                <span class=" text-neutral-700 mr-1">Distance: {{ roundDistance(location.distance) }} mi</span>
              </p>
              <p class="text-neutral-700 flex items-center">
                <font-awesome icon="fa-solid fa-location-dot" class="mr-2 rounded-full" />
                <span class="text-neutral-700 mr-1">Address: {{ location.address_obj.address_string }}</span>
              </p>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
