<template>
  <section class="digest-grid" aria-label="数据摘要">
    <article v-for="item in items" :key="item.label" class="digest-card glass-card">
      <div class="digest-head">
        <span class="digest-label">{{ item.label }}</span>
        <span class="digest-tone" :class="item.tone"></span>
      </div>
      <strong class="digest-value">{{ item.value }}</strong>
      <p class="digest-description">{{ item.description }}</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { SituationDigestItem } from '@/composables/useDashboardInsights';

defineProps<{
  items: SituationDigestItem[];
}>();
</script>

<style scoped>
.digest-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--layout-card-gap);
  margin-bottom: var(--space-7);
}

.digest-card {
  padding: var(--space-6);
}

.digest-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.digest-label {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.digest-tone {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.digest-tone.success {
  background: var(--sys-color-status-success);
  box-shadow: 0 0 0 6px var(--sys-color-status-success-bg);
}

.digest-tone.warning {
  background: var(--sys-color-status-warning);
  box-shadow: 0 0 0 6px var(--sys-color-status-warning-bg);
}

.digest-tone.danger {
  background: var(--sys-color-status-danger);
  box-shadow: 0 0 0 6px var(--sys-color-status-danger-bg);
}

.digest-tone.info {
  background: var(--sys-color-status-info);
  box-shadow: 0 0 0 6px var(--sys-color-status-info-bg);
}

.digest-value {
  display: block;
  margin-top: var(--space-5);
  font-size: clamp(22px, 2vw, 30px);
  line-height: var(--line-height-tight);
}

.digest-description {
  margin: var(--space-3) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  line-height: var(--line-height-base);
}

@media (max-width: 1280px) {
  .digest-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .digest-grid {
    grid-template-columns: 1fr;
  }

  .digest-card {
    padding: var(--space-5);
  }
}
</style>
