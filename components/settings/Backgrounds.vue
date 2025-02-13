<script setup lang="ts">
import { useBackground } from '~/composables/useBackground'

const { backgrounds, updateBackground, selectedBackground } = useBackground()
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-sm text-surface-700 dark:text-surface-0 font-semibold leading-none mb-2">
      Background
    </span>
    <div class="grid grid-rows-2 gap-2 max-w-full">
      <button
        v-for="bg in backgrounds"
        :key="bg.name"
        type="button"
        class="relative h-20 rounded-lg overflow-hidden border-2 hover:border-surface-600 transition-colors"
        :class="[bg.url === selectedBackground.url ? 'border-primary' : 'border-surface-200']"
        @click="updateBackground(bg)"
      >
        <img :src="bg.url" :alt="bg.name" class="w-full h-full object-cover">
        <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
          {{ bg.name }}
        </div>
      </button>
    </div>
  </div>
</template>
