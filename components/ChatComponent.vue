<!-- eslint-disable no-console -->
<script setup lang="ts">
import { type Message, useChat } from '@ai-sdk/vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Panel from 'primevue/panel'
import { v4 as uuidv4 } from 'uuid'
import { useMarkdownIt } from '~/composables/useMarkdownIt'
import { useDataItemStore } from '~/stores/dataItemStore'
import { AgentToEmoji } from '~/types/constants'

const dataItemStore = useDataItemStore()
const activeAgentStore = useActiveAgentStore()
const { activeAgent } = storeToRefs(activeAgentStore)
const emojiToUse = computed(() => AgentToEmoji[activeAgent.value])

const sessionId = uuidv4()
const isLoading = ref(false)
const { messages, input, handleSubmit, append, data } = useChat({
  api: '/api/travel',
  body: computed(() => ({
    sessionId,
    messages: messages.value.length > 0 ? [messages.value[messages.value.length - 1]] : [],
  })),
  onResponse: (response) => {
    // You can handle any specific response processing here if needed
    console.log('Response received:', response)
  },
  onFinish: (message) => {
    console.log('Chat finished:', message)
    isLoading.value = false
  },
  onError: (error) => {
    console.error('error', error)
  },

})

onMounted(() => {
  // use append with empty content to trigger api endpoint call
  const initData = { init: true }
  append({ id: uuidv4(), content: '', role: 'system', data: JSON.stringify(initData) })

  window.addEventListener('show-full-image', ((event: CustomEvent) => {
    const { url, title } = event.detail
    showFullImage(url, title)
  }) as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('show-full-image', ((event: CustomEvent) => {
    const { url, title } = event.detail
    showFullImage(url, title)
  }) as EventListener)
})

const messagesContainer = ref<HTMLDivElement | null>(null)

// Scroll to bottom when new messages are added
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

watch(data, (newData) => {
  if (newData && newData.length) {
    // this gets invoked a lot and it is a stream
    // of data so we can't really modify it
    // as it is part of ai-sdk/vue
    // this is guarded against in the dataItemStore
    const lastData = newData[newData.length - 1] as unknown as DataItem
    dataItemStore.add(lastData)
  }
})

const md = await useMarkdownIt()

function renderMessage(message: Message): string {
  return md.render(message.content)
}

const showImageDialog = ref(false)
const selectedImage = ref<{ url: string, title: string } | null>(null)

function showFullImage(url: string, title: string) {
  selectedImage.value = { url, title }
  showImageDialog.value = true
}

function sendMessage() {
  isLoading.value = true
  handleSubmit()
}
</script>

<template>
  <Panel
    class="w-full h-full flex flex-col shadow-lg border border-gray-500"
    :pt="{
      root: { class: 'h-full' },
      header: { class: 'p-2' },
      content: { class: 'flex-1 pb-1' },
    }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <span class="text-2xl">{{ emojiToUse }}</span>
        <span class="font-bold text-xl">AI Travel Agent Chat</span>
      </div>
    </template>
    <template #default>
      <div class="chat-container flex flex-col w-full mx-auto rounded-lg">
        <div ref="messagesContainer" class="messages flex-grow overflow-y-auto mb-0 px-2 border-2 border-gray-200 rounded-lg scrollbar-thumb-rounded-full scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-primary-200">
          <div v-for="message in messages" :key="message.id">
            <div
              v-if="message.content.length > 0"
              class="mb-0 px-2 rounded-lg shadow-lg text-surface-700 dark:text-surface-0 "
              :class="[message.role === 'user' ? 'bg-primary-100 dark:bg-primary-900' : 'bg-surface-100 dark:bg-surface-900']"
            >
              <strong>{{ message.role === 'user' ? `You` : 'AI' }}</strong>
              <div v-html="renderMessage(message)" />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex gap-2">
        <InputText
          v-model="input"
          type="text"
          placeholder="Type your message..."
          variant="filled"
          :disabled="isLoading"
          class="flex-1 shadow-lg rounded-full"
          @keyup.enter="sendMessage"
        />
        <Button
          type="submit"
          label="Send"
          icon-pos="right"
          :loading="isLoading"
          @click="sendMessage"
        >
          <template #icon>
            <font-awesome icon="fa-regular fa-paper-plane" class="p-button-icon-right" />
          </template>
        </Button>
      </div>
    </template>
  </Panel>
  <Dialog
    v-model:visible="showImageDialog"
    modal
    :style="{ width: '90vw', maxWidth: '1200px' }"
  >
    <template v-if="selectedImage" #header>
      <h3 class="text-xl font-semibold m-0">
        {{ selectedImage.title }}
      </h3>
    </template>
    <template #default>
      <div v-if="selectedImage" class="relative max-h-[80vh] flex items-center justify-center">
        <img
          :src="selectedImage.url"
          :alt="selectedImage.title"
          class="w-auto h-auto max-w-full max-h-[80vh] object-contain"
        >
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.p-panel {
  background: transparent;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 80vh;
  margin: 0 auto;
}

.messages {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

:deep(.image-gallery) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

:deep(.image-container) {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: transform 0.3s ease;
  cursor: pointer;
}

:deep(.image-container:hover) {
  transform: scale(1.05);
}

:deep(.image-container img) {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

:deep(.image-caption) {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.5rem;
  font-size: 0.875rem;
}
</style>
