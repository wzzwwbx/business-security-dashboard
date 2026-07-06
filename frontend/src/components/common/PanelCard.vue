<template>
  <section class="panel-card glass-card" :style="panelStyle">
    <header class="panel-header">
      <div>
        <h3>{{ title }}</h3>
        <div v-if="tags?.length" class="tag-group">
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
      <slot name="extra" />
    </header>
    <div class="panel-body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  tags?: string[];
  minHeight?: number;
}>();

const panelStyle = computed(() => ({
  minHeight: `${props.minHeight ?? 280}px`
}));
</script>

<style scoped>
.panel-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-7) var(--space-7) var(--space-5);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-6);
  margin-bottom: var(--space-5);
}

.panel-header h3 {
  margin: 0;
  font-size: var(--font-size-18);
  line-height: 1.4;
}

.tag-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-3);
}

.panel-body {
  flex: 1;
  min-height: 0;
}

@media (max-width: 640px) {
  .panel-card {
    padding: var(--space-6) var(--space-5) var(--space-5);
  }

  .panel-header {
    flex-direction: column;
    margin-bottom: var(--space-4);
  }

  .panel-header h3 {
    font-size: var(--font-size-16);
  }
}
</style>
