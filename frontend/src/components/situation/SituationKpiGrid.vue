<template>
  <section class="situation-kpi-grid">
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
        <span>{{ kpi.description }}</span>
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
  selectInsight: [insight: SituationInsight];
}>();

const handleSelect = (kpi: SituationKpi) => {
  emit('selectInsight', {
    id: `kpi-${kpi.label}`,
    label: 'KPI 指标',
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
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--layout-grid-gap);
  margin-bottom: var(--space-7);
}

.kpi-card {
  padding: var(--space-7);
  min-height: 168px;
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
  gap: var(--space-3);
}

.kpi-label,
.kpi-bottom {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin: var(--space-6) 0 var(--space-5);
}

.kpi-value {
  font-size: clamp(28px, 2.3vw, 34px);
  line-height: var(--line-height-tight);
}

.kpi-tone {
  padding: 5px var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.kpi-unit {
  color: var(--sys-color-text-secondary);
}

.kpi-trend {
  color: var(--sys-color-brand-secondary);
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

@media (max-width: 1440px) {
  .situation-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .situation-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .situation-kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-card {
    min-height: 0;
    padding: var(--space-6);
  }
}
</style>
