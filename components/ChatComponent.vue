<!-- eslint-disable no-console -->
<script setup lang="ts">
import { type Message, useChat } from '@ai-sdk/vue'
import { Form, type FormSubmitEvent } from '@primevue/forms'
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
const { messages, input, handleSubmit, isLoading, append, data } = useChat({
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

const md = useMarkdownIt()

function renderMessage(message: Message): string {
  return md.render(message.content)
}

function formSubmit(_event: FormSubmitEvent) {
  handleSubmit()
}
</script>

<template>
  <Panel
    class="w-full h-full flex flex-col shadow-lg border border-gray-500"
    :pt="{
      root: { class: 'h-full' },
      header: { class: 'p-2 shadow-lg' },
      content: { class: 'flex-1' },
    }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <span class="text-2xl">{{ emojiToUse }}</span>
        <span class="font-bold text-xl">AI Travel Agent Chat</span>
      </div>
    </template>
    <template #default>
      <div class="chat-container flex flex-col w-full mx-auto">
        <div ref="messagesContainer" class="messages flex-grow overflow-y-auto mb-0 px-2 border-2 border-gray-200">
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
      <Form class="flex gap-2" @submit="formSubmit">
        <InputText
          v-model="input"
          type="text"
          placeholder="Type your message..."
          variant="filled"
          :disabled="isLoading"
          class="flex-1 shadow-lg rounded-full"
        />
        <Button
          type="submit"
          label="Send"
          icon-pos="right"
          :loading="isLoading"
          raised
          rounded
        >
          <template #icon>
            <font-awesome icon="fa-regular fa-paper-plane" class="p-button-icon-right" />
          </template>
        </Button>
      </Form>
    </template>
  </Panel>
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
  border-radius: 4px;
  margin-bottom: 1rem;
}
</style>
