<template>
  <div class="timeline-wrap">
    <div v-for="item in items" :key="item.time + item.title" class="timeline-item">
      <div class="timeline-time">{{ item.time }}</div>
      <div class="timeline-line">
        <span class="status-dot" :class="item.status"></span>
      </div>
      <div class="timeline-content">
        <strong>{{ item.title }}</strong>
        <p>{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineItem {
  time: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

defineProps<{
  items: TimelineItem[];
}>();
</script>

<style scoped>
.timeline-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.timeline-item {
  display: grid;
  grid-template-columns: 92px 24px 1fr;
  gap: var(--space-4);
  align-items: start;
}

.timeline-time {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  padding-top: 2px;
}

.timeline-line {
  position: relative;
  min-height: 56px;
}

.timeline-line::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 14px;
  bottom: -10px;
  width: 2px;
  background: var(--sys-color-timeline-line);
}

.timeline-item:last-child .timeline-line::after {
  display: none;
}

.timeline-content {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--sys-color-surface-timeline);
}

.timeline-content p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  line-height: var(--line-height-base);
}

@media (max-width: 640px) {
  .timeline-item {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .timeline-line {
    display: none;
  }

  .timeline-time {
    padding-top: 0;
  }
}
</style>
