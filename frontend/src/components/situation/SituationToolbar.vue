<template>
  <section class="toolbar-shell glass-card" aria-label="态势页面工具条">
    <div class="toolbar-top-row">
      <div class="toolbar-summary">
        <div class="toolbar-title-row">
          <strong>{{ title }}</strong>
          <span class="source-pill" :class="sourceTone">{{ sourceLabel }}</span>
        </div>
        <p>{{ summary }}</p>
      </div>

      <div class="toolbar-actions">
        <BaseButton variant="secondary" @click="emit('refresh')">刷新页面</BaseButton>
        <BaseButton v-if="selectedInsightTitle" variant="secondary" @click="emit('clearFocus')">
          清除焦点
        </BaseButton>
      </div>
    </div>

    <div v-if="warningMessage" class="warning-banner" role="status">
      <span class="warning-dot" aria-hidden="true"></span>
      <span>{{ warningMessage }}</span>
    </div>

    <div class="filter-row" role="tablist" aria-label="态势板块过滤器">
      <button
        v-for="filter in filters"
        :key="filter.key"
        type="button"
        class="filter-chip"
        :class="{ active: filter.key === activeFilter }"
        :aria-pressed="filter.key === activeFilter"
        @click="emit('selectFilter', filter.key)"
      >
        <span>{{ filter.label }}</span>
        <strong>{{ filter.count }}</strong>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getSituationSourceLabel } from '@/api/situations';
import BaseButton from '@/components/common/BaseButton.vue';
import type { SituationFilterChip, SituationResolvedSource } from '@/types/situation';
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  summary: string;
  filters: SituationFilterChip[];
  activeFilter: string;
  resolvedSource: SituationResolvedSource;
  warningMessage?: string;
  selectedInsightTitle?: string;
}>();

const emit = defineEmits<{
  selectFilter: [filterKey: string];
  refresh: [];
  clearFocus: [];
}>();

const sourceTone = computed(() => props.resolvedSource === 'integration' ? 'success' : 'warning');
const sourceLabel = computed(() => getSituationSourceLabel(props.resolvedSource, Boolean(props.warningMessage)));
</script>

<style scoped>
.toolbar-shell {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-6) var(--space-7);
  margin-bottom: var(--space-7);
}

.toolbar-top-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-6);
}

.toolbar-summary {
  min-width: 0;
}

.toolbar-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.toolbar-title-row strong {
  font-size: var(--font-size-16);
}

.toolbar-summary p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.toolbar-actions {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  flex-wrap: wrap;
}

.source-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.source-pill.success {
  background: var(--sys-color-status-success-bg);
  color: var(--sys-color-status-success-text);
}

.source-pill.warning {
  background: var(--sys-color-status-warning-bg);
  color: var(--sys-color-status-warning-text);
}

.warning-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(255, 181, 71, 0.08);
  border: 1px solid var(--sys-color-status-warning-border);
  color: var(--sys-color-status-warning-text);
}

.warning-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  margin-top: 4px;
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 40px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-pill);
  border: 1px solid var(--sys-color-border-primary);
  background: var(--sys-color-surface-panel);
  color: var(--sys-color-text-secondary);
  cursor: pointer;
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard);
}

.filter-chip strong {
  color: var(--sys-color-text-primary);
  font-size: var(--font-size-12);
}

.filter-chip:hover,
.filter-chip:focus-visible {
  transform: translateY(-1px);
  border-color: var(--sys-color-brand-secondary);
  outline: none;
}

.filter-chip.active {
  background: linear-gradient(90deg, rgba(30, 136, 255, 0.18), rgba(45, 226, 230, 0.12));
  color: var(--sys-color-text-primary);
  border-color: var(--sys-color-brand-secondary);
}

@media (max-width: 960px) {
  .toolbar-top-row {
    flex-direction: column;
  }
}
</style>
