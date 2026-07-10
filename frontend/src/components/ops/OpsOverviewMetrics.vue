<script setup lang="ts">
import MetricCard from '@/components/common/MetricCard.vue';
import type { MetricCard as MetricCardModel } from '@/types/dashboard';
import type { OpsOverviewDto } from '@/types/ops';
import { computed } from 'vue';

const props = defineProps<{
  overview: OpsOverviewDto | null;
}>();

const metrics = computed<MetricCardModel[]>(() => {
  const overview = props.overview;
  if (!overview) {
    return [];
  }

  return [
    {
      label: '在线主机',
      value: String(overview.onlineHosts),
      status: 'success',
      description: `延迟 ${overview.staleHosts} 台 / 离线 ${overview.offlineHosts} 台`
    },
    {
      label: '未恢复告警',
      value: String(overview.openAlerts),
      status: overview.openAlerts > 0 ? 'danger' : 'info',
      description: '处理器 / 内存 / 磁盘实时阈值告警'
    },
    {
      label: '平均处理器占用',
      value: overview.averageCpuUsagePct.toFixed(1),
      unit: '%',
      status: overview.averageCpuUsagePct > 85 ? 'danger' : overview.averageCpuUsagePct > 65 ? 'warning' : 'success',
      description: '按最新可信快照计算'
    },
    {
      label: '平均内存',
      value: overview.averageMemoryUsagePct.toFixed(1),
      unit: '%',
      status: overview.averageMemoryUsagePct > 90 ? 'danger' : overview.averageMemoryUsagePct > 70 ? 'warning' : 'success',
      description: '按最新可信快照计算'
    }
  ];
});
</script>

<template>
  <section class="metrics-grid">
    <MetricCard v-for="metric in metrics" :key="metric.label" :metric="metric" />
  </section>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--layout-grid-gap);
  margin-bottom: var(--space-5);
}

@media (max-width: 1480px) {
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
