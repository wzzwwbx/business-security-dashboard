import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const configuredProxyTarget = import.meta.env.VITE_DEV_PROXY_TARGET || '';
const shouldUseDevDirectBackend = import.meta.env.DEV && configuredProxyTarget.length > 0;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value: string) {
  return value.replace(/^\/+/, '');
}

function toAbsoluteApiBaseUrl(target: string, apiBaseUrl: string) {
  if (!target) {
    return apiBaseUrl;
  }

  return `${trimTrailingSlash(target)}/${trimLeadingSlash(apiBaseUrl)}`;
}

const defaultTimeout = import.meta.env.DEV ? 5000 : 10000;
const proxiedHttp = axios.create({
  baseURL: configuredApiBaseUrl,
  timeout: defaultTimeout
});

const directHttp = shouldUseDevDirectBackend
  ? axios.create({
      baseURL: toAbsoluteApiBaseUrl(configuredProxyTarget, configuredApiBaseUrl),
      timeout: defaultTimeout
    })
  : null;

const primaryHttp = directHttp ?? proxiedHttp;
const secondaryHttp = directHttp ? proxiedHttp : null;

function isHtmlDocumentPayload(data: unknown) {
  return typeof data === 'string' && /<html|<!doctype html/i.test(data);
}

export class UnexpectedHtmlResponseError extends Error {
  constructor(public readonly requestPath: string) {
    super(`接口 ${requestPath} 返回了 HTML 文档，疑似命中了前端壳或错误网关。`);
    this.name = 'UnexpectedHtmlResponseError';
  }
}

function ensureJsonLikePayload<T>(requestPath: string, data: T) {
  if (isHtmlDocumentPayload(data)) {
    throw new UnexpectedHtmlResponseError(requestPath);
  }

  return data;
}

export async function getApiData<T>(url: string, config?: AxiosRequestConfig) {
  const requestOnce = async (client: typeof proxiedHttp) => {
    const response = await client.get<T>(url, config);
    return ensureJsonLikePayload(url, response.data);
  };

  try {
    return await requestOnce(primaryHttp);
  } catch (error) {
    if (!secondaryHttp) {
      throw error;
    }

    if (import.meta.env.DEV) {
      console.warn(`[api] ${url} 直连后端失败，回退到 ${secondaryHttp.defaults.baseURL}`);
    }

    return requestOnce(secondaryHttp);
  }
}

export function isAxiosLikeError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

export function getConfiguredApiBaseUrl() {
  return configuredApiBaseUrl;
}

export function getDevDirectApiBaseUrl() {
  return directHttp?.defaults.baseURL ?? null;
}
