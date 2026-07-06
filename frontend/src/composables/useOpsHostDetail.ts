import { fetchOpsAlerts, fetchOpsHostDetail, fetchOpsProcesses, fetchOpsTimeseries } from '@/api/ops';
import type { OpsAlertDto, OpsHostDetailDto, OpsProcessDto, OpsTimeseriesDto } from '@/types/ops';
import { readonly, ref, shallowRef, watch } from 'vue';

export function useOpsHostDetail(selectedHostId: Readonly<{ value: number | null }>) {
  const detail = shallowRef<OpsHostDetailDto | null>(null);
  const timeseries = shallowRef<OpsTimeseriesDto | null>(null);
  const processes = ref<OpsProcessDto[]>([]);
  const alerts = ref<OpsAlertDto[]>([]);
  const loading = ref(false);
  const range = ref<'1h' | '6h' | '24h'>('6h');
  const errorMessage = ref('');

  const load = async () => {
    const hostId = selectedHostId.value;
    if (!hostId) {
      detail.value = null;
      timeseries.value = null;
      processes.value = [];
      alerts.value = [];
      return;
    }

    loading.value = true;
    try {
      errorMessage.value = '';
      const [detailData, timeseriesData, processData, alertData] = await Promise.all([
        fetchOpsHostDetail(hostId),
        fetchOpsTimeseries(hostId, range.value),
        fetchOpsProcesses(hostId),
        fetchOpsAlerts(hostId, 20)
      ]);
      detail.value = detailData;
      timeseries.value = timeseriesData;
      processes.value = processData;
      alerts.value = alertData;
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '主机详情加载失败';
    } finally {
      loading.value = false;
    }
  };

  watch(() => selectedHostId.value, () => {
    void load();
  }, { immediate: true });

  watch(range, () => {
    if (selectedHostId.value) {
      void load();
    }
  });

  return {
    detail: readonly(detail),
    timeseries: readonly(timeseries),
    processes: readonly(processes),
    alerts: readonly(alerts),
    loading: readonly(loading),
    range,
    errorMessage: readonly(errorMessage),
    reload: load
  };
}
