import type {
  ApiEnvelope,
  OpsAlertDto,
  OpsHostDetailDto,
  OpsHostListDto,
  OpsOverviewDto,
  OpsProcessDto,
  OpsSourceDto,
  OpsTimeseriesDto
} from '@/types/ops';
import { getApiData, isAxiosLikeError } from '@/api/http';
import { getMockOpsTopology } from '@/mocks/opsTopology';

const useMock = import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock';
const mockTopology = getMockOpsTopology('beijing-core');
const mockServerDevices = mockTopology.devices.filter((device) => device.deviceType === 'server');

export class OpsApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'OpsApiError';
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === 'object'
    && value !== null
    && typeof (value as ApiEnvelope<T>).code === 'number'
    && typeof (value as ApiEnvelope<T>).message === 'string'
    && 'data' in (value as ApiEnvelope<T>);
}

function unwrap<T>(envelope: unknown): T {
  if (!isApiEnvelope<T>(envelope)) {
    throw new OpsApiError('运维接口返回格式异常，请确认请求已命中后端 /api/ops 服务。');
  }

  if (envelope.code !== 0) {
    throw new OpsApiError(envelope.message);
  }

  return envelope.data;
}

function normalize(scope: string, error: unknown): never {
  if (isAxiosLikeError(error)) {
    const status = error.response?.status;
    throw new OpsApiError(status ? `${scope}失败（HTTP ${status}）` : `${scope}失败（后端未启动或代理不可达）`, status);
  }

  if (error instanceof OpsApiError) {
    throw error;
  }

  throw new OpsApiError(`${scope}失败，请检查后端运维态势服务。`);
}

export async function fetchOpsOverview() {
  if (useMock) return { generatedAt: new Date().toISOString(), onlineHosts: 168, staleHosts: 2, offlineHosts: 3, openAlerts: 21, sourceCount: 4, averageCpuUsagePct: 56.4, averageMemoryUsagePct: 63.8 };
  try {
    const data = await getApiData<ApiEnvelope<OpsOverviewDto>>('/ops/overview');
    return unwrap<OpsOverviewDto>(data);
  } catch (error) {
    return normalize('运维总览加载', error);
  }
}

export async function fetchOpsSources() {
  if (useMock) return [{ sourceType: 'EXTERNAL_API', sourceSystem: '基础设施监控平台', enabled: true, status: 'HEALTHY', hostCount: mockServerDevices.length, lastSeenAt: new Date().toISOString() }];
  try {
    const data = await getApiData<ApiEnvelope<OpsSourceDto[]>>('/ops/sources');
    return unwrap<OpsSourceDto[]>(data);
  } catch (error) {
    return normalize('数据来源加载', error);
  }
}

export async function fetchOpsHosts(params?: { keyword?: string; status?: string; page?: number; size?: number }) {
  if (useMock) {
    const items = mockServerDevices.map((device, index) => ({ id: device.hostId ?? device.id, hostCode: device.deviceCode, hostname: device.deviceCode.toLowerCase(), displayName: device.name, primaryIp: device.primaryIp, status: device.status === 'warning' ? 'STALE' : 'ONLINE', sourceType: 'EXTERNAL_API', sourceSystem: 'ops-topology-demo', cpuUsagePct: Number.parseFloat(device.metrics[0]?.value ?? '42'), memoryUsagePct: Number.parseFloat(device.metrics[1]?.value ?? '55'), load1: 1.2 + index, diskUsagePct: 58 + index * 9, openAlertCount: device.alertCount, lastObservedAt: new Date().toISOString() }));
    return { items, page: 1, size: items.length, total: items.length };
  }
  try {
    const data = await getApiData<ApiEnvelope<OpsHostListDto>>('/ops/hosts', { params });
    return unwrap<OpsHostListDto>(data);
  } catch (error) {
    return normalize('主机列表加载', error);
  }
}

