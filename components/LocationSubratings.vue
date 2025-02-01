<script setup lang="ts">
defineProps({
  subratings: {
    type: Array as PropType<Subrating[]>,
    required: true,
  },
})
</script>

<template>
  <table class="w-fit divide-y divide-gray-200 bg-surface-0 dark:bg-surface-900 text-surface-700 dark:text-surface-0">
    <thead class="">
      <tr>
        <th class="px-4 pb-3 text-left font-medium uppercase tracking-wider">
          Name
        </th>
        <th class="px-4 pb-3 text-left font-medium uppercase tracking-wider">
          Rating
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      <tr v-for="rating in subratings" :key="rating.name">
        <td class="px-4 py-3 whitespace-nowrap ">
          {{ rating.localized_name }}
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <img :src="rating.rating_image_url" :alt="rating.localized_name">
        </td>
      </tr>
    </tbody>
  </table>
</template>
