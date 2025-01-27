<script setup lang="ts">
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Button from 'primevue/button'

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
    <div class="flex-1 p2">
      <div class="flex items-center mt-2">
        <img :src="hotel.rating_image_url">
      </div>
      <div class="items-center ml-2">
        <p>Based on <span class="font-medium"> {{ hotel.num_reviews }}</span> reviews</p>
        <p>{{ hotel.ranking_data.ranking_string }}</p>
        <p>Price {{ hotel.price_level }}</p>
        <Button as="a" label="Visit Web Site" :href="hotel.web_url" target="_blank" rel="noopener" size="small" />
        <Accordion value="0">
          <AccordionPanel value="1">
            <AccordionHeader>Additional Ratings</AccordionHeader>
            <AccordionContent>
              <div v-for="subrating of hotel.subratings" :key="subrating.name" class="flex items-center mt-2">
                <p class="mr-2">
                  {{ subrating.localized_name }}
                </p>
                <img :src="subrating.rating_image_url">
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
    </div>
  </div>
</template>
