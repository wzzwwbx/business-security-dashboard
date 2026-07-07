<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="timeline-list">
      <button
        v-for="item in section.items"
        :key="`${item.time}-${item.title}`"
        type="button"
        class="timeline-item"
        @click="handleSelect(item)"
      >
        <div class="timeline-marker" :class="item.tone"></div>
        <div class="timeline-content">
          <div class="timeline-head">
            <strong>{{ item.title }}</strong>
            <span>{{ item.time }}</span>
          </div>
          <p>{{ item.description }}</p>
          <div class="timeline-actor">{{ item.actor }}</div>
        </div>
      </button>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationInsight, SituationTimelineItem, SituationTimelineSection } from '@/types/situation';

const props = defineProps<{
  section: SituationTimelineSection;
}>();

const emit = defineEmits<{
  selectInsight: [insight: SituationInsight];
}>();

const handleSelect = (item: SituationTimelineItem) => {
  emit('selectInsight', {
    id: `${props.section.code}-${item.time}-${item.title}`,
    label: '事件时间线',
    title: item.title,
    description: item.description,
    tone: item.tone,
    metric: item.time,
    meta: item.actor,
    sourceSectionCode: props.section.code,
    sourceSectionTitle: props.section.title
  });
};
</script>

<style scoped>
.panel-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.timeline-list {
  display: grid;
  gap: var(--space-5);
}

.timeline-item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: var(--space-4);
  text-align: left;
  cursor: pointer;
}

.timeline-item:hover .timeline-content,
.timeline-item:focus-visible .timeline-content {
  border-color: var(--sys-color-brand-secondary);
  transform: translateY(-1px);
}

.timeline-marker {
  position: relative;
  width: 12px;
  height: 12px;
  margin-top: 6px;
  border-radius: 50%;
}

.timeline-marker::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  width: 2px;
  height: calc(100% + 16px);
  transform: translateX(-50%);
  background: var(--sys-color-timeline-line);
}

.timeline-item:last-child .timeline-marker::after {
  display: none;
}

.timeline-marker.success {
  background: var(--sys-color-status-success);
}

.timeline-marker.warning {
  background: var(--sys-color-status-warning);
}

.timeline-marker.danger {
  background: var(--sys-color-status-danger);
}

.timeline-marker.info {
  background: var(--sys-color-status-info);
}

.timeline-content {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-timeline);
  border: 1px solid var(--sys-color-border-secondary);
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.timeline-head span,
.timeline-actor {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.timeline-content p {
  margin: var(--space-3) 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

@media (max-width: 640px) {
  .timeline-head {
    flex-direction: column;
  }
}
</style>
