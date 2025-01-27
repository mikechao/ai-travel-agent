<script setup lang="ts">
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Button from 'primevue/button'
import Popover from 'primevue/popover'

export interface Props {
  hotel: Hotel
}
const props = defineProps<Props>()

const subratings = Object.values(props.hotel.subratings)

const amen = ref()

const showAmen = (event) => {
  amen.value.toggle(event)
}
</script>

<template>
  <div class="w-[600px] bg-white shadow-md rounded-lg flex">
    <div class="w-[250px] h-[200px]">
      <img src="https://tools-api.webcrumbs.org/image-placeholder/250/200/city/1" alt="NYC Skyline" class="w-[250px] h-[200px] object-cover rounded-l-lg">
    </div>
    <div class="flex-1 p2">
      <div class="flex items-center mt-2">
        <img :src="hotel.rating_image_url">
      </div>
      <div class="items-center ml-2">
        <p>Based on <span class="font-medium"> {{ hotel.num_reviews }}</span> reviews</p>
        <p>{{ hotel.ranking_data.ranking_string }}</p>
        <p>Price {{ hotel.price_level }}</p>
        <Button as="a" label="Visit Web Site" :href="hotel.web_url" target="_blank" rel="noopener" size="small" />
        <Button type="button" label="Amenities" @click="showAmen" size="small"/>
        <Accordion value="0">
          <AccordionPanel value="1">
            <AccordionHeader>Additional Ratings</AccordionHeader>
            <AccordionContent>
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
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
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
      </div>
    </div>
  </div>
</template>
