<template>
  <article class="metric-card glass-card">
    <div class="metric-top">
      <span class="metric-label">{{ metric.label }}</span>
      <span v-if="metric.status" class="metric-status" :class="metric.status">
        {{ statusText[metric.status] }}
      </span>
    </div>
    <div class="metric-value-row">
      <strong class="metric-value">{{ metric.value }}</strong>
      <span v-if="metric.unit" class="metric-unit">{{ metric.unit }}</span>
    </div>
    <div class="metric-footer">
      <span>{{ metric.description }}</span>
      <span v-if="metric.trend" class="metric-trend">{{ metric.trend }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { MetricCard as MetricCardModel } from '@/types/dashboard';

const statusText = {
  success: '正常',
  warning: '关注',
  danger: '告警',
  info: '监测'
} as const;

defineProps<{
  metric: MetricCardModel;
}>();
</script>

<style scoped>
.metric-card {
  padding: var(--space-7);
}

.metric-top,
.metric-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.metric-label,
.metric-footer {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.metric-value-row {
  margin: var(--space-6) 0 var(--space-5);
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.metric-value {
  font-size: var(--font-size-32);
  line-height: var(--line-height-tight);
}

.metric-unit {
  color: var(--sys-color-text-secondary);
}

.metric-status {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-bold);
}

.metric-status.success {
  background: var(--sys-color-status-success-bg);
  color: var(--sys-color-status-success-text);
}

.metric-status.warning {
  background: var(--sys-color-status-warning-bg);
  color: var(--sys-color-status-warning-text);
}

.metric-status.danger {
  background: var(--sys-color-status-danger-bg);
  color: var(--sys-color-status-danger-text);
}

.metric-status.info {
  background: var(--sys-color-status-info-bg);
  color: var(--sys-color-status-info-text);
}

.metric-trend {
  color: var(--sys-color-brand-secondary);
}

@media (max-width: 640px) {
  .metric-card {
    padding: var(--space-6);
  }

  .metric-top,
  .metric-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .metric-value {
    font-size: var(--font-size-24);
  }
}
</style>
