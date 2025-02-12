<script setup lang="ts">
import type { PropType } from 'vue'
import MarkdownIt from 'markdown-it'
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
  activeTab: {
    type: String,
    default: () => 'queries',
  },
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true,
})

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['class', 'p-button-link'])
  tokens[idx].attrPush(['target', '_blank'])
  tokens[idx].attrPush(['rel', 'noopener noreferrer'])
  return self.renderToken(tokens, idx, options)
}

function renderSearchResult(result: SearchResult) {
  const markdown = `# [${result.title}](${result.url})\n\n ${result.description}`
  return md.render(markdown)
}

function renderSummary(summary: SearchSummary) {
  return md.render(summary.summary)
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<template>
  <Tabs :value="activeTab">
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
                  {{ capitalizeFirstLetter(query) }}
                </p>
              </template>
            </Card>
          </div>
        </div>
      </TabPanel>
      <TabPanel value="results">
        <div v-if="results.length > 0">
          <div v-for="(result, index) in results" :key="index">
            <div v-html="renderSearchResult(result)" />
            <Divider />
          </div>
        </div>
        <div v-else>
          No results
        </div>
      </TabPanel>
      <TabPanel value="summary">
        <div v-if="summary.summary.length">
          <div v-html="renderSummary(summary)" />
        </div>
        <div v-else>
          <p>No summary to show</p>
        </div>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
