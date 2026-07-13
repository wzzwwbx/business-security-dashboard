import { getApiData } from '@/api/http';
import { getMockOpsTopology, mockOpsSites } from '@/mocks/opsTopology';
import type { OpsSiteSummary, OpsSiteTopology, OpsTopologyDevice } from '@/types/opsTopology';

interface ApiEnvelope<T> { data: T }

async function withFallback<T>(request: () => Promise<ApiEnvelope<T>>, fallback: T) {
  if (import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock') return fallback;
  try { return (await request()).data; } catch { return fallback; }
}

export function fetchOpsSites(): Promise<OpsSiteSummary[]> {
  return withFallback(() => getApiData('/ops/sites'), mockOpsSites);
}

export function fetchOpsSiteTopology(siteCode: string): Promise<OpsSiteTopology> {
  return withFallback(() => getApiData(`/ops/sites/${siteCode}/topology`), getMockOpsTopology(siteCode));
}

export function fetchOpsTopologyDevice(deviceId: number, siteCode: string): Promise<OpsTopologyDevice | null> {
  const fallback = getMockOpsTopology(siteCode).devices.find((item) => item.id === deviceId) ?? null;
  return withFallback(() => getApiData(`/ops/devices/${deviceId}`), fallback);
}
