<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="source-list">
      <article v-for="item in section.items" :key="item.source" class="source-item" :class="item.tone">
        <div class="source-top">
          <strong>{{ item.source }}</strong>
          <span class="source-status">{{ item.status }}</span>
        </div>
        <div class="source-grid">
          <span>同步时延：{{ item.latency }}</span>
          <span>覆盖范围：{{ item.coverage }}</span>
        </div>
        <p>{{ item.note }}</p>
      </article>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationSourcesSection } from '@/types/situation';

defineProps<{
  section: SituationSourcesSection;
}>();
</script>

<style scoped>
.panel-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.source-list {
  display: grid;
  gap: var(--space-4);
}

.source-item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
}

.source-top,
.source-grid {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.source-status {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-12);
}

.source-grid {
  margin: var(--space-3) 0;
  flex-wrap: wrap;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.source-item p {
  margin: 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.source-item.success {
  border-color: var(--sys-color-status-success-border);
}

.source-item.warning {
  border-color: var(--sys-color-status-warning-border);
}

.source-item.danger {
  border-color: var(--sys-color-status-danger-border);
}

.source-item.info {
  border-color: var(--sys-color-status-info-border);
}
</style>
