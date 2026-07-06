import axios from 'axios';
import { getMockMenu, getMockPage } from '@/mocks/dashboard';
import type { DashboardDataSource, DashboardMenuItem, DashboardPage, DashboardRuntimeInfo } from '@/types/dashboard';

const dataSource: DashboardDataSource = import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock' ? 'mock' : 'integration';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const apiTimeout = import.meta.env.DEV ? 4000 : 10000;

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: apiTimeout
});

export class DashboardApiError extends Error {
  source: DashboardDataSource;

  constructor(message: string, source: DashboardDataSource, options?: { cause?: unknown }) {
    super(message);
    this.name = 'DashboardApiError';
    this.source = source;

    if (options?.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        configurable: true
      });
    }
  }
}

export function getDashboardDataSource(): DashboardDataSource {
  return dataSource;
}

function normalizeApiError(scope: string, error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const suffix = status ? `（HTTP ${status}）` : '（后端未启动或代理不可达）';
    return new DashboardApiError(`${scope}失败 ${suffix}`.trim(), dataSource, { cause: error });
  }

  return new DashboardApiError(`${scope}失败，请检查接口联调环境。`, dataSource, { cause: error });
}

export async function fetchMenu(): Promise<DashboardMenuItem[]> {
  if (dataSource === 'mock') {
    return getMockMenu();
  }

  try {
    const { data } = await http.get<DashboardMenuItem[]>('/dashboard/pages');
    return data;
  } catch (error) {
    throw normalizeApiError('导航数据加载', error);
  }
}

export async function fetchPage(pageCode: string): Promise<DashboardPage> {
  if (dataSource === 'mock') {
    return getMockPage(pageCode);
  }

  try {
    const { data } = await http.get<DashboardPage>(`/dashboard/pages/${pageCode}`);
    return { ...data, dataMode: 'api' };
  } catch (error) {
    throw normalizeApiError(`页面 ${pageCode} 数据加载`, error);
  }
}

export async function fetchRuntime(): Promise<DashboardRuntimeInfo | null> {
  if (dataSource === 'mock') {
    return null;
  }

  try {
    const { data } = await http.get<DashboardRuntimeInfo>('/dashboard/runtime');
    return data;
  } catch (error) {
    throw normalizeApiError('运行态信息加载', error);
  }
}
