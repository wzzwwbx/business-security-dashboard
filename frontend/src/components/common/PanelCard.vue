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
  minHeight: `${props.minHeight ?? 240}px`
}));
</script>

<style scoped>
.panel-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-6) var(--space-6) var(--space-5);
  clip-path: polygon(0 14px, 14px 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
  overflow: hidden;
  background:
    radial-gradient(circle at right top, rgba(45, 226, 230, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(6, 22, 40, 0.96), rgba(5, 16, 30, 0.94));
  border: 1px solid rgba(74, 205, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(117, 221, 255, 0.04), 0 18px 40px rgba(0, 0, 0, 0.18);
}

.panel-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(89, 216, 255, 0.08), transparent 18%),
    linear-gradient(rgba(117, 221, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 221, 255, 0.04) 1px, transparent 1px);
  background-size: 100% 100%, 26px 26px, 26px 26px;
  opacity: 0.45;
  pointer-events: none;
}

.panel-header {
  position: relative;
  z-index: 1;
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
  color: #7cf2ff;
  letter-spacing: 0.04em;
}

.tag-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-3);
}

.panel-body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
}

@media (max-width: 640px) {
  .panel-card {
    padding: var(--space-5) var(--space-4) var(--space-4);
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
