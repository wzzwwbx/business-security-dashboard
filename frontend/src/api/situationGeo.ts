import { getApiData } from '@/api/http';
import { mockSituationGeoOverview } from '@/mocks/situationGeo';
import type { SituationGeoOverview } from '@/types/situationGeo';

interface ApiEnvelope<T> {
  code: number;
  data: T;
}

export async function fetchSituationGeoOverview(): Promise<SituationGeoOverview> {
  if (import.meta.env.VITE_DASHBOARD_DATA_SOURCE === 'mock') {
    return mockSituationGeoOverview;
  }

  try {
    const result = await getApiData<ApiEnvelope<SituationGeoOverview>>('/situation/overview/geo');
    return result.data;
  } catch {
    return mockSituationGeoOverview;
  }
}
