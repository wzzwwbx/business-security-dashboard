<template>
  <section class="highlights-grid">
    <button
      v-for="item in items"
      :key="item.title"
      type="button"
      class="highlight-card glass-card"
      :class="item.tone"
      @click="handleSelect(item)"
    >
      <div class="highlight-top">
        <strong>{{ item.title }}</strong>
        <span class="highlight-metric">{{ item.metric }}</span>
      </div>
      <p>{{ item.description }}</p>
      <div class="highlight-meta">{{ item.meta }}</div>
    </button>
  </section>
</template>

<script setup lang="ts">
import type { SituationHighlight, SituationInsight } from '@/types/situation';

const props = defineProps<{
  items: SituationHighlight[];
}>();

const emit = defineEmits<{
  selectInsight: [insight: SituationInsight];
}>();

const handleSelect = (item: SituationHighlight) => {
  emit('selectInsight', {
    id: `highlight-${item.title}`,
    label: '重点摘要',
    title: item.title,
    description: item.description,
    tone: item.tone,
    metric: item.metric,
    meta: item.meta
  });
};
</script>

<style scoped>
.highlights-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--layout-grid-gap);
  margin-bottom: var(--space-7);
}

.highlight-card {
  padding: var(--space-6);
  border-color: var(--sys-color-border-secondary);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.highlight-card:hover,
.highlight-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--sys-color-brand-secondary);
  outline: none;
}

.highlight-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.highlight-metric {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-bold);
}

.highlight-card p {
  margin: var(--space-4) 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.highlight-meta {
  color: var(--sys-color-text-tertiary);
  font-size: var(--font-size-12);
}

.highlight-card.success {
  border-color: var(--sys-color-status-success-border);
}

.highlight-card.warning {
  border-color: var(--sys-color-status-warning-border);
}

.highlight-card.danger {
  border-color: var(--sys-color-status-danger-border);
}

.highlight-card.info {
  border-color: var(--sys-color-status-info-border);
}

@media (max-width: 1280px) {
  .highlights-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .highlights-grid {
    grid-template-columns: 1fr;
  }
}
</style>
