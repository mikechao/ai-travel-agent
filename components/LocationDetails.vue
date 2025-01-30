<script setup lang="ts">
import Button from 'primevue/button'
import Popover from 'primevue/popover'

const props = defineProps<Props>()

const Galleria = defineAsyncComponent(() => import('primevue/galleria'))

export interface Props {
  hotel: LocationDetails
}
const { data } = await useFetch(`/api/location/photos?locationId=${props.hotel.location_id}`)

const imageUrls = [] as string[]

if (Array.isArray(data.value)) {
  for (const value of data.value) {
    imageUrls.push(value)
  }
}

const website = computed(() => (props.hotel.website) ? props.hotel.website : props.hotel.web_url)
const linksMarginTop = computed(() => (props.hotel.subratings && props.hotel.amenities) ? 'mt-1' : 'mt-auto')

const amen = ref()

function showAmen(event: UIEvent) {
  amen.value.toggle(event)
}

const subratingsPop = ref()
const subratings = (props.hotel.subratings) ? Object.values(props.hotel.subratings) : []

function showSubratings(event: UIEvent) {
  subratingsPop.value.toggle(event)
}

function getRankingString() {
  if (props.hotel.ranking_data) {
    return props.hotel.ranking_data.ranking_string
  }
  return 'No rankings'
}
</script>

<template>
  <div class="w-fit bg-primary-100 border border-primary-300 shadow-lg rounded-lg flex">
    <Galleria :value="imageUrls" :num-visible="1" :circular="true" container-style="width: 250px; height: 200px;" :show-item-navigators="true" :show-thumbnails="false">
      <template #item="slotProps">
        <img :src="slotProps.item" style="object-fit: cover; display: block;">
      </template>
    </Galleria>
    <div class="flex-1 p-2 flex flex-col">
      <div class="flex flex-row items-center mt-2">
        <img :src="hotel.rating_image_url">
        <p><span class="font-medium"> {{ hotel.num_reviews }}</span> reviews</p>
      </div>
      <div class="items-center ml-2">
        <p>{{ getRankingString() }}</p>
        <p>Price {{ hotel.price_level }}</p>
      </div>
      <div v-if="hotel.subratings && hotel.amenities" class="flex flex-row gap-1 mt-auto items-start justify-start">
        <Button type="button" label="Additional Ratings" size="small" rounded raised @click="showSubratings" />
        <Button type="button" label="Amenities" size="small" rounded raised @click="showAmen" />
        <Popover ref="amen">
          <div>
            <span class="font-medium block mb-2">Amenities</span>
            <div class="grid grid-cols-3 sm:grid-cols-3 gap-2">
              <div v-for="(amenity, index) in hotel.amenities" :key="index" class="p-2 bg-gray-100 rounded-lg">
                <p>{{ amenity }}</p>
              </div>
            </div>
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
        <Button as="a" label="More photos" :href="hotel.see_all_photos" target="_blank" rel="noopener" size="small" variant="link" />
      </div>
    </div>
  </div>
</template>
