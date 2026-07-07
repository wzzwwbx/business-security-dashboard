<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="chart-panel-body">
      <EChartWidget :option="section.option" />
    </div>

    <p v-if="section.footer" class="chart-footer">{{ section.footer }}</p>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import type { SituationChartSection } from '@/types/situation';

defineProps<{
  section: SituationChartSection;
}>();
</script>

<style scoped>
.chart-panel-body {
  min-height: 260px;
}

.panel-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.chart-footer {
  margin: var(--space-4) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
  line-height: var(--line-height-base);
}
</style>
