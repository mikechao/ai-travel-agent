<script setup lang="ts">
import type { PropType } from 'vue'
import Card from 'primevue/card'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'

defineProps({
  queries: {
    type: Object as PropType<SearchQueries>,
    default: () => {
      return { queries: [] }
    },
  },
  results: {
    type: Array as PropType<SearchResult[]>,
    default: () => [],
  },
  summary: {
    type: Object as PropType<SearchSummary>,
    default: () => {
      return { summary: '' }
    },
  },
})
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
        <div class="mx-auto px-2 py-2">
          <div class="grid grid-cols-1">
            <!-- Loop through each query -->
            <Card
              v-for="(query, index) in queries.queries"
              :key="index"
              class="p-1 mb-2 shadow-md rounded-lg border-2 hover:shadow-xl transition-colors duration-300"
              style="border-color: var(--p-primary)"
            >
              <template #content>
                <p class="text-surface-700 dark:text-surface-0">
                  {{ query }}
                </p>
              </template>
            </Card>
          </div>
        </div>
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
