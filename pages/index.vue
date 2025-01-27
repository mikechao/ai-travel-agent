<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

const json = `[{"location_id":"617187","name":"Best Western Danville Sycamore Inn","distance":"0.894566366267708","bearing":"southeast","address_obj":{"street1":"803 Camino Ramon","street2":"","city":"Danville","state":"California","country":"United States","postalcode":"94526","address_string":"803 Camino Ramon, Danville, CA 94526"}},{"location_id":"235451","name":"Extended Stay America - San Ramon - Bishop Ranch - East","distance":"3.2039439427959677","bearing":"southeast","address_obj":{"street1":"2100 Camino Ramon","street2":"","city":"San Ramon","state":"California","country":"United States","postalcode":"94583-1362","address_string":"2100 Camino Ramon, San Ramon, CA 94583-1362"}},{"location_id":"250131","name":"HYATT house San Ramon","distance":"3.233720267744259","bearing":"south","address_obj":{"street1":"2323 San Ramon Valley Blvd","street2":"","city":"San Ramon","state":"California","country":"United States","postalcode":"94583-1607","address_string":"2323 San Ramon Valley Blvd, San Ramon, CA 94583-1607"}},{"location_id":"1147338","name":"National at Pinnacle Crow Canyo","distance":"3.22589942308101","bearing":"south","address_obj":{"street1":"1700 Promontory Ter","street2":"","city":"San Ramon","state":"California","country":"United States","postalcode":"94583-1580","address_string":"1700 Promontory Ter, San Ramon, CA 94583-1580"}},{"location_id":"20144998","name":"San Ramon Valley Monthly Vacation Home","distance":"4.434286347565809","bearing":"southeast","address_obj":{"street1":"50 Crestridge Ct","city":"Danville","state":"California","country":"United States","postalcode":"94506-1107","address_string":"50 Crestridge Ct, Danville, CA 94506-1107"}},{"location_id":"81779","name":"San Ramon Marriott","distance":"4.473933962159359","bearing":"southeast","address_obj":{"street1":"2600 Bishop Dr","street2":"","city":"San Ramon","state":"California","country":"United States","postalcode":"94583-2338","address_string":"2600 Bishop Dr, San Ramon, CA 94583-2338"}},{"location_id":"217300","name":"Extended Stay America - San Ramon - Bishop Ranch - West","distance":"4.535170248336561","bearing":"southeast","address_obj":{"street1":"18000 San Ramon Valley Blvd","street2":"","city":"San Ramon","state":"California","country":"United States","postalcode":"94583-4401","address_string":"18000 San Ramon Valley Blvd, San Ramon, CA 94583-4401"}},{"location_id":"80082","name":"Sonesta Select San Ramon","distance":"4.799962867495464","bearing":"southeast","address_obj":{"street1":"18090 San Ramon Valley Blvd.","street2":"","city":"San Ramon","state":"California","country":"United States","postalcode":"94583","address_string":"18090 San Ramon Valley Blvd., San Ramon, CA 94583"}},{"location_id":"17656548","name":"Global Luxury Suites In San Ramon","distance":"4.13654646900972","bearing":"southeast","address_obj":{"street1":"125 Shoreline Cir","city":"San Ramon","state":"California","country":"United States","postalcode":"94582-4648","address_string":"125 Shoreline Cir, San Ramon, CA 94582-4648"}},{"location_id":"80077","name":"Residence Inn San Ramon","distance":"4.770957813749616","bearing":"southeast","address_obj":{"street1":"1071 Market Place","street2":"","city":"San Ramon","state":"California","country":"United States","postalcode":"94583","address_string":"1071 Market Place, San Ramon, CA 94583"}}]`

const testLocations: Location[] = JSON.parse(json)
</script>

<template>
  <HotelSearchResult class="flex items-center justify-center" :locations="testLocations" />
  <!-- <Splitter style="height: max-content;">
    <SplitterPanel class="flex items-center justify-center" :size="50">
      <ResultsPanel class="h-max" />
    </SplitterPanel>
    <SplitterPanel class="flex items-center justify-center" :size="50">
      <ChatComponent class="h-max" />
    </SplitterPanel>
  </Splitter> -->
</template>
