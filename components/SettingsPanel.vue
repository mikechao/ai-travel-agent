<script setup lang="ts">
import { ref } from 'vue'

const colorMode = useColorMode()

const options = ref([
  { icon: 'fa-regular fa-moon', text: 'Dark' },
  { icon: 'fa-regular fa-sun', text: 'Light' },
])

// Initialize the selected mode using the current colorMode,
// falling back to the first option if needed.
const selectedMode = ref(
  options.value.find(opt => opt.text.toLowerCase() === colorMode.value) || options.value[0],
)

// When the user selects a different option, update colorMode accordingly.
function onUpdate(newValue) {
  // newValue might be null if the user attempts to deselect.
  // In that case, we do nothing.
  if (newValue) {
    selectedMode.value = newValue
    colorMode.preference = newValue.text.toLowerCase()
  }
}

// Intercept clicks on an option. If the option clicked is already selected,
// stop propagation so that the SelectButton's own handler doesn’t clear the value.
function handleOptionClick(event: Event, option) {
  if (option.text.toLowerCase() === colorMode.value) {
    event.stopPropagation()
    event.preventDefault()
  }
}

watchEffect(() => {
  if (colorMode.value === 'dark') {
    document.documentElement.classList.add('p-dark')
  }
  else {
    document.documentElement.classList.remove('p-dark')
  }
})
</script>

<template>
  <div class="flex justify-center">
    <!-- We use the update:model-value event so that we control updates manually -->
    <SelectButton
      v-model="selectedMode"
      :options="options"
      option-label="text"
      :multiple="false"
      @update:model-value="onUpdate"
    >
      <!-- Use a custom slot template to intercept clicks -->
      <template #option="slotProps">
        <div @click="handleOptionClick($event, slotProps.option)">
          <span>{{ slotProps.option.text }}</span>
          <font-awesome :icon="slotProps.option.icon" class="ml-2" />
        </div>
      </template>
    </SelectButton>
  </div>
</template>
