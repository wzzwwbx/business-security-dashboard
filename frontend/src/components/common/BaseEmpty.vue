<template>
  <div class="empty-state glass-card">
    <div class="empty-icon">
      <BaseIcon :name="icon" />
    </div>
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import BaseIcon from './BaseIcon.vue';

withDefaults(defineProps<{
  title?: string;
  description?: string;
  icon?: 'empty' | 'refresh';
}>(), {
  title: '暂无可展示内容',
  description: '当前组件暂未获取到数据，请稍后重试或检查数据源状态。',
  icon: 'empty'
});
</script>

<style scoped>
.empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-10);
  text-align: center;
}

.empty-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  color: var(--sys-color-brand-secondary);
  background: var(--sys-color-brand-secondary-tint);
  font-size: var(--icon-size-lg);
}

.empty-state strong {
  font-size: var(--font-size-16);
}

.empty-state p {
  margin: 0;
  max-width: 420px;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}
</style>
