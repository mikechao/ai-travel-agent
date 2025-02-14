<script setup>
import { ref } from 'vue'
import BorderLine from './BorderLine.vue'
import WeatherForecastDay from './WeatherForecastDay.vue'
import WeatherInfo from './WeatherInfo.vue'

const props = defineProps({
  place: {
    type: Object,
    required: true,
  },
})
const showDetail = ref(false)
const place = props.place

function getTime(localtime) {
  return new Date(localtime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false })
}
</script>

<template>
  <div
    :class="place.current.is_day === 1 ? 'bg-day' : 'bg-night'"
    class="text-white p-6 rounded-lg shadow-lg gap-4 mb-0 relative overflow-hidden"
  >
    <!-- Location & time -->
    <div class="mb-2 flex justify-between items-center">
      <div class="flex items-center justify-center gap-2">
        <font-awesome icon="fa-solid fa-location-dot" />
        <h1 class="text-xl">
          {{ place.location.name }}
        </h1>
      </div>
      <div class="flex items-center justify-center gap-2">
        <font-awesome icon="fa-solid fa-clock" />
        <h1 class="text-xl">
          {{ getTime(place.location.localtime) }}
        </h1>
      </div>
    </div>

    <!-- current weather -->
    <div class="text-center flex-1">
      <img :src="place.current.condition.icon" alt="icon" width="175" class="mx-auto">
      <h1 class="text-6xl mb-2 -mr-4">
        {{ Math.round(place.current.temp_f) }}&deg;
      </h1>
      <p class="text-xl">
        {{ place.current.condition.text }}
      </p>
    </div>

    <BorderLine />

    <!-- forecast -->
    <div v-for="(day, idx) in place.forecast.forecastday" :key="idx">
      <WeatherForecastDay :day="day" />
    </div>

    <!-- info -->
    <Transition name="fade">
      <div v-show="showDetail">
        <WeatherInfo
          :place="place"
          @close-info="showDetail = false"
        />
      </div>
    </Transition>

    <!-- forecast btn -->
    <div class="flex justify-end items-center gap-1 mt-10">
      <button @click="showDetail = true">
        More <font-awesome icon="fa-solid fa-arrow-right" class="text-sm -mb-px" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.bg-day {
  background-color: #8ec5fc;
  background-image: linear-gradient(62deg, #8ec5fc 0%, #e0c3fc 100%);
}
.bg-night {
  background-color: #07223d;
  background-image: linear-gradient(62deg, #0a2a4a 0%, #270845 100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
