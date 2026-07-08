<template>
  <section class="filter-bar glass-card">
    <label class="filter-search">
      <span>搜索</span>
      <input :value="keyword" type="text" :placeholder="placeholder" @input="emit('update:keyword', ($event.target as HTMLInputElement).value)" />
    </label>

    <div v-if="groups?.length" class="filter-groups">
      <button
        v-for="group in groups"
        :key="group.key"
        type="button"
        class="filter-chip"
        :class="{ active: group.key === activeGroup }"
        @click="emit('select-group', group.key)"
      >
        <span>{{ group.label }}</span>
        <strong v-if="typeof group.count === 'number'">{{ group.count }}</strong>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { VisualFilterOption } from '@/types/visualization';

defineProps<{
  keyword: string;
  placeholder?: string;
  groups?: VisualFilterOption[];
  activeGroup?: string;
}>();

const emit = defineEmits<{
  'update:keyword': [value: string];
  'select-group': [key: string];
}>();
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
}

.filter-search {
  min-width: 220px;
  display: grid;
  gap: 6px;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.filter-search input {
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.82);
}

.filter-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  min-height: 36px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid var(--sys-color-border-secondary);
  background: transparent;
  color: var(--sys-color-text-secondary);
  cursor: pointer;
}

.filter-chip strong {
  color: var(--sys-color-text-primary);
  font-size: var(--font-size-12);
}

.filter-chip.active {
  border-color: var(--sys-color-brand-secondary);
  color: var(--sys-color-text-primary);
  background: linear-gradient(90deg, rgba(30, 136, 255, 0.16), rgba(45, 226, 230, 0.08));
}

@media (max-width: 1280px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-search {
    min-width: 0;
  }
}
</style>
