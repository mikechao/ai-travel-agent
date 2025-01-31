<script setup lang="ts">
import Carousel from 'primevue/carousel'

defineProps({
  reviews: {
    type: Array as PropType<Review[]>,
    required: true,
  },
})
</script>

<template>
  <Carousel
    :value="reviews"
    :num-visible="1"
    :num-scroll="1"
  >
    <template #item="slotProps">
      <Card class="bg-surface-100 border border-surface-400 rounded-lg shadow-lg">
        <template #title>
          <span>{{ slotProps.data.title }}</span>
        </template>
        <template #subtitle>
          <img alt="ratings" :src="slotProps.data.rating_image_url">
        </template>
        <template #content>
          <ScrollPanel
            class="w-full h-32"
            :pt="{
              barY: {
                class: 'bg-primary',
              },
            }"
          >
            <p>
              {{ slotProps.data.text }}
            </p>
          </ScrollPanel>
        </template>
      </Card>
    </template>
  </Carousel>
</template>

<style scoped>
/* Ensure the content fits within the Popover */
.p-scrollpanel {
  max-height: 200px;
}
</style>
