<template>
  <section class="header-block glass-card">
    <div class="header-main">
      <div class="header-subtitle">{{ page.subtitle }}</div>
      <h1 class="header-title">{{ page.title }}</h1>
      <div class="header-meta">
        <span class="tag">部署位置：{{ page.location }}</span>
        <span class="tag">最近刷新：{{ page.lastUpdated }}</span>
      </div>
    </div>
    <div class="header-right">
      <div class="header-status">{{ headerStatus }}</div>
      <div class="header-desc">{{ headerDescription }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DashboardPage } from '@/types/dashboard';
import { computed } from 'vue';

const props = defineProps<{
  page: DashboardPage;
}>();

const headerStatus = computed(() => '当前态势');
const headerDescription = computed(() =>
  props.page.lastUpdated ? `最近更新：${props.page.lastUpdated}` : '当前页面展示最新态势信息。'
);
</script>

<style scoped>
.header-block {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-10);
  padding: var(--space-9) var(--space-11);
  margin-bottom: var(--space-7);
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 18%, rgba(33, 150, 243, 0.14), transparent 28%),
    radial-gradient(circle at 88% 20%, rgba(45, 226, 230, 0.12), transparent 22%),
    linear-gradient(180deg, rgba(6, 21, 38, 0.98), rgba(5, 16, 30, 0.94));
  border: 1px solid rgba(74, 205, 255, 0.18);
}

.header-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(89, 216, 255, 0.08), transparent 20%),
    linear-gradient(rgba(117, 221, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(117, 221, 255, 0.04) 1px, transparent 1px);
  background-size: 100% 100%, 28px 28px, 28px 28px;
  opacity: 0.42;
  pointer-events: none;
}

.header-main {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.header-subtitle {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-13);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

.header-title {
  margin: var(--space-3) 0 var(--space-5);
  font-size: clamp(26px, 2.4vw, 32px);
  line-height: 1.25;
  letter-spacing: var(--letter-spacing-wide);
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.header-right {
  position: relative;
  z-index: 1;
  min-width: 220px;
  text-align: right;
}

.header-status {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
}

.header-desc {
  margin-top: var(--space-2);
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

@media (max-width: 1200px) {
  .header-block {
    flex-direction: column;
    padding: var(--space-8) var(--space-9);
  }

  .header-right {
    min-width: 0;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .header-block {
    padding: var(--space-6) var(--space-5);
  }

  .header-title {
    font-size: var(--font-size-24);
    letter-spacing: 0.04em;
  }
}
</style>
