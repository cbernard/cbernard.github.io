<script setup>
import NumberFlow from "@number-flow/vue";
import { ref } from "vue";

const props = defineProps({
  value: {
    type: Number,
    required: true,
  },

  trend: {
    type: Number,
    default: 0,
  },

  format: {
    type: Object,
    default: () => ({ notation: "standard" }),
  },
});
</script>

<template>
  <NumberFlow :value="value" :trend="trend" :format="format" />
</template>
