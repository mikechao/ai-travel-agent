<script setup lang="ts">
import Carousel from 'primevue/carousel'

const props = defineProps({
  locationId: {
    type: String,
    requiried: true,
  },
})

const reviews: Ref<Review[]> = ref([])

onMounted(async () => {
  const data = await $fetch(`/api/location/reviews?locationId=${props.locationId}`)
  reviews.value = data as Review[]
})
</script>

<template>
  <Carousel :value="reviews" :num-visible="1" :num-scroll="1">
    <template #item="slotProps">
      <Card>
        <template #header>
          <img alt="ratings" :src="slotProps.data.rating_image_url">
        </template>
        <template #title>
          <span>{{ slotProps.data.title }}</span>
        </template>
        <template #content>
          <p>
            {{ slotProps.data.text }}
          </p>
        </template>
      </Card>
    </template>
  </Carousel>
</template>
