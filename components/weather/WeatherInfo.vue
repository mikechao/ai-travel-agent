<script setup>
const props = defineProps({
  place: Object
})
const place = props.place
</script>

<template>
  <div
    class="absolute bg-white/80 backdrop-blur-sm text-slate-900 inset-x-0 bottom-0 rounded-t-lg p-8"
  >
    <!-- Close button -->
    <div class="flex justify-end mb-10">
      <button @click="$emit('close-info')" class="p-1">
        <font-awesome icon="fa-solid fa-xmark" class="text-xl"/>
      </button>
    </div>

    <div class="flex items-center justify-between gap-6 mb-20">
      <!-- Wind speed -->
      <div class="text-center flex-1">
        <font-awesome icon="fa-solid fa-wind" size="2x" class="mb-1"/>
        <p class="text-xl font-bold">{{ place.current.wind_mph }} mp/h</p>
        <p>wind</p>
      </div>
      <!-- Humidity level -->
      <div class="text-center flex-1">
        <font-awesome icon="fa-solid fa-droplet" size="2x" class="mb-1"/>
        <p class="text-xl font-bold">{{ place.current.humidity }}%</p>
        <p>humidity</p>
      </div>
      <!-- Precipitation -->
      <div class="text-center flex-1">
        <font-awesome icon="fa-solid fa-umbrella" size="2x" class="mb-1"/>
        <p class="text-xl font-bold">{{ place.current.precip_in }} in</p>
        <p>precipitation</p>
      </div>
    </div>
    <div class="flex items-center justify-between gap-6 mb-10">
      <!-- Wind direction -->
      <div class="text-center flex-1">
        <font-awesome icon="fa-solid fa-fan" size="2x" class="mb-1"/>
        <p class="text-xl font-bold">{{ place.current.wind_dir }}</p>
        <p>direction</p>
      </div>
      <!-- Feels like -->
      <div class="text-center flex-1">
        <font-awesome icon="fa-solid fa-temperature-half" size="2x" class="mb-1"/>
        <p class="text-xl font-bold">{{ Math.round(place.current.feelslike_f) }}</p>
        <p>Feels</p>
      </div>
      <!-- UV -->
      <div class="text-center flex-1">
        <font-awesome icon="fa-solid fa-sun" size="2x" class="mb-1"/>
        <p class="text-xl font-bold">{{ place.current.uv }}</p>
        <p>UV index</p>
      </div>
    </div>
    <!-- Last update -->
    <div class="flex justify-between items-center">
      <h3 class="text-slate-900/50">last update: {{ place.current.last_updated }}</h3>
    </div>
  </div>
</template>