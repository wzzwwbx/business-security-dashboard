import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

const exposedClientEnvKeys = [
  'VITE_DASHBOARD_DATA_SOURCE',
  'VITE_API_BASE_URL',
  'VITE_USE_PROXY',
  'VITE_DEV_PROXY_TARGET'
] as const;

export default defineConfig(({ mode }) => {
  const lifecycleEvent = process.env.npm_lifecycle_event || '';
  const envMode = mode === 'development' ? (lifecycleEvent.includes('mock') ? 'mock' : 'integration') : mode;
  const env = loadEnv(envMode, process.cwd(), '');
  const useProxy = env.VITE_USE_PROXY === 'true';
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080';
  const clientEnvDefine = Object.fromEntries(
    exposedClientEnvKeys.map((key) => [`import.meta.env.${key}`, JSON.stringify(env[key] ?? '')])
  );

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    define: clientEnvDefine,
    optimizeDeps: {
      force: true,
      include: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers']
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: useProxy
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true
            }
          }
        : undefined
    }
  };
});
