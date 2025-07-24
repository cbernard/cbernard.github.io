<script setup>
  import NumberFlow from '@number-flow/vue';
  import { ref } from 'vue';

  const props = defineProps({
    value: {
      type: Number,
      default: 0,
      required: true,
    },
    trend: {
      type: Number,
      default: 0,
    },
    format: {
      type: Object,
      default: () => ({ notation: 'standard' }),
    },
  });

  const digit = ref(props.value);

  const handleClick = () => {
    digit.value = digit.value + 100;
  };
</script>

<template>
  <NumberFlow :value="digit" :trend @click="handleClick" />
</template>
