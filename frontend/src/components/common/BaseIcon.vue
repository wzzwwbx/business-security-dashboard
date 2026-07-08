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

export type BaseIconName =
  | 'overview'
  | 'terminal'
  | 'business'
  | 'security'
  | 'ops'
  | 'system'
  | 'user'
  | 'logout'
  | 'empty'
  | 'refresh'
  | 'server'
  | 'database'
  | 'gateway'
  | 'source'
  | 'mobile'
  | 'cluster'
  | 'alert'
  | 'policy'
  | 'close';

const props = defineProps<{
  name: BaseIconName;
}>();

const pathMap: Record<BaseIconName, string[]> = {
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
  system: [
    'M4 7h16',
    'M4 12h16',
    'M4 17h16',
    'M7 4v16',
    'M12 4v16',
    'M17 4v16'
  ],
  user: [
    'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8z',
    'M5 20a7 7 0 0 1 14 0'
  ],
  logout: [
    'M10 7V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2',
    'M15 12H4',
    'M7.5 8.5L4 12l3.5 3.5'
  ],
  empty: [
    'M5 5h14v14H5z',
    'M8.5 9.5h7',
    'M8.5 13h4'
  ],
  refresh: [
    'M20 11a8 8 0 1 0 2 5.3',
    'M20 4v5h-5'
  ],
  server: [
    'M5 5.5h14v5H5z',
    'M5 13.5h14v5H5z',
    'M8 8h.01',
    'M8 16h.01',
    'M12 8h4',
    'M12 16h4'
  ],
  database: [
    'M6 6.5c0-1.9 2.7-3.5 6-3.5s6 1.6 6 3.5-2.7 3.5-6 3.5-6-1.6-6-3.5z',
    'M6 6.5v5c0 1.9 2.7 3.5 6 3.5s6-1.6 6-3.5v-5',
    'M6 11.5v5c0 1.9 2.7 3.5 6 3.5s6-1.6 6-3.5v-5'
  ],
  gateway: [
    'M4 12h10',
    'M11 8l4 4-4 4',
    'M5 5h6v14H5z',
    'M17 6h2v12h-2'
  ],
  source: [
    'M6 8a3 3 0 1 1 0-6a3 3 0 0 1 0 6z',
    'M18 14a3 3 0 1 1 0-6a3 3 0 0 1 0 6z',
    'M8.5 5.5h4',
    'M12.5 5.5l3 5',
    'M6 14v4',
    'M6 18h12'
  ],
  mobile: [
    'M8 4.5h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z',
    'M11 7h2',
    'M11 17h2'
  ],
  cluster: [
    'M7 7h5v5H7z',
    'M12 12h5v5h-5z',
    'M12 7h5v5h-5z',
    'M7 12h5v5H7z'
  ],
  alert: [
    'M12 4l8 14H4L12 4z',
    'M12 9v4',
    'M12 16h.01'
  ],
  policy: [
    'M12 3l7 3v6c0 4-2.8 6.8-7 9-4.2-2.2-7-5-7-9V6l7-3z',
    'M9 12h6',
    'M9 15h4'
  ],
  close: [
    'M6 6l12 12',
    'M18 6L6 18'
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
