<!-- eslint-disable no-console -->
<script setup lang="ts">
import { type Message, useChat } from '@ai-sdk/vue'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Panel from 'primevue/panel'
import { v4 as uuidv4 } from 'uuid'
import { useDataItemStore } from '~/stores/dataItemStore'

const dataItemStore = useDataItemStore()
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
    // of data so we can't really modifiy it
    // as it is part of ai-sdk/vue
    // this is guarded against in the dataItemStore
    const lastData = newData[newData.length - 1] as unknown as DataItem
    dataItemStore.add(lastData)
  }
})

function renderMessage(message: Message): string {
  const result = message.content.replaceAll(`{"response":"`, '')
    .replace(/","goto":.*?\}/g, '')
    .replaceAll(`\\n`, '<br/>')
  return result
}

function formSubmit(_event: FormSubmitEvent) {
  handleSubmit()
}
</script>

<template>
  <Panel class="w-full h-screen">
    <template #header>
      <div class="flex items-center gap-2">
        <Avatar image="./chatAvatar.webp" shape="circle" />
        <span class="font-bold">AI Travel Agent Chat</span>
      </div>
    </template>
    <div class="chat-container flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div ref="messagesContainer" class="messages flex-grow overflow-y-auto mb-4 p-4 border border-gray-300 rounded">
        <div v-for="message in messages" :key="message.id">
          <div v-if="message.content.length > 0" class="mb-4 p-2 rounded" :class="[message.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100']">
            <strong>{{ message.role === 'user' ? 'You' : 'AI' }}:</strong>
            <div v-html="renderMessage(message)" />
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
    </div>
  </Panel>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 80vh;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.messages {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.message {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  background-color: #007bff;
  color: white;
}

.message.assistant {
  align-self: flex-start;
  background-color: #f1f1f1;
  color: black;
}

.input-form {
  display: flex;
  gap: 0.5rem;
}

input {
  flex-grow: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
