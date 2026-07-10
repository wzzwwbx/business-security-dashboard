import {
  fetchTerminalDeviceDetail,
  fetchTerminalDeviceEvents,
  fetchTerminalPeripheralEvents,
  fetchTerminalSoftwareChanges,
  fetchTerminalTimeseries
} from '@/api/terminal';
import type {
  TerminalDeviceDetailDto,
  TerminalEventDto,
  TerminalPeripheralEventDto,
  TerminalSoftwareChangeDto,
  TerminalTimeseriesDto
} from '@/types/terminal';
import { readonly, ref, shallowRef, watch } from 'vue';

export function useTerminalDetail(selectedDeviceId: Readonly<{ value: number | null }>) {
  const detail = shallowRef<TerminalDeviceDetailDto | null>(null);
  const timeseries = shallowRef<TerminalTimeseriesDto | null>(null);
  const events = ref<TerminalEventDto[]>([]);
  const softwareChanges = ref<TerminalSoftwareChangeDto[]>([]);
  const peripheralEvents = ref<TerminalPeripheralEventDto[]>([]);
  const loading = ref(false);
  const range = ref<'6h' | '24h' | '7d'>('24h');
  const errorMessage = ref('');

  const load = async () => {
    const deviceId = selectedDeviceId.value;
    if (!deviceId) {
      detail.value = null;
      timeseries.value = null;
      events.value = [];
      softwareChanges.value = [];
      peripheralEvents.value = [];
      return;
    }

    loading.value = true;
    try {
      errorMessage.value = '';
      const [detailResult, timeseriesResult, eventResult, softwareResult, peripheralResult] = await Promise.allSettled([
        fetchTerminalDeviceDetail(deviceId),
        fetchTerminalTimeseries(deviceId, range.value),
        fetchTerminalDeviceEvents(deviceId, 20),
        fetchTerminalSoftwareChanges(deviceId, 10),
        fetchTerminalPeripheralEvents(deviceId, 10)
      ]);

      const messages: string[] = [];

      if (detailResult.status === 'fulfilled') {
        detail.value = detailResult.value;
      } else {
        detail.value = null;
        messages.push(detailResult.reason instanceof Error ? detailResult.reason.message : '终端详情加载失败');
      }

      if (timeseriesResult.status === 'fulfilled') {
        timeseries.value = timeseriesResult.value;
      } else {
        timeseries.value = null;
      }

      events.value = eventResult.status === 'fulfilled' ? eventResult.value : [];
      softwareChanges.value = softwareResult.status === 'fulfilled' ? softwareResult.value : [];
      peripheralEvents.value = peripheralResult.status === 'fulfilled' ? peripheralResult.value : [];

      if (messages.length > 0) {
        errorMessage.value = messages[0];
      } else if (timeseriesResult.status === 'rejected' || eventResult.status === 'rejected' || softwareResult.status === 'rejected' || peripheralResult.status === 'rejected') {
        errorMessage.value = '部分终端补充数据加载失败。';
      }
    } finally {
      loading.value = false;
    }
  };

  watch(() => selectedDeviceId.value, () => {
    void load();
  }, { immediate: true });

  watch(range, () => {
    if (selectedDeviceId.value) {
      void load();
    }
  });

  return {
    detail: readonly(detail),
    timeseries: readonly(timeseries),
    events: readonly(events),
    softwareChanges: readonly(softwareChanges),
    peripheralEvents: readonly(peripheralEvents),
    loading: readonly(loading),
    range,
    errorMessage: readonly(errorMessage),
    reload: load
  };
}
