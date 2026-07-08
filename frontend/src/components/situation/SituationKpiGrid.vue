<template>
  <section class="situation-kpi-grid screen-kpi-row">
    <button
      v-for="kpi in items"
      :key="kpi.label"
      type="button"
      class="kpi-card glass-card"
      :class="kpi.tone"
      @click="handleSelect(kpi)"
    >
      <div class="kpi-top">
        <span class="kpi-label">{{ kpi.label }}</span>
        <span class="kpi-tone">{{ toneText[kpi.tone] }}</span>
      </div>
      <div class="kpi-value-row">
        <strong class="kpi-value">{{ kpi.value }}</strong>
        <span v-if="kpi.unit" class="kpi-unit">{{ kpi.unit }}</span>
      </div>
      <div class="kpi-bottom">
        <span class="kpi-description">{{ kpi.description }}</span>
        <span v-if="kpi.trend" class="kpi-trend">{{ kpi.trend }}</span>
      </div>
    </button>
  </section>
</template>

<script setup lang="ts">
import type { SituationInsight, SituationKpi } from '@/types/situation';

const toneText = {
  success: '稳定',
  warning: '关注',
  danger: '风险',
  info: '监测'
} as const;

const props = defineProps<{
  items: SituationKpi[];
}>();

const emit = defineEmits<{
  'select-insight': [insight: SituationInsight];
}>();

const handleSelect = (kpi: SituationKpi) => {
  emit('select-insight', {
    id: `kpi-${kpi.label}`,
    label: '关键指标',
    title: kpi.label,
    description: kpi.description,
    tone: kpi.tone,
    metric: `${kpi.value}${kpi.unit ?? ''}`,
    meta: kpi.trend ? `趋势：${kpi.trend}` : undefined
  });
};
</script>

<style scoped>
.situation-kpi-grid {
  margin: 0;
}

.kpi-card {
  min-height: 0;
  padding: 14px;
  border-color: var(--sys-color-border-secondary);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard);
}

.kpi-card:hover,
.kpi-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--sys-color-brand-secondary);
  outline: none;
}

.kpi-top,
.kpi-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-label,
.kpi-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 10px 0 8px;
}

.kpi-value {
  font-size: clamp(24px, 1.9vw, 30px);
  line-height: var(--line-height-tight);
}

.kpi-tone {
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.kpi-unit {
  color: var(--sys-color-text-secondary);
}

.kpi-trend {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-12);
}

.kpi-card.success .kpi-tone {
  background: var(--sys-color-status-success-bg);
  color: var(--sys-color-status-success-text);
}

.kpi-card.warning .kpi-tone {
  background: var(--sys-color-status-warning-bg);
  color: var(--sys-color-status-warning-text);
}

.kpi-card.danger .kpi-tone {
  background: var(--sys-color-status-danger-bg);
  color: var(--sys-color-status-danger-text);
}

.kpi-card.info .kpi-tone {
  background: var(--sys-color-status-info-bg);
  color: var(--sys-color-status-info-text);
}
</style>
