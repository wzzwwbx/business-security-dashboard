import axios, { type AxiosError, type AxiosRequestConfig, type AxiosRequestHeaders, type Method } from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const configuredProxyTarget = import.meta.env.VITE_DEV_PROXY_TARGET || '';
const configuredUseProxy = import.meta.env.VITE_USE_PROXY === 'true';
const shouldUseDevDirectBackend = import.meta.env.DEV && !configuredUseProxy && configuredProxyTarget.length > 0;

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

function createClient(baseURL: string) {
  return axios.create({
    baseURL,
    timeout: defaultTimeout,
    withCredentials: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
}

const proxiedHttp = createClient(configuredApiBaseUrl);
const directHttp = shouldUseDevDirectBackend ? createClient(toAbsoluteApiBaseUrl(configuredProxyTarget, configuredApiBaseUrl)) : null;
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

async function requestApi<T>(method: Method, url: string, data?: unknown, config?: AxiosRequestConfig) {
  const requestHeaders: AxiosRequestHeaders = {
    ...(config?.headers as AxiosRequestHeaders | undefined)
  };

  const requestOnce = async (client: typeof proxiedHttp) => {
    const response = await client.request<T>({
      url,
      method,
      data,
      ...config,
      headers: requestHeaders
    });
    return ensureJsonLikePayload(url, response.data);
  };

  try {
    return await requestOnce(primaryHttp);
  } catch (error) {
    if (!secondaryHttp) {
      throw error;
    }

    if (import.meta.env.DEV) {
      console.warn(`[api] ${method.toUpperCase()} ${url} 直连后端失败，回退到 ${secondaryHttp.defaults.baseURL}`);
    }

    return requestOnce(secondaryHttp);
  }
}

export function getApiData<T>(url: string, config?: AxiosRequestConfig) {
  return requestApi<T>('get', url, undefined, config);
}

export function postApiData<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return requestApi<T>('post', url, data, config);
}

export function putApiData<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return requestApi<T>('put', url, data, config);
}

export function patchApiData<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return requestApi<T>('patch', url, data, config);
}

export function deleteApiData<T>(url: string, config?: AxiosRequestConfig) {
  return requestApi<T>('delete', url, undefined, config);
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
