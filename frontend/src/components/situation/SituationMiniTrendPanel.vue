<template>
  <section class="glass-card trend-panel">
    <header class="trend-panel-header">
      <div>
        <h3>{{ section.title }}</h3>
        <p v-if="section.description">{{ section.description }}</p>
      </div>
      <div v-if="section.tags?.length" class="trend-panel-tags">
        <span v-for="tag in section.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </header>
    <MiniTrendGroup :items="section.items" />
  </section>
</template>

<script setup lang="ts">
import MiniTrendGroup from '@/components/widgets/MiniTrendGroup.vue';
import type { SituationMiniTrendSection } from '@/types/situation';

defineProps<{
  section: SituationMiniTrendSection;
}>();
</script>

<style scoped>
.trend-panel {
  padding: 14px;
}

.trend-panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.trend-panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.trend-panel-header p {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.trend-panel-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
