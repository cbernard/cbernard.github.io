<script setup>
import { ref, computed } from "vue";

import Number from "../number/number.vue";

const props = defineProps({
  translate: {
    type: Boolean,
    default: false,
  },

  progress: {
    type: Number,
    default: 0,
    validator: (value) => {
      return value >= 0 && value <= 1;
    },
  },
});

const container = ref(null);
const number = ref(null);

const offset = computed(() => {
  const progress = Math.min(props.progress, 1);
  const split = progress > 0.5 ? 1 : 2;

  const value =
    progress * container.value?.clientHeight -
    number.value?.clientHeight / split;

  return value > 0 ? `${value}px` : 0;
});

const numberClasses = computed(() => {
  const common = "w-[3ch] h-[1.5em] text-center";

  return props.translate
    ? `${common} translate-y-(--offset) transition-translate duration-500 ease-in-out`
    : common;
});
</script>

<template>
  <div
    class="flex h-full w-[60px] items-center justify-center border-r border-r-black-16 py-2 dark:border-r-white-16"
    :class="[{ 'items-stretch': translate }]"
    :style="{ '--offset': offset }"
  >
    <div ref="container">
      <div ref="number" :class="numberClasses">
        <Number :value="progress * 100" />
      </div>
    </div>
  </div>
</template>
