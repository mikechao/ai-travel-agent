<script setup lang="ts">
import Carousel from 'primevue/carousel'

defineProps({
  reviews: {
    type: Array as PropType<Review[]>,
    required: true,
  },
})

function daysAgo(date: string) {
  const today = new Date()
  const givenDate = new Date(date)

  // Calculate the time difference in milliseconds
  const timeDiff = today.getTime() - givenDate.getTime()

  // Convert milliseconds to days
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

  return daysDiff
}
</script>

<template>
  <Carousel
    :value="reviews"
    :num-visible="1"
    :num-scroll="1"
  >
    <template #item="slotProps">
      <Card class="bg-surface-100 border border-surface-400 rounded-lg shadow-lg max-h-60 overflow-hidden">
        <template #title>
          <span class="font-semibold">{{ slotProps.data.title }}</span>
        </template>
        <template #subtitle>
          <div class="flex flex-col items-start gap-2">
            <div class="flex flex-row items-center">
              <img alt="ratings" :src="slotProps.data.rating_image_url">
              <span>Reviewed {{ daysAgo(slotProps.data.published_date) }} days ago</span>
            </div>
          </div>
        </template>
        <template #content>
          <ScrollPanel
            class="w-full h-28"
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
        <template #footer>
          <Button
            as="a"
            label="Read review"
            :href="slotProps.data.url"
            target="_blank"
            rel="noopener"
            size="small"
            variant="link"
          />
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
