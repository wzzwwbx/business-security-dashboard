<template>
  <section class="toolbar glass-card">
    <div class="toolbar-left">
      <div class="toolbar-copy">
        <strong>{{ title }}</strong>
        <span>{{ summary }}</span>
      </div>
      <div class="toolbar-status">
        <span class="tag" :class="sourceTone">{{ sourceLabel }}</span>
        <span v-if="warningMessage" class="toolbar-warning">{{ warningMessage }}</span>
        <span v-else-if="selectedInsightTitle" class="toolbar-focus">当前聚焦：{{ selectedInsightTitle }}</span>
      </div>
    </div>

    <div class="toolbar-actions">
      <div class="filter-row">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          class="filter-chip"
          :class="{ active: filter.key === activeFilter }"
          @click="emit('select-filter', filter.key)"
        >
          <span>{{ filter.label }}</span>
          <strong>{{ filter.count }}</strong>
        </button>
      </div>
      <div class="toolbar-buttons">
        <BaseButton v-if="selectedInsightTitle" variant="secondary" @click="emit('clear-focus')">清空聚焦</BaseButton>
        <BaseButton variant="secondary" @click="emit('refresh')">刷新</BaseButton>
      </div>
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
  'select-filter': [key: string];
  refresh: [];
  'clear-focus': [];
}>();

const sourceTone = computed(() => props.resolvedSource === 'integration' ? 'success' : 'warning');
const sourceLabel = computed(() => getSituationSourceLabel(props.resolvedSource, Boolean(props.warningMessage)));
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
}

.toolbar-left,
.toolbar-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-copy {
  display: grid;
  gap: 4px;
}

.toolbar-copy strong {
  font-size: var(--font-size-14);
}

.toolbar-copy span,
.toolbar-warning,
.toolbar-focus {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  min-height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid var(--sys-color-border-secondary);
  background: transparent;
  color: var(--sys-color-text-secondary);
  cursor: pointer;
}

.filter-chip strong {
  color: var(--sys-color-text-primary);
  font-size: var(--font-size-12);
}

.filter-chip.active {
  border-color: var(--sys-color-brand-secondary);
  color: var(--sys-color-text-primary);
  background: linear-gradient(90deg, rgba(30, 136, 255, 0.16), rgba(45, 226, 230, 0.08));
}

.toolbar-buttons {
  display: flex;
  gap: 8px;
}

@media (max-width: 1280px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-buttons {
    justify-content: flex-end;
  }
}
</style>
