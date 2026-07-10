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
  position: relative;
  padding: var(--space-6);
  clip-path: polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  overflow: hidden;
  background:
    radial-gradient(circle at right top, rgba(45, 226, 230, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(6, 24, 43, 0.98), rgba(6, 18, 32, 0.94));
  border: 1px solid rgba(74, 205, 255, 0.16);
}

.metric-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(120, 224, 255, 0.08), transparent 32%);
  pointer-events: none;
}

.metric-top,
.metric-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.metric-label,
.metric-footer {
  color: #77dfff;
  font-size: var(--font-size-13);
}

.metric-value-row {
  position: relative;
  z-index: 1;
  margin: var(--space-5) 0 var(--space-4);
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.metric-value {
  font-size: var(--font-size-32);
  line-height: var(--line-height-tight);
  color: #effcff;
  text-shadow: 0 0 16px rgba(73, 221, 255, 0.14);
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
  color: #4ef0ff;
}

@media (max-width: 640px) {
  .metric-card {
    padding: var(--space-5);
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
