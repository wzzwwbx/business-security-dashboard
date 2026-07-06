<template>
  <div class="status-grid">
    <article v-for="item in items" :key="item.name" class="status-item">
      <div class="status-head">
        <span class="status-dot" :class="item.status"></span>
        <strong>{{ item.name }}</strong>
      </div>
      <div class="status-desc">{{ item.description }}</div>
      <div v-if="item.progress !== undefined" class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" :class="item.status" :style="{ width: `${item.progress}%` }"></div>
        </div>
        <span>{{ item.progress }}%</span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
interface StatusItem {
  name: string;
  description: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  progress?: number;
}

defineProps<{
  items: StatusItem[];
}>();
</script>

<style scoped>
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-5);
}

.status-item {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  border: 1px solid var(--sys-color-border-secondary);
}

.status-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status-desc {
  margin-top: var(--space-3);
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  min-height: 36px;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.progress-bar {
  flex: 1;
  height: var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--sys-color-progress-track);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
}

.progress-fill.success {
  background: linear-gradient(90deg, var(--ref-color-green-500), var(--sys-color-status-success));
}

.progress-fill.warning {
  background: linear-gradient(90deg, var(--ref-color-orange-500), var(--sys-color-status-warning));
}

.progress-fill.danger {
  background: linear-gradient(90deg, var(--ref-color-red-500), var(--sys-color-status-danger));
}

.progress-fill.info {
  background: linear-gradient(90deg, var(--ref-color-cyan-500), var(--sys-color-status-info));
}
</style>
