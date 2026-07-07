<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="signal-list">
      <article v-for="item in section.items" :key="`${item.label}-${item.title}`" class="signal-item" :class="item.tone">
        <div class="signal-top">
          <span class="signal-label">{{ item.label }}</span>
          <span class="signal-meta">{{ item.meta }}</span>
        </div>
        <strong>{{ item.title }}</strong>
        <p>{{ item.description }}</p>
      </article>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationSignalsSection } from '@/types/situation';

defineProps<{
  section: SituationSignalsSection;
}>();
</script>

<style scoped>
.panel-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.signal-list {
  display: grid;
  gap: var(--space-4);
}

.signal-item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(18, 39, 64, 0.74);
  border: 1px solid var(--sys-color-border-secondary);
}

.signal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.signal-label {
  padding: 4px var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--sys-color-tag-bg);
  color: var(--sys-color-tag-text);
  font-size: var(--font-size-12);
}

.signal-meta {
  color: var(--sys-color-text-tertiary);
  font-size: var(--font-size-12);
}

.signal-item strong {
  display: block;
  margin-bottom: var(--space-2);
}

.signal-item p {
  margin: 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.signal-item.success {
  border-color: var(--sys-color-status-success-border);
}

.signal-item.warning {
  border-color: var(--sys-color-status-warning-border);
}

.signal-item.danger {
  border-color: var(--sys-color-status-danger-border);
}

.signal-item.info {
  border-color: var(--sys-color-status-info-border);
}
</style>
