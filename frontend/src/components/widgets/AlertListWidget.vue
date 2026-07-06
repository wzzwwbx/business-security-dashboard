<template>
  <div class="alert-list">
    <article v-for="item in items" :key="item.title + item.time" class="alert-item">
      <div class="alert-left">
        <span class="severity" :class="item.status">{{ item.level }}</span>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
        </div>
      </div>
      <div class="alert-time">{{ item.time }}</div>
    </article>
  </div>
</template>

<script setup lang="ts">
interface AlertItem {
  level: string;
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

defineProps<{
  items: AlertItem[];
}>();
</script>

<style scoped>
.alert-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.alert-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-md);
  background: var(--sys-color-surface-muted);
}

.alert-left {
  display: flex;
  gap: var(--space-4);
}

.alert-left p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  line-height: var(--line-height-base);
}

.alert-time {
  color: var(--sys-color-text-secondary);
  white-space: nowrap;
}

.severity {
  min-width: 54px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-bold);
}

.severity.success {
  background: var(--sys-color-status-success-bg);
  color: var(--sys-color-status-success-text);
}

.severity.warning {
  background: var(--sys-color-status-warning-bg);
  color: var(--sys-color-status-warning-text);
}

.severity.danger {
  background: var(--sys-color-status-danger-bg);
  color: var(--sys-color-status-danger-text);
}

.severity.info {
  background: var(--sys-color-status-info-bg);
  color: var(--sys-color-status-info-text);
}

@media (max-width: 640px) {
  .alert-item,
  .alert-left {
    flex-direction: column;
  }

  .alert-time {
    white-space: normal;
  }
}
</style>
