<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="cards-grid">
      <button
        v-for="item in section.items"
        :key="item.name"
        type="button"
        class="status-card"
        :class="item.tone"
        @click="handleSelect(item)"
      >
        <div class="status-card-top">
          <strong>{{ item.name }}</strong>
          <span class="status-card-metric">{{ item.metric }}</span>
        </div>
        <div class="status-card-summary">{{ item.summary }}</div>
        <div v-if="item.progress !== undefined" class="progress-track" aria-hidden="true">
          <span class="progress-fill" :style="{ width: `${item.progress}%` }"></span>
        </div>
        <p>{{ item.detail }}</p>
      </button>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationCardItem, SituationCardsSection, SituationInsight } from '@/types/situation';

const props = defineProps<{
  section: SituationCardsSection;
}>();

const emit = defineEmits<{
  selectInsight: [insight: SituationInsight];
}>();

const handleSelect = (item: SituationCardItem) => {
  emit('selectInsight', {
    id: `${props.section.code}-${item.name}`,
    label: '服务卡片',
    title: item.name,
    description: item.detail,
    tone: item.tone,
    metric: item.metric,
    meta: item.summary,
    sourceSectionCode: props.section.code,
    sourceSectionTitle: props.section.title
  });
};
</script>

<style scoped>
.panel-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.status-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(18, 39, 64, 0.74);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.status-card:hover,
.status-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--sys-color-brand-secondary);
  outline: none;
}

.status-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.status-card-metric {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
}

.status-card-summary {
  margin-top: var(--space-3);
  font-size: var(--font-size-13);
  color: var(--sys-color-text-tertiary);
}

.progress-track {
  margin-top: var(--space-4);
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--sys-color-progress-track);
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--sys-color-brand-primary), var(--sys-color-brand-secondary));
}

.status-card p {
  margin: var(--space-4) 0 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.status-card.success {
  border-color: var(--sys-color-status-success-border);
}

.status-card.warning {
  border-color: var(--sys-color-status-warning-border);
}

.status-card.danger {
  border-color: var(--sys-color-status-danger-border);
}

.status-card.info {
  border-color: var(--sys-color-status-info-border);
}

@media (max-width: 640px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
