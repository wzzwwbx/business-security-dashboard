<template>
  <div class="recommendation-list">
    <article v-for="item in items" :key="item.title" class="recommendation-item">
      <div class="item-head">
        <strong>{{ item.title }}</strong>
        <span class="tag">{{ item.priority }}</span>
      </div>
      <p>{{ item.description }}</p>
      <div class="action-row">
        <span>建议动作：{{ item.action }}</span>
        <span>执行对象：{{ item.target }}</span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
interface RecommendationItem {
  title: string;
  priority: string;
  description: string;
  action: string;
  target: string;
}

defineProps<{
  items: RecommendationItem[];
}>();
</script>

<style scoped>
.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.recommendation-item {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-muted-strong);
}

.item-head,
.action-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.recommendation-item p {
  margin: var(--space-3) 0 var(--space-5);
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.action-row {
  color: var(--sys-color-text-tertiary);
  font-size: var(--font-size-13);
}

@media (max-width: 640px) {
  .item-head,
  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
