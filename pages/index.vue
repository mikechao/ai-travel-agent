<script setup lang="ts">

function test() {
  $fetch('/api/test')
}
</script>
<template>
  <p>This is the index page</p>
  <button @click="test">Test</button>
</template>