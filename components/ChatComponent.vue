<template>
  <div class="chat-container flex flex-col h-screen max-w-2xl mx-auto p-4">
    <div class="messages flex-grow overflow-y-auto mb-4 p-4 border border-gray-300 rounded" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id">
        <div v-if="message.content.length > 0" :class="['mb-4 p-2 rounded', message.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100']">
          <strong>{{ message.role === 'user' ? 'You' : 'AI' }}:</strong>
          <div v-html="renderMessage(message.content)"></div>
        </div>
      </div>
    </div>
    <form @submit.prevent="handleSubmit" class="flex gap-2">
      <input
        v-model="input"
        placeholder="Type your message..."
        class="flex-grow p-2 border border-gray-300 rounded"
        :disabled="isLoading"
      />
      <button
        type="submit"
        :disabled="isLoading"
        class="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        Send
      </button>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChat } from '@ai-sdk/vue'
import { v4 as uuidv4 } from "uuid"

const sessionId = uuidv4()
const { messages, input, handleSubmit, isLoading, append, data } = useChat({
  api: '/api/travel',
  body: computed(() => ({
    sessionId: sessionId,
    messages: messages.value.length > 0 ? [messages.value[messages.value.length - 1]] : [],
  })),
  onResponse: (response) => {
    // You can handle any specific response processing here if needed
    console.log('Response received:', response)
    console.log('Response body:', response.body)
    console.log('Response headers:', response.headers)
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
  append({id: uuidv4(), content: '', role: 'system', data: JSON.stringify(initData)})
})

const messagesContainer = ref<HTMLDivElement | null>(null)

// Scroll to bottom when new messages are added
watch(messages, () => {
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 0)
})

watch(data, (newData) => {
 if (Array.isArray(newData)) {
  newData.forEach((item) => {
    console.log('item', item)
  })
 }

})

const renderMessage = (content: string): string => {
  // console.log('renderMessage', content)
  const result = content.replaceAll(`{"response":"`, '')
    .replace(/","goto":.*?}/g, '')
    .replaceAll(`\\n`, '<br/>')
  // console.log('result', result)
  return result
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
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