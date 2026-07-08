<script setup lang="ts">
import type { SystemTabDefinition } from '@/constants/navigation';
import type { SystemTabKey } from '@/types/iam';
import { RouterLink } from 'vue-router';

defineProps<{
  tabs: SystemTabDefinition[];
  activeTab: SystemTabKey;
}>();
</script>

<template>
  <nav class="tabs glass-card" aria-label="系统管理子导航">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: tab.key === activeTab }"
      :to="tab.route"
    >
      <strong>{{ tab.label }}</strong>
      <span>{{ tab.description }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  padding: var(--space-4);
  margin-bottom: var(--space-7);
}

.tab-item {
  display: grid;
  gap: var(--space-2);
  min-height: 92px;
  padding: var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-xl);
  color: var(--sys-color-text-secondary);
  background: transparent;
  transition: all var(--motion-duration-fast) var(--motion-ease-standard);
}

.tab-item strong {
  color: var(--sys-color-text-primary);
}

.tab-item span {
  font-size: var(--font-size-13);
  line-height: var(--line-height-base);
}

.tab-item:hover,
.tab-item.active {
  border-color: var(--sys-color-border-accent);
  background: linear-gradient(135deg, var(--sys-color-brand-primary-soft), var(--sys-color-brand-primary-weak));
}

@media (max-width: 1100px) {
  .tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .tabs {
    grid-template-columns: 1fr;
  }
}
</style>
