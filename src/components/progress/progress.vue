<script setup>
import { ref, computed } from "vue";

import Number from "../number/number.vue";

const props = defineProps({
  translate: {
    type: Boolean,
    default: true,
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

  console.log(value);

  return value > 0 ? `${value}px` : 0;
});
</script>

<template>
  <div
    class="flex h-full"
    :class="[{ 'items-stretch': translate }]"
    :style="{ '--offset': offset }"
  >
    <div ref="container">
      <div
        ref="number"
        :class="[
          {
            'transition-translate translate-y-(--offset) duration-500 ease-in-out':
              translate,
          },
        ]"
      >
        <Number
          :value="progress * 100"
          :format="{ minimumIntegerDigits: 2, useGrouping: false }"
        />
      </div>
    </div>
  </div>
</template>
