<script setup lang="ts">
import Card from 'primevue/card'

export interface Props {
  locations: Location[]
}
defineProps<Props>()

const locationDetails = ref(new Map<string, LocationDetails>())
const locationIsLoading = ref(new Map<string, boolean>())
const hideLocationDetails = ref(new Map<string, boolean>())

async function fetchDetails(location: Location) {
  if (!locationDetails.value.has(location.location_id)) {
    locationIsLoading.value.set(location.location_id, true)
    const data = await $fetch(`/api/location/details?locationId=${location.location_id}`)
    const hotel = data as LocationDetails
    locationDetails.value.set(hotel.location_id, hotel)
    hideLocationDetails.value.set(location.location_id, false)
    locationIsLoading.value.set(location.location_id, false)
  }
  hideLocationDetails.value.set(location.location_id, false)
}

function getHotel(location: Location) {
  return locationDetails.value.get(location.location_id) as LocationDetails
}

function hideDetails(location: Location) {
  hideLocationDetails.value.set(location.location_id, true)
}

function roundDistance(distance: string) {
  return Number.parseFloat(distance).toFixed(2)
}
</script>

<template>
  <div class="w-auto bg-white rounded-lg shadow-lg">
    <div class="p-1">
      <div class="space-y-2 flex flex-col items-start">
        <Card
          v-for="location in locations"
          :key="location.location_id"
          class="w-full flex items-start bg-primary-50 border border-primary-200 rounded-md shadow-md hover:shadow-xl transition-all"
        >
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
            <div class="mt-1 mb-2">
              <Button
                type="button"
                label="Show Details"
                icon-pos="right"
                size="small"
                rounded
                raised
                :loading="locationIsLoading.get(location.location_id)"
                class="mr-1"
                @click="fetchDetails(location)"
              >
                <template #icon>
                  <font-awesome icon="fa-solid fa-chevron-down" class="p-button-icon-right" />
                </template>
              </Button>
              <Button
                type="button"
                label="Hide Details"
                size="small"
                icon-pos="right"
                rounded
                raised
                @click="hideDetails(location)"
              >
                <template #icon>
                  <font-awesome icon="fa-solid fa-chevron-up" class="p-button-icon-right" />
                </template>
              </Button>
            </div>
            <div v-if="locationDetails.get(location.location_id) && !hideLocationDetails.get(location.location_id)">
              <LocationDetails :hotel="getHotel(location)" />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
