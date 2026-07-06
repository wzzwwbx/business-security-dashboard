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

const headerStatus = computed(() => (props.page.dataMode === 'mock' ? '演示数据模式' : '接口联调模式'));
const headerDescription = computed(() =>
  props.page.dataMode === 'mock'
    ? '当前页面直接使用前端 mock 数据，适合设计评审与交互演示。'
    : '当前页面来自 Spring Boot API，可继续接入 MySQL、真实指标与联调链路。'
);
</script>

<style scoped>
.header-block {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-10);
  padding: var(--space-9) var(--space-11);
  margin-bottom: var(--space-7);
}

.header-main {
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
