<script setup lang="ts">
import DemoBusinessBoard from '@/components/demo/DemoBusinessBoard.vue';
import DemoOverviewBoard from '@/components/demo/DemoOverviewBoard.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const pageCode = computed(() => String(route.meta.pageCode ?? 'overview'));
</script>

<template>
  <DemoBusinessBoard v-if="pageCode === 'business'" />
  <DemoOverviewBoard v-else />
</template>
