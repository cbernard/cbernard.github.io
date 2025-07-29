<script setup>
import { ref, onMounted } from "vue";

import Progress from "../progress/progress.vue";

const loading = ref(0);

onMounted(() => {
  setTimeout(() => (loading.value = 0.4), 500);
  setTimeout(() => (loading.value = 0.7), 1500);
  setTimeout(() => (loading.value = 1), 2500);
});
</script>

<template>
  <div class="flex gap-12 bg-black text-white-32">
    <Progress :progress="loading" :translate="true" />

    <div class="flex items-center gap-x-4">
      <span class="text-white">Charly Bernard</span>
      <span>Front-end Developer</span>
    </div>
  </div>
</template>
