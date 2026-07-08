<template>
  <div class="mini-trend-grid">
    <article v-for="item in items" :key="item.key" class="mini-trend-card" :class="item.tone ?? 'info'">
      <div class="mini-trend-top">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <div class="mini-trend-progress">
        <span class="mini-trend-fill" :style="{ width: `${Math.max(6, Math.min(item.percent ?? 0, 100))}%` }"></span>
      </div>
      <div class="mini-trend-bottom">
        <span>{{ toneLabel(item.tone) }}</span>
        <span>{{ item.trend ?? '保持观测' }}</span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { MiniTrendItem } from '@/types/visualization';
import type { VisualTone } from '@/types/visualization';

defineProps<{
  items: MiniTrendItem[];
}>();

function toneLabel(tone?: VisualTone) {
  switch (tone) {
    case 'success':
      return '稳定';
    case 'warning':
      return '关注';
    case 'danger':
      return '告警';
    default:
      return '监测';
  }
}
</script>

<style scoped>
.mini-trend-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mini-trend-card {
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(11, 25, 43, 0.68);
}

.mini-trend-top,
.mini-trend-bottom {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.mini-trend-top span,
.mini-trend-bottom {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.mini-trend-top strong {
  font-size: 18px;
}

.mini-trend-progress {
  height: 6px;
  margin: 12px 0 10px;
  border-radius: 999px;
  background: var(--sys-color-progress-track);
  overflow: hidden;
}

.mini-trend-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--sys-color-brand-secondary);
}

.mini-trend-card.success .mini-trend-fill {
  background: var(--sys-color-status-success);
}

.mini-trend-card.warning .mini-trend-fill {
  background: var(--sys-color-status-warning);
}

.mini-trend-card.danger .mini-trend-fill {
  background: var(--sys-color-status-danger);
}

@media (max-width: 640px) {
  .mini-trend-grid {
    grid-template-columns: 1fr;
  }
}
</style>
