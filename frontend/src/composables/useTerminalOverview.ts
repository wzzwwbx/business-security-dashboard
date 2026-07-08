import { fetchTerminalDevices, fetchTerminalOverview, fetchTerminalSources } from '@/api/terminal';
import type { TerminalDeviceSummaryDto, TerminalOverviewDto, TerminalSourceDto } from '@/types/terminal';
import { onBeforeUnmount, onMounted, readonly, ref, shallowRef } from 'vue';

export function useTerminalOverview() {
  const overview = shallowRef<TerminalOverviewDto | null>(null);
  const sources = ref<TerminalSourceDto[]>([]);
  const devices = ref<TerminalDeviceSummaryDto[]>([]);
  const selectedDeviceId = ref<number | null>(null);
  const loading = ref(true);
  const refreshing = ref(false);
  const errorMessage = ref('');
  const keyword = ref('');
  const status = ref('');
  const riskLevel = ref('');
  const ownershipStatus = ref('');
  let timer: number | undefined;

  const syncSelectedDevice = (items: TerminalDeviceSummaryDto[]) => {
    if (!items.length) {
      selectedDeviceId.value = null;
      return;
    }

    const exists = items.some((item) => item.id === selectedDeviceId.value);
    if (!exists) {
      selectedDeviceId.value = items[0].id;
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
      const [overviewData, sourceData, deviceData] = await Promise.all([
        fetchTerminalOverview(),
        fetchTerminalSources(),
        fetchTerminalDevices({
          keyword: keyword.value || undefined,
          status: status.value || undefined,
          riskLevel: riskLevel.value || undefined,
          ownershipStatus: ownershipStatus.value || undefined,
          page: 1,
          size: 200
        })
      ]);
      overview.value = overviewData;
      sources.value = sourceData;
      devices.value = deviceData.items;
      syncSelectedDevice(deviceData.items);
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '终端总览加载失败';
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  };

  const selectDevice = (deviceId: number) => {
    selectedDeviceId.value = deviceId;
  };

  const resetFilters = async () => {
    keyword.value = '';
    status.value = '';
    riskLevel.value = '';
    ownershipStatus.value = '';
    await load();
  };

  onMounted(() => {
    void load();
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
    devices: readonly(devices),
    selectedDeviceId: readonly(selectedDeviceId),
    loading: readonly(loading),
    refreshing: readonly(refreshing),
    errorMessage: readonly(errorMessage),
    keyword,
    status,
    riskLevel,
    ownershipStatus,
    selectDevice,
    reload: load,
    resetFilters
  };
}
