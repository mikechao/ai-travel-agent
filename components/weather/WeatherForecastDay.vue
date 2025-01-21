<script setup>
const props = defineProps({
  day: Object
})
const day = props.day
</script>

<template>
  <div class="mb-2 flex items-center justify-between">
    <table class="w-full">
      <tbody>
        <tr>
          <!-- day of the week -->
          <td class="w-1/3">
            {{ new Date(day.date).toLocaleDateString('en-us', { weekday: 'long' }) }}
          </td>

          <!-- icon -->
          <td class="w-1/3">
            <img :src="day.day.condition.icon" alt="icon" width="30" class="mx-auto" />
          </td>

          <!-- high/low temp -->
          <td class="w-1/3 text-right">
            {{ Math.round(day.day.maxtemp_f) }} / {{ Math.round(day.day.mintemp_f) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>