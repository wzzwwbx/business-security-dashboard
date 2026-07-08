<script setup lang="ts">
import AppShell from '@/layout/AppShell.vue';
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const useShell = computed(() => route.meta.shell !== false);
</script>

<template>
  <RouterView v-slot="{ Component }">
    <AppShell v-if="Component && useShell">
      <component :is="Component" />
    </AppShell>
    <component :is="Component" v-else-if="Component" />
  </RouterView>
</template>
