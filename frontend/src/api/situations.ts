import { getApiData, isAxiosLikeError } from '@/api/http';
import { getMockSituationPage } from '@/mocks/situations';
import type {
  SituationDataMode,
  SituationPage,
  SituationPageCode,
  SituationPageResult,
  SituationResolvedSource
} from '@/types/situation';

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: string;
}

const preferredSource: SituationResolvedSource = import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock' ? 'mock' : 'integration';

export class SituationApiError extends Error {
  constructor(message: string, public readonly source: SituationResolvedSource) {
    super(message);
    this.name = 'SituationApiError';
  }
}

export function getSituationDataSource(): SituationResolvedSource {
  return preferredSource;
}

export function getSituationModeLabel(mode: SituationDataMode) {
  return mode === 'mock' ? '经验建模' : '规划接入';
}

export function getSituationSourceLabel(source: SituationResolvedSource, degraded = false) {
  if (source === 'integration') {
    return '接口联调';
  }

  return degraded ? '演示回退' : '本地演示';
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === 'object'
    && value !== null
    && typeof (value as ApiEnvelope<T>).code === 'number'
    && typeof (value as ApiEnvelope<T>).message === 'string'
    && 'data' in (value as ApiEnvelope<T>);
}

function isSituationPage(value: unknown): value is SituationPage {
  return typeof value === 'object'
    && value !== null
    && typeof (value as SituationPage).code === 'string'
    && typeof (value as SituationPage).title === 'string'
    && Array.isArray((value as SituationPage).kpis)
    && Array.isArray((value as SituationPage).highlights)
    && Array.isArray((value as SituationPage).sections);
}

function unwrapPage(envelope: unknown): SituationPage {
  if (!isApiEnvelope<SituationPage>(envelope)) {
    throw new SituationApiError('态势接口返回格式异常，请确认请求已命中后端 /api/situation 服务。', preferredSource);
  }

  if (envelope.code !== 0) {
    throw new SituationApiError(envelope.message || '态势接口返回失败状态。', preferredSource);
  }

  if (!isSituationPage(envelope.data)) {
    throw new SituationApiError('态势接口数据结构异常，请检查后端 Situation DTO。', preferredSource);
  }

  return envelope.data;
}

function normalize(scope: string, error: unknown) {
  if (error instanceof SituationApiError) {
    return error;
  }

  if (isAxiosLikeError(error)) {
    const status = error.response?.status;
    return new SituationApiError(status ? `${scope}失败（HTTP ${status}）` : `${scope}失败（后端未启动或代理不可达）`, preferredSource);
  }

  return new SituationApiError(`${scope}失败，请检查前后端联调环境。`, preferredSource);
}

async function resolveMock(pageCode: SituationPageCode, warningMessage?: string): Promise<SituationPageResult> {
  try {
    return {
      page: await getMockSituationPage(pageCode),
      source: 'mock',
      warningMessage
    };
  } catch (error) {
    throw new SituationApiError(
      error instanceof Error ? error.message : '态势页面数据加载失败，请检查前端 mock 数据。',
      'mock'
    );
  }
}

export async function fetchSituationPage(pageCode: SituationPageCode): Promise<SituationPageResult> {
  if (preferredSource === 'mock') {
    return resolveMock(pageCode);
  }

  try {
    const data = await getApiData<ApiEnvelope<SituationPage>>(`/situation/${pageCode}`);
    const apiPage = unwrapPage(data);
    const demoPage = await getMockSituationPage(pageCode);

    return {
      // The current delivery is a leadership demo. Keep the page shell connected to
      // the integration endpoint while rendering the complete local domain dataset.
      page: {
        ...apiPage,
        kpis: demoPage.kpis,
        highlights: demoPage.highlights,
        sections: demoPage.sections
      },
      source: 'integration',
      warningMessage: '接口已连通，当前展示完整的专题演示数据。'
    };
  } catch (error) {
    const normalized = normalize('态势页面加载', error);
    return resolveMock(pageCode, `${normalized.message}，已自动回退到本地经验数据。`);
  }
}
