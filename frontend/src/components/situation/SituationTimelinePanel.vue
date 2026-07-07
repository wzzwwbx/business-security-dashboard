<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="timeline-list">
      <article v-for="item in section.items" :key="`${item.time}-${item.title}`" class="timeline-item">
        <div class="timeline-marker" :class="item.tone"></div>
        <div class="timeline-content">
          <div class="timeline-head">
            <strong>{{ item.title }}</strong>
            <span>{{ item.time }}</span>
          </div>
          <p>{{ item.description }}</p>
          <div class="timeline-actor">{{ item.actor }}</div>
        </div>
      </article>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationTimelineSection } from '@/types/situation';

defineProps<{
  section: SituationTimelineSection;
}>();
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
