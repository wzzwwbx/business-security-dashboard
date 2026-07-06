<template>
  <span
    class="base-skeleton"
    :class="{
      rounded,
      circle
    }"
    :style="{
      width: normalizedWidth,
      height: normalizedHeight
    }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  circle?: boolean;
}>(), {
  width: '100%',
  height: 16,
  rounded: true,
  circle: false
});

const normalize = (value: string | number) => (typeof value === 'number' ? `${value}px` : value);
const normalizedWidth = computed(() => normalize(props.width));
const normalizedHeight = computed(() => normalize(props.height));
</script>

<style scoped>
.base-skeleton {
  display: inline-block;
  background: linear-gradient(
    90deg,
    var(--sys-color-skeleton-base) 0%,
    var(--sys-color-skeleton-highlight) 50%,
    var(--sys-color-skeleton-base) 100%
  );
  background-size: 220% 100%;
  animation: skeleton-shimmer 1.4s infinite linear;
  border-radius: var(--radius-md);
}

.base-skeleton.rounded {
  border-radius: var(--radius-md);
}

.base-skeleton.circle {
  border-radius: 50%;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-skeleton {
    animation: none;
    background-position: 50% 0;
  }
}
</style>
