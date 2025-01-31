<script setup lang="ts">
defineProps({
  subratings: {
    type: Array as PropType<Subrating[]>,
    required: true,
  },
})
</script>

<template>
  <DataTable :value="subratings" class="w-auto">
    <Column field="localized_name" header="Name" />
    <Column header="Rating">
      <template #body="slotProps">
        <img
          :src="slotProps.data.rating_image_url"
        >
      </template>
    </Column>
  </DataTable>
</template>
