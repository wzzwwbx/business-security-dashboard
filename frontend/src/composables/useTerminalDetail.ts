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
      const [detailData, timeseriesData, eventData, softwareData, peripheralData] = await Promise.all([
        fetchTerminalDeviceDetail(deviceId),
        fetchTerminalTimeseries(deviceId, range.value),
        fetchTerminalDeviceEvents(deviceId, 20),
        fetchTerminalSoftwareChanges(deviceId, 10),
        fetchTerminalPeripheralEvents(deviceId, 10)
      ]);
      detail.value = detailData;
      timeseries.value = timeseriesData;
      events.value = eventData;
      softwareChanges.value = softwareData;
      peripheralEvents.value = peripheralData;
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '终端详情加载失败';
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
