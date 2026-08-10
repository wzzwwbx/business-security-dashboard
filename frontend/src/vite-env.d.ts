/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DASHBOARD_DATA_SOURCE?: 'mock' | 'integration';
  readonly VITE_PREVIEW_AUTH?: 'preview';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_PROXY?: 'true' | 'false';
  readonly VITE_DEV_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
