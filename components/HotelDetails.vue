<script setup lang="ts">
export interface Props {
  hotel: Hotel
}
defineProps<Props>()
</script>

<template>
  <div class="w-[700px] bg-white shadow-md rounded-lg flex">
    <div class="w-[250px] h-[200px]">
      <img src="https://tools-api.webcrumbs.org/image-placeholder/250/200/city/1" alt="NYC Skyline" class="w-[250px] h-[200px] object-cover rounded-l-lg">
    </div>
  </div>
</template>
