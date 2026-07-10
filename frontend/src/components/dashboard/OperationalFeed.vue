<template>
  <section class="feed-card glass-card" aria-label="动态研判">
    <header class="feed-header">
      <div>
        <div class="feed-eyebrow">重点动态</div>
        <h2 class="feed-title">当前重点态势</h2>
      </div>
      <p class="feed-subtitle">聚焦当前需要优先关注的风险变化、业务波动和处置进展。</p>
    </header>

    <div class="feed-list">
      <article v-for="item in items" :key="`${item.tag}-${item.title}-${item.meta}`" class="feed-item">
        <div class="feed-item-head">
          <span class="feed-tag" :class="item.tone">{{ item.tag }}</span>
          <span class="feed-meta">{{ item.meta }}</span>
        </div>
        <strong class="feed-item-title">{{ item.title }}</strong>
        <p class="feed-item-desc">{{ item.description }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { OperationalFeedItem } from '@/composables/useDashboardInsights';

defineProps<{
  items: OperationalFeedItem[];
}>();
</script>

<style scoped>
.feed-card {
  padding: var(--space-7);
  margin-bottom: var(--space-7);
}

.feed-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.feed-eyebrow {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-13);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

.feed-title {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-22);
}

.feed-subtitle {
  max-width: 420px;
  margin: 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
  text-align: right;
}

.feed-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.feed-item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-muted);
  border: 1px solid var(--sys-color-border-secondary);
}

.feed-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.feed-tag {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.feed-tag.success {
  background: var(--sys-color-status-success-bg);
  color: var(--sys-color-status-success-text);
}

.feed-tag.warning {
  background: var(--sys-color-status-warning-bg);
  color: var(--sys-color-status-warning-text);
}

.feed-tag.danger {
  background: var(--sys-color-status-danger-bg);
  color: var(--sys-color-status-danger-text);
}

.feed-tag.info {
  background: var(--sys-color-status-info-bg);
  color: var(--sys-color-status-info-text);
}

.feed-meta {
  color: var(--sys-color-text-tertiary);
  font-size: var(--font-size-12);
  text-align: right;
}

.feed-item-title {
  display: block;
  margin-top: var(--space-4);
  line-height: var(--line-height-snug);
}

.feed-item-desc {
  margin: var(--space-3) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  line-height: var(--line-height-relaxed);
}

@media (max-width: 1280px) {
  .feed-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .feed-header {
    flex-direction: column;
  }

  .feed-subtitle {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .feed-card {
    padding: var(--space-6) var(--space-5);
  }

  .feed-list {
    grid-template-columns: 1fr;
  }

  .feed-item-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .feed-meta {
    text-align: left;
  }
}
</style>
