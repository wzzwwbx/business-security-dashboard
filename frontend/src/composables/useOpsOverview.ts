import { fetchOpsHosts, fetchOpsOverview, fetchOpsSources } from '@/api/ops';
import type { OpsHostSummaryDto, OpsOverviewDto, OpsSourceDto } from '@/types/ops';
import { getMockOpsTopology } from '@/mocks/opsTopology';
import { onBeforeUnmount, onMounted, readonly, ref, shallowRef } from 'vue';

export function useOpsOverview() {
  const overview = shallowRef<OpsOverviewDto | null>(null);
  const sources = ref<OpsSourceDto[]>([]);
  const hosts = ref<OpsHostSummaryDto[]>([]);
  const selectedHostId = ref<number | null>(null);
  const loading = ref(true);
  const refreshing = ref(false);
  const errorMessage = ref('');
  let timer: number | undefined;


  const syncSelectedHost = (items: OpsHostSummaryDto[]) => {
    if (!items.length) {
      selectedHostId.value = null;
      return;
    }

    const exists = items.some((item) => item.id === selectedHostId.value);
    if (!exists) {
      selectedHostId.value = items[0].id;
    }
  };

  const load = async (silent = false) => {
    if (silent) {
      refreshing.value = true;
    } else {
      loading.value = true;
    }


    try {
      errorMessage.value = '';
      const [overviewData, sourceData, hostData] = await Promise.all([
        fetchOpsOverview(),
        fetchOpsSources(),
        fetchOpsHosts({ page: 1, size: 200 })
      ]);
      overview.value = overviewData;
      sources.value = sourceData;
      hosts.value = hostData.items;
      syncSelectedHost(hostData.items);
    } catch (error) {
      const mockTopology = getMockOpsTopology('beijing-core');
      const mockHosts: OpsHostSummaryDto[] = mockTopology.devices
        .filter((device) => device.deviceType === 'server')
        .map((device, index) => ({
          id: device.hostId ?? device.id,
          hostCode: device.deviceCode,
          hostname: device.deviceCode.toLowerCase(),
          displayName: device.name,
          primaryIp: device.primaryIp,
          status: device.status === 'danger' ? 'OFFLINE' : device.status === 'warning' ? 'STALE' : 'ONLINE',
          sourceType: 'EXTERNAL_API', sourceSystem: 'ops-topology-demo',
          cpuUsagePct: Number.parseFloat(device.metrics.find((item) => item.label === 'CPU')?.value ?? '42'),
          memoryUsagePct: Number.parseFloat(device.metrics.find((item) => item.label === '内存')?.value ?? '55'),
          load1: 1.2 + index, diskUsagePct: 58 + index * 9, openAlertCount: device.alertCount,
          lastObservedAt: new Date().toISOString()
        }));
      overview.value = { generatedAt: new Date().toISOString(), onlineHosts: 168, staleHosts: 2, offlineHosts: 3, openAlerts: 21, sourceCount: 4, averageCpuUsagePct: 56.4, averageMemoryUsagePct: 63.8 };
      sources.value = [{ sourceType: 'EXTERNAL_API', sourceSystem: '基础设施监控平台', enabled: true, status: 'HEALTHY', hostCount: mockHosts.length, lastSeenAt: new Date().toISOString() }];
      hosts.value = mockHosts;
      syncSelectedHost(mockHosts);
      errorMessage.value = import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock' ? '' : (error instanceof Error ? error.message : '运维总览加载失败');
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  };

  const selectHost = (hostId: number) => {
    selectedHostId.value = hostId;
  };

  onMounted(() => {
    load();
    timer = window.setInterval(() => {
      void load(true);
    }, 60000);
  });

  onBeforeUnmount(() => {
    if (timer) {
      window.clearInterval(timer);
    }
  });

  return {
    overview: readonly(overview),
    sources: readonly(sources),
    hosts: readonly(hosts),
    selectedHostId: readonly(selectedHostId),
    loading: readonly(loading),
    refreshing: readonly(refreshing),
    errorMessage: readonly(errorMessage),
    selectHost,
    reload: load
  };
}
