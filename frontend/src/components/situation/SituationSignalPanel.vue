<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="signal-list">
      <button
        v-for="item in section.items"
        :key="`${item.label}-${item.title}`"
        type="button"
        class="signal-item"
        :class="item.tone"
        @click="handleSelect(item)"
      >
        <div class="signal-top">
          <span class="signal-label">{{ item.label }}</span>
          <span class="signal-meta">{{ item.meta }}</span>
        </div>
        <strong>{{ item.title }}</strong>
        <p>{{ item.description }}</p>
      </button>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationInsight, SituationSignalItem, SituationSignalsSection } from '@/types/situation';

const props = defineProps<{
  section: SituationSignalsSection;
}>();

const emit = defineEmits<{
  selectInsight: [insight: SituationInsight];
}>();

const handleSelect = (item: SituationSignalItem) => {
  emit('selectInsight', {
    id: `${props.section.code}-${item.title}`,
    label: item.label,
    title: item.title,
    description: item.description,
    tone: item.tone,
    meta: item.meta,
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

.signal-list {
  display: grid;
  gap: var(--space-4);
}

.signal-item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(18, 39, 64, 0.74);
  border: 1px solid var(--sys-color-border-secondary);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.signal-item:hover,
.signal-item:focus-visible {
  transform: translateY(-2px);
  border-color: var(--sys-color-brand-secondary);
  outline: none;
}

.signal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.signal-label {
  padding: 4px var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--sys-color-tag-bg);
  color: var(--sys-color-tag-text);
  font-size: var(--font-size-12);
}

.signal-meta {
  color: var(--sys-color-text-tertiary);
  font-size: var(--font-size-12);
}

.signal-item strong {
  display: block;
  margin-bottom: var(--space-2);
}

.signal-item p {
  margin: 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.signal-item.success {
  border-color: var(--sys-color-status-success-border);
}

.signal-item.warning {
  border-color: var(--sys-color-status-warning-border);
}

.signal-item.danger {
  border-color: var(--sys-color-status-danger-border);
}

.signal-item.info {
  border-color: var(--sys-color-status-info-border);
}
</style>
