import { getApiData } from '@/api/http';
import type {
  ApiEnvelope,
  TerminalDeviceDetailDto,
  TerminalDeviceListDto,
  TerminalEventDto,
  TerminalOverviewDto,
  TerminalPeripheralEventDto,
  TerminalSoftwareChangeDto,
  TerminalSourceDto,
  TerminalTimeseriesDto
} from '@/types/terminal';
import { getMockTerminalDetail, getMockTerminalEvents, getMockTerminalOverview, getMockTerminalPeripherals, getMockTerminalSoftware, getMockTerminalTimeseries, mockTerminalDevices, mockTerminalSources } from '@/mocks/terminalData';

const useMock = import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock';

export class TerminalApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TerminalApiError';
  }
}

function unwrap<T>(payload: ApiEnvelope<T> | T) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

function normalize(scope: string, error: unknown): never {
  if (error instanceof TerminalApiError) {
    throw error;
  }
  if (error instanceof Error) {
    throw new TerminalApiError(`${scope}失败：${error.message}`);
  }
  throw new TerminalApiError(`${scope}失败，请检查后端终端态势服务。`);
}

export async function fetchTerminalOverview(countryCode?: string) {
  if (useMock) return getMockTerminalOverview(countryCode);
  try {
    const data = await getApiData<ApiEnvelope<TerminalOverviewDto>>('/terminal/overview', { params: { countryCode } });
    return unwrap<TerminalOverviewDto>(data);
  } catch (error) {
    return normalize('终端总览加载', error);
  }
}

export async function fetchTerminalSources() {
  if (useMock) return mockTerminalSources;
  try {
    const data = await getApiData<ApiEnvelope<TerminalSourceDto[]>>('/terminal/sources');
    return unwrap<TerminalSourceDto[]>(data);
  } catch (error) {
    return normalize('终端来源加载', error);
  }
}

export async function fetchTerminalDevices(params?: {
  keyword?: string;
  status?: string;
  riskLevel?: string;
  ownershipStatus?: string;
  countryCode?: string;
  city?: string;
  siteCode?: string;
  page?: number;
  size?: number;
}) {
  if (useMock) {
    const items = mockTerminalDevices.filter((item) => !params?.countryCode || item.countryCode === params.countryCode);
    return { items, page: 1, size: items.length, total: items.length };
  }
  try {
    const data = await getApiData<ApiEnvelope<TerminalDeviceListDto>>('/terminal/devices', { params });
    return unwrap<TerminalDeviceListDto>(data);
  } catch (error) {
    return normalize('终端列表加载', error);
  }
}

export async function fetchTerminalDeviceDetail(deviceId: number) {
  if (useMock) return getMockTerminalDetail(deviceId);
  try {
    const data = await getApiData<ApiEnvelope<TerminalDeviceDetailDto>>(`/terminal/devices/${deviceId}`);
    return unwrap<TerminalDeviceDetailDto>(data);
  } catch (error) {
    return normalize('终端详情加载', error);
  }
}

export async function fetchTerminalDeviceEvents(deviceId: number, limit = 20) {
  if (useMock) return getMockTerminalEvents(deviceId).slice(0, limit);
  try {
    const data = await getApiData<ApiEnvelope<TerminalEventDto[]>>(`/terminal/devices/${deviceId}/events`, { params: { limit } });
    return unwrap<TerminalEventDto[]>(data);
  } catch (error) {
    return normalize('终端事件加载', error);
  }
}

export async function fetchTerminalSoftwareChanges(deviceId: number, limit = 10) {
  if (useMock) return getMockTerminalSoftware(deviceId).slice(0, limit);
  try {
    const data = await getApiData<ApiEnvelope<TerminalSoftwareChangeDto[]>>(`/terminal/devices/${deviceId}/software-changes`, { params: { limit } });
    return unwrap<TerminalSoftwareChangeDto[]>(data);
  } catch (error) {
    return normalize('软件变更加载', error);
  }
}

export async function fetchTerminalPeripheralEvents(deviceId: number, limit = 10) {
  if (useMock) return getMockTerminalPeripherals(deviceId).slice(0, limit);
  try {
    const data = await getApiData<ApiEnvelope<TerminalPeripheralEventDto[]>>(`/terminal/devices/${deviceId}/peripherals`, { params: { limit } });
    return unwrap<TerminalPeripheralEventDto[]>(data);
  } catch (error) {
    return normalize('外设记录加载', error);
  }
}

export async function fetchTerminalTimeseries(deviceId: number, range: '6h' | '24h' | '7d') {
  if (useMock) return { ...getMockTerminalTimeseries(), range };
  try {
    const data = await getApiData<ApiEnvelope<TerminalTimeseriesDto>>(`/terminal/devices/${deviceId}/timeseries`, { params: { range } });
    return unwrap<TerminalTimeseriesDto>(data);
  } catch (error) {
    return normalize('终端趋势加载', error);
  }
}
