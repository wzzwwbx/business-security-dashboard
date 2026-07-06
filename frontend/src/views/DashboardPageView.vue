<template>
  <div v-if="loading" class="dashboard-page" aria-busy="true">
    <section class="header-skeleton glass-card">
      <div class="header-skeleton-left">
        <BaseSkeleton width="140px" height="14px" />
        <BaseSkeleton width="360px" height="36px" />
        <div class="header-skeleton-tags">
          <BaseSkeleton width="180px" height="28px" />
          <BaseSkeleton width="200px" height="28px" />
        </div>
      </div>
      <div class="header-skeleton-right">
        <BaseSkeleton width="120px" height="20px" />
        <BaseSkeleton width="260px" height="14px" />
      </div>
    </section>

    <section class="digest-skeleton-grid">
      <article v-for="item in 4" :key="`digest-${item}`" class="digest-skeleton glass-card">
        <BaseSkeleton width="92px" height="14px" />
        <BaseSkeleton width="140px" height="30px" />
        <BaseSkeleton width="88%" height="14px" />
      </article>
    </section>

    <section class="feed-skeleton glass-card">
      <BaseSkeleton width="220px" height="20px" />
      <div class="feed-skeleton-grid">
        <BaseSkeleton v-for="item in 3" :key="`feed-${item}`" width="100%" height="126px" />
      </div>
    </section>

    <section class="hero-skeleton glass-card">
      <BaseSkeleton width="180px" height="20px" />
      <BaseSkeleton width="100%" height="360px" />
    </section>

    <section class="metrics-grid">
      <article v-for="item in 6" :key="item" class="metric-skeleton glass-card">
        <BaseSkeleton width="88px" height="14px" />
        <BaseSkeleton width="120px" height="38px" />
        <BaseSkeleton width="70%" height="14px" />
      </article>
    </section>

    <section class="page-grid">
      <div v-for="item in 4" :key="`panel-${item}`" class="grid-item" :style="{ gridColumn: 'span 6' }">
        <section class="panel-skeleton glass-card">
          <BaseSkeleton width="160px" height="20px" />
          <BaseSkeleton width="100%" height="220px" />
        </section>
      </div>
    </section>
  </div>

  <div v-else-if="page" class="dashboard-page">
    <PageHeader :page="page" />
    <SituationDigest :items="digestCards" />
    <OperationalFeed :items="operationalFeed" />

    <section v-if="heroWidget" class="hero-panel">
      <WidgetRenderer :widget="heroWidget" />
    </section>

    <section class="metrics-grid">
      <MetricCard v-for="metric in page.summaryMetrics" :key="metric.label" :metric="metric" />
    </section>

    <section class="page-grid">
      <div
        v-for="widget in pageWidgets"
        :key="widget.code"
        class="grid-item"
        :style="{ gridColumn: `span ${widget.colSpan}` }"
      >
        <WidgetRenderer :widget="widget" />
      </div>
    </section>
  </div>

  <BaseEmpty v-else title="页面数据加载失败" :description="errorDescription">
    <BaseButton class="retry-button" variant="secondary" @click="loadPage">
      <template #icon><BaseIcon name="refresh" /></template>
      重新加载
    </BaseButton>
  </BaseEmpty>
</template>

<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseIcon from '@/components/common/BaseIcon.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import MetricCard from '@/components/common/MetricCard.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import OperationalFeed from '@/components/dashboard/OperationalFeed.vue';
import SituationDigest from '@/components/dashboard/SituationDigest.vue';
import WidgetRenderer from '@/components/widgets/WidgetRenderer.vue';
import { getDashboardDataSource } from '@/api/dashboard';
import { useDashboardInsights } from '@/composables/useDashboardInsights';
import { useDashboardLayout } from '@/composables/useDashboardLayout';
import { useDashboardPage } from '@/composables/useDashboardPage';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { page, loading, errorMessage, loadPage } = useDashboardPage(route);
const { digestCards, operationalFeed } = useDashboardInsights(page);
const { heroWidget, pageWidgets } = useDashboardLayout(page);

const errorDescription = computed(() => {
  if (errorMessage.value) {
    return getDashboardDataSource() === 'integration'
      ? `${errorMessage.value}。当前处于接口联调模式，请确认 Spring Boot 服务、/api 代理与数据库配置。`
      : errorMessage.value;
  }

  return getDashboardDataSource() === 'integration'
    ? '当前未获取到页面数据，请检查后端服务、代理配置或数据库连接状态。'
    : '当前未获取到页面数据，请重试。';
});
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-panel,
.hero-skeleton {
  margin-bottom: var(--space-7);
}

.hero-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-7);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--layout-card-gap);
  margin-bottom: var(--space-7);
}

.grid-item {
  min-width: 0;
}

.header-skeleton {
  display: flex;
  justify-content: space-between;
  gap: var(--space-10);
  padding: var(--space-9) var(--space-11);
  margin-bottom: var(--space-7);
}

.header-skeleton-left,
.header-skeleton-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.header-skeleton-right {
  align-items: flex-end;
}

.header-skeleton-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.digest-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--layout-card-gap);
  margin-bottom: var(--space-7);
}

.digest-skeleton,
.metric-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-7);
}

.feed-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-7);
  margin-bottom: var(--space-7);
}

.feed-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.panel-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-height: 320px;
  padding: var(--space-7);
}

.retry-button {
  margin-top: var(--space-4);
}

@media (max-width: 1440px) {
  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .digest-skeleton-grid,
  .feed-skeleton-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .metrics-grid,
  .digest-skeleton-grid,
  .feed-skeleton-grid {
    grid-template-columns: 1fr;
  }

  .grid-item {
    grid-column: span 1 !important;
  }

  .header-skeleton {
    flex-direction: column;
  }

  .header-skeleton-right {
    align-items: flex-start;
  }
}
</style>
