<template>
  <section class="situation-hero glass-card">
    <div class="hero-main">
      <div class="hero-leading">
        <span class="hero-icon" :class="page.code" aria-hidden="true">
          <BaseIcon :name="iconName" />
        </span>
        <div>
          <div class="hero-eyebrow">{{ page.subtitle }}</div>
          <div class="hero-title-row">
            <h1 class="hero-title">{{ page.title }}</h1>
            <span class="tag">{{ page.location }}</span>
          </div>
          <p class="hero-summary">{{ page.summary }}</p>
        </div>
      </div>

      <div class="hero-meta">
        <div class="hero-time">更新时间：{{ page.lastUpdated }}</div>
        <div class="hero-tags" aria-label="页面态势标签">
          <div v-for="tag in page.heroTags.slice(0, 4)" :key="`${tag.label}-${tag.value}`" class="hero-tag" :class="tag.tone ?? 'info'">
            <span>{{ tag.label }}</span>
            <strong>{{ tag.value }}</strong>
          </div>
        </div>
      </div>
    </div>
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
  min-height: var(--layout-hero-height);
  padding: 16px 18px;
}

.hero-main {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.hero-leading {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-icon {
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  font-size: 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(30, 136, 255, 0.22), rgba(45, 226, 230, 0.12));
  color: var(--sys-color-brand-secondary);
}

.hero-eyebrow {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
  letter-spacing: 0.08em;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.hero-title {
  margin: 0;
  font-size: clamp(24px, 2vw, 30px);
}

.hero-summary {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.hero-time {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hero-tag {
  min-width: 108px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(12, 26, 45, 0.72);
  display: grid;
  gap: 4px;
}

.hero-tag span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.hero-tag strong {
  font-size: var(--font-size-14);
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

@media (max-width: 1280px) {
  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-meta {
    width: 100%;
    align-items: flex-start;
  }

  .hero-tags {
    justify-content: flex-start;
  }
}
</style>
