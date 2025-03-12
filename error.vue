<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    default: () => ({ statusCode: 500, message: 'An error occurred' }),
  },
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <Card class="w-fit max-w-2xl">
      <template #header>
        <div class="flex items-center gap-2">
          <font-awesome icon="fa-solid fa-triangle-exclamation" class="text-red-500 ml-4" />
          <h1 class="text-xl font-bold">
            Error {{ error.statusCode }}
          </h1>
        </div>
      </template>
      <template #content>
        <p class="text-lg font-medium mb-2">
          {{ error.message }}
        </p>
        <div v-if="error.statusCode === 503">
          <p>We're unable to connect to a required service.</p>
          <p class="text-sm text-gray-500">
            This might be a temporary issue. Please try again in a few moments.
          </p>
        </div>
        <div v-else>
          <p>Something unexpected happened.</p>
          <p class="text-sm text-gray-500">
            Our team has been notified and is working on a fix.
          </p>
        </div>
      </template>
      <template #footer>
        <Button color="primary" @click="handleError">
          Home
        </Button>
      </template>
    </Card>
  </div>
</template>
