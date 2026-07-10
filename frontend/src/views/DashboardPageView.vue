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

    <OverviewExecutivePanel
      v-if="page.code === 'overview'"
      :digest-items="digestCards"
      :feed-items="operationalFeed"
      :source-items="overviewSourceCards"
    />

    <TerminalExecutivePanel
      v-else-if="page.code === 'terminal'"
      :digest-items="digestCards"
      :feed-items="operationalFeed"
      :last-updated="page.lastUpdated"
    />

    <BusinessExecutivePanel
      v-else-if="page.code === 'business'"
      :digest-items="digestCards"
      :feed-items="operationalFeed"
      :last-updated="page.lastUpdated"
    />

    <template v-else>
      <SituationDigest :items="digestCards" />
      <OperationalFeed :items="operationalFeed" />
    </template>

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
import BusinessExecutivePanel from '@/components/dashboard/BusinessExecutivePanel.vue';
import OverviewExecutivePanel from '@/components/dashboard/OverviewExecutivePanel.vue';
import OperationalFeed from '@/components/dashboard/OperationalFeed.vue';
import SituationDigest from '@/components/dashboard/SituationDigest.vue';
import TerminalExecutivePanel from '@/components/dashboard/TerminalExecutivePanel.vue';
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

const overviewSourceCards = computed(() => {
  if (page.value?.code !== 'overview') {
    return [];
  }

  return [
    {
      name: '运维采集系统',
      status: '正常',
      description: '持续汇聚主机、进程和资源运行情况，当前状态稳定。',
      sync: '1 分钟前',
      coverage: '主机运行、资源负载、网络状态',
      tone: 'success' as const
    },
    {
      name: '业务运行系统',
      status: '正常',
      description: '已纳入密信、签阅与归档等核心业务运行情况。',
      sync: '2 分钟前',
      coverage: '业务状态、访问链路、处理时效',
      tone: 'info' as const
    },
    {
      name: '终端管理系统',
      status: '关注',
      description: '终端在线、补丁与证书状态已纳入综合态势展示。',
      sync: '5 分钟前',
      coverage: '终端在线、补丁更新、证书状态',
      tone: 'warning' as const
    }
  ];
});

const errorDescription = computed(() => {
  if (errorMessage.value) {
    return getDashboardDataSource() === 'integration'
      ? `${errorMessage.value}。请确认数据服务和网络连接是否正常。`
      : errorMessage.value;
  }

  return getDashboardDataSource() === 'integration'
    ? '当前未获取到页面数据，请检查数据服务是否正常。'
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
  margin-bottom: var(--space-5);
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
  margin-bottom: var(--space-5);
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
