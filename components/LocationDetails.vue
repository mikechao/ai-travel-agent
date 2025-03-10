<script setup lang="ts">
import Button from 'primevue/button'

const props = defineProps({
  location: {
    type: Object as PropType<LocationDetails>,
    required: true,
  },
})

const Galleria = defineAsyncComponent(() => import('primevue/galleria'))
const LocationReviews = defineAsyncComponent(() => import('./LocationReviews.vue'))
const LocationSubratings = defineAsyncComponent(() => import('./LocationSubratings.vue'))

const { data } = await useFetch(`/api/location/photos?locationId=${props.location.location_id}`)

const imageUrls = [] as string[]

if (Array.isArray(data.value)) {
  for (const value of data.value) {
    imageUrls.push(value)
  }
}

const website = computed(() => (props.location.website) ? props.location.website : props.location.web_url)
const linksMarginTop = computed(() => (props.location.subratings && props.location.amenities) ? 'mt-1' : 'mt-auto')

const displayAmenities = ref(false)

const subratings = (props.location.subratings) ? Object.values(props.location.subratings) : []
const displaySubratings = ref(false)

const reviews: Ref<Review[]> = ref([])
const isReviewsLoading = ref(false)
const displayReviews = ref(false)

function showReviews() {
  isReviewsLoading.value = true
  $fetch<{ data: Review[] } >(`/api/location/reviews?locationId=${props.location.location_id}`)
    .then((data) => {
      reviews.value = data.data
      isReviewsLoading.value = false
      displayReviews.value = true
    })
}

function getRankingString() {
  if (props.location.ranking_data) {
    return props.location.ranking_data.ranking_string
  }
  return 'No rankings'
}
</script>

<template>
  <div class="w-full bg-primary-100 border border-primary-300 shadow-lg rounded-lg flex">
    <Galleria
      :value="imageUrls"
      :num-visible="1"
      :circular="true"
      container-style="width: 250px;"
      :show-item-navigators="true"
      :show-thumbnails="false"
    >
      <template #item="slotProps">
        <div class="h-[200px] flex items-center justify-center">
          <img
            :src="slotProps.item"
            class="max-h-full w-full object-contain"
          >
        </div>
      </template>
    </Galleria>
    <div class="flex-1 p-2 flex flex-col text-neutral-700">
      <div class="flex flex-row items-center mt-2 ">
        <img :src="location.rating_image_url">
        <p><span class="font-medium"> {{ location.num_reviews }}</span> reviews</p>
      </div>
      <div class="items-center ml-2">
        <p>{{ getRankingString() }}</p>
        <p v-if="location.price_level">
          Price {{ location.price_level }}
        </p>
      </div>
      <div class="mt-1 mb-1">
        <Button
          type="button"
          label="Reviews"
          size="small"
          icon-pos="right"
          :loading="isReviewsLoading"
          @click="showReviews"
        >
          <template #icon>
            <font-awesome icon="fa-solid fa-comments" class="p-button-icon-right" />
          </template>
        </Button>
        <Dialog
          v-model:visible="displayReviews"
          :keep-in-view-port="true"
          :style="{ width: '50vw' }"
          :pt="{
            header: {
              class: 'px-3 py-1',
            },
            content: {
              class: 'pb-2',
            },
          }"
        >
          <template #header>
            <span class="p-dialog-title">
              <font-awesome icon="fa-solid fa-comments" class="mr-1" />Reviews
            </span>
          </template>
          <LocationReviews :reviews="reviews" />
        </Dialog>
      </div>
      <div v-if="location.subratings && location.amenities" class="flex flex-col gap-1 mt-auto items-start justify-start">
        <Button
          type="button"
          label="Additional Ratings"
          size="small"
          @click="displaySubratings = true"
        >
          <template #icon>
            <font-awesome icon="fa-solid fa-circle-info" class="p-button-icon-right" />
          </template>
        </Button>
        <Button
          type="button"
          label="Amenities"
          size="small"
          @click="displayAmenities = true"
        >
          <template #icon>
            <font-awesome icon="fa-solid fa-list" class="p-button-icon-right" />
          </template>
        </Button>
        <Dialog
          v-model:visible="displayAmenities"
          :keep-in-view-port="true"
          :pt="{
            header: {
              class: 'px-3 py-1',
            },
            content: {
              class: 'pb-2',
            },
          }"
        >
          <template #header>
            <span class="p-dialog-title">
              <font-awesome icon="fa-solid fa-list" class="mr-1" />Amenities
            </span>
          </template>
          <div>
            <ScrollPanel
              style="width: 100%; height: 200px"
              :pt="{
                barY: {
                  class: 'bg-primary',
                },
              }"
            >
              <div class="grid grid-cols-3 sm:grid-cols-3 gap-2">
                <div v-for="(amenity, index) in location.amenities" :key="index" class="p-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
                  <p>{{ amenity }}</p>
                </div>
              </div>
            </ScrollPanel>
          </div>
        </Dialog>
        <Dialog
          v-model:visible="displaySubratings"
          :keep-in-view-port="true"
          :pt="{
            header: {
              class: 'px-3 py-1',
            },
            content: {
              class: 'pb-2',
            },
          }"
        >
          <template #header>
            <span class="p-dialog-title">
              <font-awesome icon="fa-solid fa-circle-info" class="mr-1" />Additional Ratings
            </span>
          </template>
          <LocationSubratings :subratings="subratings" />
        </Dialog>
      </div>
      <div class="flex flex-row gap-1 items-start justify-start" :class="linksMarginTop">
        <Button
          as="a"
          label="Visit Web Site"
          :href="website"
          target="_blank"
          rel="noopener"
          size="small"
        />
        <Button
          as="a"
          label="More photos"
          :href="location.see_all_photos"
          target="_blank"
          rel="noopener"
          size="small"
        />
      </div>
    </div>
  </div>
</template>
