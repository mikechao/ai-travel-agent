<script setup lang="ts">
const social_media_navigation = [
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/mikechao23',
  },
  {
    label: 'GitHub',
    link: 'https://github.com/mikechao',
  },
]
</script>

<template>
  <footer
    class="bg-dark-50 dark:bg-dark-950 relative flex h-auto w-full flex-col overflow-hidden px-4 py-4"
  >
    <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div class="text-primary-50 dark:text-primary-50/50 text-xs order-2 sm:order-1">
        ©Mike Chao 2025.
      </div>

      <div class="flex items-center gap-4 order-1 sm:order-2">
        <template v-for="(nav, index) in social_media_navigation" :key="index">
          <NuxtLink
            :to="nav.link"
            target="_blank"
            class="text-primary-50 dark:text-primary-50/50 hover:text-dark-950 dark:hover:text-dark-50 text-xs"
          >
            {{ nav.label }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </footer>
</template>
