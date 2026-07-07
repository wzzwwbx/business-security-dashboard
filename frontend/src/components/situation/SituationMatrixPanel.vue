<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="matrix-list">
      <article v-for="item in section.items" :key="item.name" class="matrix-item" :class="item.tone">
        <div class="matrix-row matrix-row--top">
          <div>
            <strong>{{ item.name }}</strong>
            <p>{{ item.description }}</p>
          </div>
          <span class="matrix-score">{{ item.score }}</span>
        </div>
        <div class="matrix-row matrix-row--bottom">
          <span>{{ item.owner }}</span>
          <span>{{ item.source }}</span>
          <span>{{ item.trend }}</span>
          <span class="matrix-status">{{ item.status }}</span>
        </div>
      </article>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationMatrixSection } from '@/types/situation';

defineProps<{
  section: SituationMatrixSection;
}>();
</script>

<style scoped>
.panel-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.matrix-list {
  display: grid;
  gap: var(--space-4);
}

.matrix-item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  border: 1px solid var(--sys-color-border-secondary);
}

.matrix-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.matrix-row--top strong {
  font-size: var(--font-size-16);
}

.matrix-row--top p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.matrix-score {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.matrix-row--bottom {
  margin-top: var(--space-4);
  flex-wrap: wrap;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.matrix-status {
  padding: 4px var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid currentColor;
}

.matrix-item.success {
  border-color: var(--sys-color-status-success-border);
}

.matrix-item.success .matrix-status {
  color: var(--sys-color-status-success-text);
}

.matrix-item.warning {
  border-color: var(--sys-color-status-warning-border);
}

.matrix-item.warning .matrix-status {
  color: var(--sys-color-status-warning-text);
}

.matrix-item.danger {
  border-color: var(--sys-color-status-danger-border);
}

.matrix-item.danger .matrix-status {
  color: var(--sys-color-status-danger-text);
}

.matrix-item.info {
  border-color: var(--sys-color-status-info-border);
}

.matrix-item.info .matrix-status {
  color: var(--sys-color-status-info-text);
}

@media (max-width: 640px) {
  .matrix-row {
    flex-direction: column;
  }
}
</style>
