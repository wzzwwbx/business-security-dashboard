import { fetchTerminalDevices, fetchTerminalOverview, fetchTerminalSources } from '@/api/terminal';
import type { TerminalDeviceSummaryDto, TerminalOverviewDto, TerminalSourceDto } from '@/types/terminal';
import { onBeforeUnmount, onMounted, readonly, ref, shallowRef } from 'vue';

function normalizeTerminalLoadError(scope: string) {
  return `${scope}暂时无法获取，请稍后刷新重试。`;
}

function emptyOverview(): TerminalOverviewDto {
  return {
    generatedAt: '',
    onlineDevices: 0,
    staleDevices: 0,
    offlineDevices: 0,
    highRiskDevices: 0,
    abnormalPasswordModuleDevices: 0,
    fingerprintChangedDevices: 0,
    pendingClaimDevices: 0,
    peripheralAlertCount: 0,
    softwareChangeDevices: 0,
    sourceCount: 0
  };
}

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
      const [overviewResult, sourceResult, deviceResult] = await Promise.allSettled([
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

      const messages: string[] = [];

      if (overviewResult.status === 'fulfilled') {
        overview.value = overviewResult.value;
      } else {
        overview.value = emptyOverview();
        messages.push(normalizeTerminalLoadError('终端总览'));
      }

      if (sourceResult.status === 'fulfilled') {
        sources.value = sourceResult.value;
      } else {
        sources.value = [];
        messages.push(normalizeTerminalLoadError('终端来源'));
      }

      if (deviceResult.status === 'fulfilled') {
        devices.value = deviceResult.value.items;
        syncSelectedDevice(deviceResult.value.items);
      } else {
        devices.value = [];
        syncSelectedDevice([]);
        messages.push(normalizeTerminalLoadError('终端列表'));
      }

      if (messages.length === 3) {
        errorMessage.value = '当前终端数据暂时无法获取，请稍后刷新重试。';
      } else if (messages.length > 0) {
        errorMessage.value = messages[0];
      }
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