export async function fetchOpsHostDetail(hostId: number) {
  if (useMock) {
    const device = mockServerDevices.find((item) => item.hostId === hostId) ?? mockServerDevices[0];
    return { id: hostId, hostCode: device.deviceCode, hostname: device.deviceCode.toLowerCase(), displayName: device.name, primaryIp: device.primaryIp, status: device.status === 'warning' ? 'STALE' : 'ONLINE', sourceType: 'EXTERNAL_API', sourceSystem: 'ops-topology-demo', osName: 'Linux', kernelVersion: '6.1.0', arch: 'aarch64', cpuCores: 16, memoryTotalBytes: 34359738368, lastObservedAt: new Date().toISOString(), latestSnapshot: { cpuUsagePct: Number.parseFloat(device.metrics[0]?.value ?? '42'), memoryUsagePct: Number.parseFloat(device.metrics[1]?.value ?? '55'), load1: 2.1, load5: 1.8, load15: 1.4, memUsedBytes: 17179869184, memAvailableBytes: 17179869184, swapUsedBytes: 0, diskUsedBytes: 322122547200, diskTotalBytes: 536870912000, diskUsagePct: 60, tcpEstablishedCount: 186, processCount: 142 }, bindings: [{ sourceSystem: '机房拓扑', externalAssetId: device.deviceCode, externalHostName: device.name, bindingStatus: 'ACTIVE' }] };
  }
  try {
    const data = await getApiData<ApiEnvelope<OpsHostDetailDto>>(`/ops/hosts/${hostId}`);
    return unwrap<OpsHostDetailDto>(data);
  } catch (error) {
    return normalize('主机详情加载', error);
  }
}

export async function fetchOpsTimeseries(hostId: number, range: '1h' | '6h' | '24h') {
  if (useMock) return { range, points: Array.from({ length: 12 }, (_, index) => ({ observedAt: new Date(Date.now() - index * 1800000).toISOString(), cpuUsagePct: 42 + index * 2, memoryUsagePct: 58 + index, diskUsagePct: 61, load1: 1.2 + index / 10, rxBytesPerSec: 820000 + index * 12000, txBytesPerSec: 420000 + index * 8000 })) };
  try {
    const data = await getApiData<ApiEnvelope<OpsTimeseriesDto>>(`/ops/hosts/${hostId}/timeseries`, { params: { range } });
    return unwrap<OpsTimeseriesDto>(data);
  } catch (error) {
    return normalize('主机趋势加载', error);
  }
}

export async function fetchOpsProcesses(hostId: number) {
  if (useMock) return [{ pid: 1032, processName: 'java', commandLine: 'java -jar core-service.jar', cpuUsagePct: 18.6, memoryRssBytes: 662422016, state: 'R', whitelisted: true, observedAt: new Date().toISOString() }, { pid: 892, processName: 'nginx', commandLine: 'nginx: master process', cpuUsagePct: 4.1, memoryRssBytes: 125829120, state: 'S', whitelisted: true, observedAt: new Date().toISOString() }];
  try {
    const data = await getApiData<ApiEnvelope<OpsProcessDto[]>>(`/ops/hosts/${hostId}/processes`);
    return unwrap<OpsProcessDto[]>(data);
  } catch (error) {
    return normalize('进程列表加载', error);
  }
}

export async function fetchOpsAlerts(hostId?: number, limit = 20) {
  if (useMock) return [{ id: 1, hostId: hostId ?? 1, hostName: '密信应用服务器', primaryIp: '10.55.19.22', alertType: 'RESOURCE', severity: 'WARNING', status: 'OPEN', title: 'CPU 使用率持续高位', detail: '连续 10 分钟超过 80%', firstSeenAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), resolvedAt: null }].slice(0, limit);
  try {
    const data = await getApiData<ApiEnvelope<OpsAlertDto[]>>('/ops/alerts', { params: { hostId, limit } });
    return unwrap<OpsAlertDto[]>(data);
  } catch (error) {
    return normalize('告警列表加载', error);
  }
}
