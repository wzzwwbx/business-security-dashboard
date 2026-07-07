<template>
  <section class="situation-hero glass-card">
    <div class="hero-copy">
      <div class="hero-eyebrow">{{ page.subtitle }}</div>
      <div class="hero-title-row">
        <span class="hero-icon" :class="page.code" aria-hidden="true">
          <BaseIcon :name="iconName" />
        </span>
        <div>
          <h1 class="hero-title">{{ page.title }}</h1>
          <p class="hero-summary">{{ page.summary }}</p>
        </div>
      </div>

      <div class="hero-tags" aria-label="页面态势标签">
        <div v-for="tag in page.heroTags" :key="`${tag.label}-${tag.value}`" class="hero-tag" :class="tag.tone ?? 'info'">
          <span class="hero-tag-label">{{ tag.label }}</span>
          <strong>{{ tag.value }}</strong>
        </div>
      </div>
    </div>

    <aside class="hero-side">
      <div class="hero-side-top">
        <span class="tag">{{ page.location }}</span>
        <span class="tag">最近刷新：{{ page.lastUpdated }}</span>
      </div>
      <div class="hero-actions">
        <article v-for="item in page.actions" :key="item.label" class="hero-action" :class="item.tone">
          <div class="hero-action-label">{{ item.label }}</div>
          <p>{{ item.detail }}</p>
        </article>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import type { SituationPage } from '@/types/situation';
import { computed } from 'vue';

const props = defineProps<{
  page: SituationPage;
}>();

const iconName = computed(() => props.page.code === 'overview' ? 'overview' : props.page.code);
</script>

<style scoped>
.situation-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.9fr);
  gap: var(--space-10);
  padding: var(--space-10) var(--space-11);
  margin-bottom: var(--space-7);
}

.hero-copy {
  min-width: 0;
}

.hero-eyebrow {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-13);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

.hero-title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-6);
  margin-top: var(--space-4);
}

.hero-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-primary);
  background: linear-gradient(135deg, rgba(30, 136, 255, 0.18), rgba(45, 226, 230, 0.12));
  color: var(--sys-color-brand-secondary);
  font-size: 26px;
  flex-shrink: 0;
}

.hero-icon.security {
  color: var(--sys-color-status-danger-text);
  background: linear-gradient(135deg, rgba(255, 77, 109, 0.18), rgba(255, 181, 71, 0.08));
}

.hero-icon.business {
  color: var(--sys-color-brand-primary);
}

.hero-icon.terminal {
  color: var(--sys-color-status-success-text);
  background: linear-gradient(135deg, rgba(61, 220, 151, 0.18), rgba(30, 136, 255, 0.08));
}

.hero-title {
  margin: 0;
  font-size: clamp(28px, 2.5vw, 34px);
  line-height: 1.2;
}

.hero-summary {
  margin: var(--space-4) 0 0;
  max-width: 720px;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.hero-tags {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(164px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.hero-tag {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
}

.hero-tag-label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.hero-tag strong {
  font-size: var(--font-size-18);
}

.hero-tag.success {
  border-color: var(--sys-color-status-success-border);
}

.hero-tag.warning {
  border-color: var(--sys-color-status-warning-border);
}

.hero-tag.danger {
  border-color: var(--sys-color-status-danger-border);
}

.hero-tag.info {
  border-color: var(--sys-color-status-info-border);
}

.hero-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.hero-side-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}

.hero-actions {
  display: grid;
  gap: var(--space-4);
}

.hero-action {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(18, 39, 64, 0.74);
  border: 1px solid var(--sys-color-border-secondary);
}

.hero-action-label {
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-bold);
}

.hero-action p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.hero-action.success {
  border-color: var(--sys-color-status-success-border);
}

.hero-action.warning {
  border-color: var(--sys-color-status-warning-border);
}

.hero-action.danger {
  border-color: var(--sys-color-status-danger-border);
}

.hero-action.info {
  border-color: var(--sys-color-status-info-border);
}

@media (max-width: 1200px) {
  .situation-hero {
    grid-template-columns: 1fr;
    padding: var(--space-9);
  }

  .hero-side-top {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .situation-hero {
    padding: var(--space-6) var(--space-5);
  }

  .hero-title-row {
    gap: var(--space-4);
  }

  .hero-icon {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
}
</style>
