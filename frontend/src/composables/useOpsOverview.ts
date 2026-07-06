import { fetchOpsHosts, fetchOpsOverview, fetchOpsSources } from '@/api/ops';
import type { OpsHostSummaryDto, OpsOverviewDto, OpsSourceDto } from '@/types/ops';
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
        fetchOpsHosts({ page: 1, size: 20 })
      ]);
      overview.value = overviewData;
      sources.value = sourceData;
      hosts.value = hostData.items;
      syncSelectedHost(hostData.items);
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '运维总览加载失败';
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
