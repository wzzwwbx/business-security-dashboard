import { getMockMenu, getMockPage } from '@/mocks/dashboard';
import type { DashboardDataSource, DashboardMenuItem, DashboardPage, DashboardRuntimeInfo } from '@/types/dashboard';
import { getApiData, getConfiguredApiBaseUrl, getDevDirectApiBaseUrl, isAxiosLikeError } from '@/api/http';

const dataSource: DashboardDataSource = import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock' ? 'mock' : 'integration';

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
  if (isAxiosLikeError(error)) {
    const status = error.response?.status;
    const suffix = status ? `（HTTP ${status}）` : '（后端未启动或代理不可达）';
    return new DashboardApiError(`${scope}失败 ${suffix}`.trim(), dataSource, { cause: error });
  }

  return new DashboardApiError(`${scope}失败，请检查接口联调环境。`, dataSource, { cause: error });
}

function isDashboardMenuItem(value: unknown): value is DashboardMenuItem {
  return typeof value === 'object'
    && value !== null
    && typeof (value as DashboardMenuItem).code === 'string'
    && typeof (value as DashboardMenuItem).name === 'string'
    && typeof (value as DashboardMenuItem).route === 'string';
}

function isDashboardPage(value: unknown): value is DashboardPage {
  return typeof value === 'object'
    && value !== null
    && typeof (value as DashboardPage).code === 'string'
    && typeof (value as DashboardPage).name === 'string'
    && typeof (value as DashboardPage).title === 'string'
    && Array.isArray((value as DashboardPage).summaryMetrics)
    && Array.isArray((value as DashboardPage).widgets);
}

function isDashboardRuntimeInfo(value: unknown): value is DashboardRuntimeInfo {
  return typeof value === 'object'
    && value !== null
    && typeof (value as DashboardRuntimeInfo).applicationName === 'string'
    && typeof (value as DashboardRuntimeInfo).activeProfile === 'string'
    && typeof (value as DashboardRuntimeInfo).dataSourceMode === 'string'
    && typeof (value as DashboardRuntimeInfo).javaVersion === 'string';
}

function ensureMenuPayload(value: unknown) {
  if (Array.isArray(value) && value.every(isDashboardMenuItem)) {
    return value;
  }

  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).__BSS_LAST_MENU_PAYLOAD__ = value;
  }

  throw new DashboardApiError(
    `导航数据格式异常，请检查 ${getConfiguredApiBaseUrl()} 是否命中了真实后端${getDevDirectApiBaseUrl() ? '或 dev 直连回退地址' : ''}。`,
    dataSource
  );
}

function ensurePagePayload(value: unknown) {
  if (isDashboardPage(value)) {
    return value;
  }

  throw new DashboardApiError(`页面数据格式异常，请检查 ${getConfiguredApiBaseUrl()} 的返回内容。`, dataSource);
}

function ensureRuntimePayload(value: unknown) {
  if (isDashboardRuntimeInfo(value)) {
    return value;
  }

  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).__BSS_LAST_RUNTIME_PAYLOAD__ = value;
  }

  throw new DashboardApiError(`运行态信息格式异常，请检查 ${getConfiguredApiBaseUrl()} 的返回内容。`, dataSource);
}

export async function fetchMenu(): Promise<DashboardMenuItem[]> {
  if (dataSource === 'mock') {
    return getMockMenu();
  }

  try {
    const data = await getApiData<DashboardMenuItem[]>('/dashboard/pages');
    return ensureMenuPayload(data);
  } catch (error) {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__BSS_LAST_MENU_ERROR__ = error instanceof Error ? { name: error.name, message: error.message } : String(error);
    }

    throw normalizeApiError('导航数据加载', error);
  }
}

export async function fetchPage(pageCode: string): Promise<DashboardPage> {
  if (dataSource === 'mock') {
    return getMockPage(pageCode);
  }

  try {
    const data = await getApiData<DashboardPage>(`/dashboard/pages/${pageCode}`);
    return { ...ensurePagePayload(data), dataMode: 'api' };
  } catch (error) {
    throw normalizeApiError(`页面 ${pageCode} 数据加载`, error);
  }
}

export async function fetchRuntime(): Promise<DashboardRuntimeInfo | null> {
  if (dataSource === 'mock') {
    return null;
  }

  try {
    const data = await getApiData<DashboardRuntimeInfo>('/dashboard/runtime');
    return ensureRuntimePayload(data);
  } catch (error) {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__BSS_LAST_RUNTIME_ERROR__ = error instanceof Error ? { name: error.name, message: error.message } : String(error);
    }

    throw normalizeApiError('运行态信息加载', error);
  }
}
