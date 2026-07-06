<template>
  <div class="node-map">
    <div v-for="region in regions" :key="region.name" class="region-card">
      <div class="region-head">
        <strong>{{ region.name }}</strong>
        <span>{{ region.count }} 个节点</span>
      </div>
      <div class="region-items">
        <span v-for="item in region.items" :key="item" class="region-item">{{ item }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RegionGroup {
  name: string;
  count: number;
  items: string[];
}

defineProps<{
  regions: RegionGroup[];
}>();
</script>

<style scoped>
.node-map {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: var(--space-5);
}

.region-card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-region);
  border: 1px solid var(--sys-color-border-region);
}

.region-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.region-head span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.region-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.region-item {
  padding: 6px var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--sys-color-brand-primary-tint);
  color: var(--ref-color-blue-50);
  font-size: var(--font-size-12);
}
</style>
