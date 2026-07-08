<template>
  <section class="glass-card drill-panel">
    <header class="drill-panel-header">
      <div>
        <h3>{{ section.title }}</h3>
        <p v-if="section.description">{{ section.description }}</p>
      </div>
      <div v-if="section.tags?.length" class="drill-panel-tags">
        <span v-for="tag in section.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </header>

    <button
      v-for="item in section.items"
      :key="item.name"
      type="button"
      class="drill-card"
      :class="item.tone"
      @click="handleSelect(item)"
    >
      <div class="drill-card-top">
        <strong>{{ item.name }}</strong>
        <span>{{ item.metric }}</span>
      </div>
      <p>{{ item.summary }}</p>
      <small>{{ item.detail }}</small>
    </button>
  </section>
</template>

<script setup lang="ts">
import type { SituationCardItem, SituationDrilldownSummarySection, SituationInsight } from '@/types/situation';

const props = defineProps<{
  section: SituationDrilldownSummarySection;
}>();

const emit = defineEmits<{
  'select-insight': [insight: SituationInsight];
}>();

function handleSelect(item: SituationCardItem) {
  emit('select-insight', {
    id: `${props.section.code}-${item.name}`,
    label: props.section.title,
    title: item.name,
    description: item.summary,
    tone: item.tone,
    metric: item.metric,
    meta: item.detail,
    sourceSectionCode: props.section.code,
    sourceSectionTitle: props.section.title
  });
}
</script>

<style scoped>
.drill-panel {
  padding: 14px;
}

.drill-panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.drill-panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.drill-panel-header p {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.drill-panel-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.drill-card {
  width: 100%;
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.74);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.drill-card + .drill-card {
  margin-top: 10px;
}

.drill-card-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.drill-card p,
.drill-card small {
  margin: 0;
  color: var(--sys-color-text-secondary);
}

.drill-card.success {
  border-color: var(--sys-color-status-success-border);
}

.drill-card.warning {
  border-color: var(--sys-color-status-warning-border);
}

.drill-card.danger {
  border-color: var(--sys-color-status-danger-border);
}
</style>
