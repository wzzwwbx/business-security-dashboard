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
  try {
    const data = await getApiData<ApiEnvelope<OpsOverviewDto>>('/ops/overview');
    return unwrap<OpsOverviewDto>(data);
  } catch (error) {
    return normalize('运维总览加载', error);
  }
}

export async function fetchOpsSources() {
  try {
    const data = await getApiData<ApiEnvelope<OpsSourceDto[]>>('/ops/sources');
    return unwrap<OpsSourceDto[]>(data);
  } catch (error) {
    return normalize('数据来源加载', error);
  }
}

export async function fetchOpsHosts(params?: { keyword?: string; status?: string; page?: number; size?: number }) {
  try {
    const data = await getApiData<ApiEnvelope<OpsHostListDto>>('/ops/hosts', { params });
    return unwrap<OpsHostListDto>(data);
  } catch (error) {
    return normalize('主机列表加载', error);
  }
}

export async function fetchOpsHostDetail(hostId: number) {
  try {
    const data = await getApiData<ApiEnvelope<OpsHostDetailDto>>(`/ops/hosts/${hostId}`);
    return unwrap<OpsHostDetailDto>(data);
  } catch (error) {
    return normalize('主机详情加载', error);
  }
}

export async function fetchOpsTimeseries(hostId: number, range: '1h' | '6h' | '24h') {
  try {
    const data = await getApiData<ApiEnvelope<OpsTimeseriesDto>>(`/ops/hosts/${hostId}/timeseries`, { params: { range } });
    return unwrap<OpsTimeseriesDto>(data);
  } catch (error) {
    return normalize('主机趋势加载', error);
  }
}

export async function fetchOpsProcesses(hostId: number) {
  try {
    const data = await getApiData<ApiEnvelope<OpsProcessDto[]>>(`/ops/hosts/${hostId}/processes`);
    return unwrap<OpsProcessDto[]>(data);
  } catch (error) {
    return normalize('进程列表加载', error);
  }
}

export async function fetchOpsAlerts(hostId?: number, limit = 20) {
  try {
    const data = await getApiData<ApiEnvelope<OpsAlertDto[]>>('/ops/alerts', { params: { hostId, limit } });
    return unwrap<OpsAlertDto[]>(data);
  } catch (error) {
    return normalize('告警列表加载', error);
  }
}
