<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  forecastDay: {
    type: Object as PropType<ForecastDay>,
    required: true,
  },

})
</script>

<template>
  <div class="mb-2 flex items-center justify-between">
    <table class="w-full">
      <tbody>
        <tr>
          <!-- day of the week -->
          <td class="w-1/3">
            {{ new Date(forecastDay.date).toLocaleDateString('en-us', { weekday: 'long' }) }}
          </td>

          <!-- icon -->
          <td class="w-1/3">
            <img :src="forecastDay.day.condition.icon" alt="icon" width="30" class="mx-auto">
          </td>

          <!-- high/low temp -->
          <td class="w-1/3 text-right">
            {{ Math.round(forecastDay.day.maxtemp_f) }} / {{ Math.round(forecastDay.day.mintemp_f) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
