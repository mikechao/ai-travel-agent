<template>
  <div class="chat-container">
    <div class="messages" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id" :class="['message', message.role]" class="whitespace-pre-line">
        {{ message.content }}
      </div>
    </div>
    <form @submit.prevent="handleSubmit" class="input-form">
      <input
        v-model="input"
        type="text"
        placeholder="Type a message..."
        :disabled="isLoading"
      />
      <button type="submit" :disabled="isLoading">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChat } from '@ai-sdk/vue'
import { v4 as uuidv4 } from "uuid"

const sessionId = uuidv4()
const { messages, input, handleSubmit, isLoading, append } = useChat({
  api: '/api/weather',
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
  }
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