<script setup lang="ts">
import Button from 'primevue/button'
import Popover from 'primevue/popover'

interface Props {
  location: LocationDetails
}

const props = defineProps<Props>()

const Galleria = defineAsyncComponent(() => import('primevue/galleria'))
const LocationReviews = defineAsyncComponent(() => import('./LocationReviews.vue'))

const { data } = await useFetch(`/api/location/photos?locationId=${props.location.location_id}`)

const imageUrls = [] as string[]

if (Array.isArray(data.value)) {
  for (const value of data.value) {
    imageUrls.push(value)
  }
}

const website = computed(() => (props.location.website) ? props.location.website : props.location.web_url)
const linksMarginTop = computed(() => (props.location.subratings && props.location.amenities) ? 'mt-1' : 'mt-auto')

const amen = ref()

function showAmen(event: UIEvent) {
  amen.value.toggle(event)
}

const subratingsPop = ref()
const subratings = (props.location.subratings) ? Object.values(props.location.subratings) : []

function showSubratings(event: UIEvent) {
  subratingsPop.value.toggle(event)
}

const reviews: Ref<Review[]> = ref([])
const isReviewsLoading = ref(false)
const reviewsButton = ref()
const displayReviews = ref(false)

function showReviews(_event: UIEvent) {
  isReviewsLoading.value = true
  // can't seem to use an async function and await the results of the fetch
  // it causes   event.currentTarget to become null which is need for the
  // toggle method
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
    <div class="flex-1 p-2 flex flex-col">
      <div class="flex flex-row items-center mt-2">
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
          ref="reviewsButton"
          type="button"
          label="Reviews"
          size="small"
          rounded
          raised
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
          header="Reviews"
        >
          <LocationReviews :reviews="reviews" />
        </Dialog>
      </div>
      <div v-if="location.subratings && location.amenities" class="flex flex-col gap-1 mt-auto items-start justify-start">
        <Button
          type="button"
          label="Additional Ratings"
          size="small"
          rounded
          raised
          @click="showSubratings"
        >
          <template #icon>
            <font-awesome icon="fa-solid fa-circle-info" class="p-button-icon-right" />
          </template>
        </Button>
        <Button
          type="button"
          label="Amenities"
          size="small"
          rounded
          raised
          @click="showAmen"
        >
          <template #icon>
            <font-awesome icon="fa-solid fa-list" class="p-button-icon-right" />
          </template>
        </Button>
        <Popover ref="amen">
          <div>
            <span class="font-medium block mb-2">Amenities</span>
            <ScrollPanel
              style="width: 100%; height: 200px"
              :pt="{
                barY: {
                  class: 'bg-primary',
                },
              }"
            >
              <div class="grid grid-cols-3 sm:grid-cols-3 gap-2">
                <div v-for="(amenity, index) in location.amenities" :key="index" class="p-2 bg-gray-100 rounded-lg">
                  <p>{{ amenity }}</p>
                </div>
              </div>
            </ScrollPanel>
          </div>
        </Popover>
        <Popover ref="subratingsPop">
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
        </Popover>
      </div>
      <div class="flex flex-row gap-1 items-start justify-start" :class="linksMarginTop">
        <Button as="a" label="Visit Web Site" :href="website" target="_blank" rel="noopener" size="small" variant="link" />
        <Button as="a" label="More photos" :href="location.see_all_photos" target="_blank" rel="noopener" size="small" variant="link" />
      </div>
    </div>
  </div>
</template>
