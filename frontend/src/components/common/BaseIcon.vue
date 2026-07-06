<template>
  <svg
    class="base-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      v-for="(path, index) in iconPaths"
      :key="`${name}-${index}`"
      :d="path"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: 'overview' | 'terminal' | 'business' | 'security' | 'ops' | 'empty' | 'refresh';
}>();

const pathMap: Record<string, string[]> = {
  overview: [
    'M3 13.5L12 4l9 9.5',
    'M5 12.5V20h14v-7.5',
    'M9 20v-5h6v5'
  ],
  terminal: [
    'M4 6.5h16v9H4z',
    'M9 19.5h6',
    'M12 15.5v4',
    'M7 9.5h5',
    'M14.5 9.5l1.5 1.5 2.5-2.5'
  ],
  business: [
    'M4 7h16v10H4z',
    'M4 8l8 5 8-5',
    'M8 17l2.5-3',
    'M16 17l-2.5-3'
  ],
  security: [
    'M12 3l7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3z',
    'M9.5 12l1.8 1.8 3.2-3.6'
  ],
  ops: [
    'M12 3v3',
    'M12 18v3',
    'M4.8 7.2l2.1 2.1',
    'M17.1 14.9l2.1 2.1',
    'M3 12h3',
    'M18 12h3',
    'M4.8 16.8l2.1-2.1',
    'M17.1 9.1l2.1-2.1',
    'M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7z'
  ],
  empty: [
    'M5 5h14v14H5z',
    'M8.5 9.5h7',
    'M8.5 13h4'
  ],
  refresh: [
    'M20 11a8 8 0 1 0 2 5.3',
    'M20 4v5h-5'
  ]
};

const iconPaths = computed(() => pathMap[props.name] ?? pathMap.empty);
</script>

<style scoped>
.base-icon {
  width: 1em;
  height: 1em;
  display: block;
}
</style>
