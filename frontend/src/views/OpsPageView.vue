<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import OpsAlertsPanel from '@/components/ops/OpsAlertsPanel.vue';
import OpsHostDetailPanel from '@/components/ops/OpsHostDetailPanel.vue';
import OpsHostListPanel from '@/components/ops/OpsHostListPanel.vue';
import OpsOverviewMetrics from '@/components/ops/OpsOverviewMetrics.vue';
import OpsPageHero from '@/components/ops/OpsPageHero.vue';
import OpsProcessesPanel from '@/components/ops/OpsProcessesPanel.vue';
import OpsSourcesPanel from '@/components/ops/OpsSourcesPanel.vue';
import OpsTrendPanel from '@/components/ops/OpsTrendPanel.vue';
import { useOpsHostDetail } from '@/composables/useOpsHostDetail';
import { useOpsOverview } from '@/composables/useOpsOverview';

const {
  overview,
  sources,
  hosts,
  selectedHostId,
  loading,
  refreshing,
  errorMessage,
  selectHost,
  reload
} = useOpsOverview();

const {
  detail,
  timeseries,
  processes,
  alerts,
  range
} = useOpsHostDetail(selectedHostId);
</script>

<template>
  <div class="ops-page">
    <OpsPageHero :overview="overview" :refreshing="refreshing" @refresh="reload()" />

    <template v-if="loading">
      <section class="metrics-grid">
        <article v-for="item in 4" :key="item" class="glass-card skeleton-card">
          <BaseSkeleton width="96px" height="14px" />
          <BaseSkeleton width="160px" height="34px" />
          <BaseSkeleton width="80%" height="14px" />
        </article>
      </section>
      <section class="page-grid">
        <div v-for="item in 6" :key="`s-${item}`" class="grid-item" :style="{ gridColumn: item === 1 ? 'span 12' : 'span 6' }">
          <section class="glass-card skeleton-panel">
            <BaseSkeleton width="180px" height="20px" />
            <BaseSkeleton width="100%" height="260px" />
          </section>
        </div>
      </section>
    </template>

    <BaseEmpty
      v-else-if="errorMessage"
      title="运维态势加载失败"
      :description="errorMessage"
    />

    <template v-else>
      <OpsOverviewMetrics :overview="overview" />

      <section class="page-grid">
        <div class="grid-item" :style="{ gridColumn: 'span 12' }">
          <OpsSourcesPanel :sources="sources" />
        </div>
        <div class="grid-item" :style="{ gridColumn: 'span 4' }">
          <OpsHostListPanel
            :hosts="hosts"
            :selected-host-id="selectedHostId"
            @select="selectHost"
          />
        </div>
        <div class="grid-item" :style="{ gridColumn: 'span 8' }">
          <OpsHostDetailPanel :detail="detail" />
        </div>
        <div class="grid-item" :style="{ gridColumn: 'span 8' }">
          <OpsTrendPanel :timeseries="timeseries" :range="range" @change-range="range = $event" />
        </div>
        <div class="grid-item" :style="{ gridColumn: 'span 4' }">
          <OpsAlertsPanel :alerts="alerts" />
        </div>
        <div class="grid-item" :style="{ gridColumn: 'span 12' }">
          <OpsProcessesPanel :processes="processes" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.ops-page {
  display: flex;
  flex-direction: column;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--layout-grid-gap);
  margin-bottom: var(--space-7);
}

.skeleton-card,
.skeleton-panel {
  padding: var(--space-7);
  display: grid;
  gap: var(--space-5);
}

@media (max-width: 1280px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
