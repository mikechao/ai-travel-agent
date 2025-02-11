<script setup lang="ts">
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
</script>

<template>
  <Tabs value="queries">
    <TabList>
      <Tab value="queries">
        Search Queries
      </Tab>
      <Tab value="results">
        Search Results
      </Tab>
      <Tab value="summary">
        Search Summary
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="queries">
        <p class="m-0">
          Search Queries go here
        </p>
      </TabPanel>
      <TabPanel value="results">
        <p class="m-0">
          Search results go here
        </p>
      </TabPanel>
      <TabPanel value="summary">
        <p class="m-0">
          Search summary go here
        </p>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
