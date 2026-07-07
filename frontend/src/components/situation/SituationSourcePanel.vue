<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="source-list">
      <button
        v-for="item in section.items"
        :key="item.source"
        type="button"
        class="source-item"
        :class="item.tone"
        @click="handleSelect(item)"
      >
        <div class="source-top">
          <strong>{{ item.source }}</strong>
          <span class="source-status">{{ item.status }}</span>
        </div>
        <div class="source-grid">
          <span>同步时延：{{ item.latency }}</span>
          <span>覆盖范围：{{ item.coverage }}</span>
        </div>
        <p>{{ item.note }}</p>
      </button>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationInsight, SituationSourceItem, SituationSourcesSection } from '@/types/situation';

const props = defineProps<{
  section: SituationSourcesSection;
}>();

const emit = defineEmits<{
  selectInsight: [insight: SituationInsight];
}>();

const handleSelect = (item: SituationSourceItem) => {
  emit('selectInsight', {
    id: `${props.section.code}-${item.source}`,
    label: '数据来源',
    title: item.source,
    description: item.note,
    tone: item.tone,
    metric: item.status,
    meta: `${item.latency} · ${item.coverage}`,
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

.source-list {
  display: grid;
  gap: var(--space-4);
}

.source-item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.source-item:hover,
.source-item:focus-visible {
  transform: translateY(-2px);
  border-color: var(--sys-color-brand-secondary);
  outline: none;
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
