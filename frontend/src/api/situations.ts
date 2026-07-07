import { getMockSituationPage } from '@/mocks/situations';
import type { SituationDataMode, SituationPage, SituationPageCode } from '@/types/situation';

export type SituationDataSource = 'mock';

export class SituationApiError extends Error {
  constructor(message: string, public readonly source: SituationDataSource) {
    super(message);
    this.name = 'SituationApiError';
  }
}

export function getSituationDataSource(): SituationDataSource {
  return 'mock';
}

export function getSituationModeLabel(mode: SituationDataMode) {
  return mode === 'mock' ? '经验建模' : '规划接入';
}

export async function fetchSituationPage(pageCode: SituationPageCode): Promise<SituationPage> {
  try {
    return await getMockSituationPage(pageCode);
  } catch (error) {
    throw new SituationApiError(
      error instanceof Error ? error.message : '态势页面数据加载失败，请检查前端 mock 数据。',
      'mock'
    );
  }
}
