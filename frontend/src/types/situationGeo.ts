import type { SituationTone } from '@/types/situation';

export interface SituationSitePoint {
  kind: 'site';
  siteCode: string;
  name: string;
  countryCode: string;
  countryName: string;
  city: string;
  longitude: number;
  latitude: number;
  status: SituationTone;
  deviceCount: number;
  onlineRate: number;
  alertCount: number;
  resourceUsage: number;
}

export interface SituationTerminalRegion {
  kind: 'terminal-region';
  countryCode: string;
  countryName: string;
  longitude: number;
  latitude: number;
  total: number;
  online: number;
  offline: number;
  warning: number;
  danger: number;
  status: SituationTone;
}

export interface SituationDomainSummary {
  code: 'security' | 'business' | 'terminal' | 'ops';
  name: string;
  status: SituationTone;
  metrics: Array<{ label: string; value: string }>;
}

export interface SituationGeoOverview {
  generatedAt: string;
  sites: SituationSitePoint[];
  terminalRegions: SituationTerminalRegion[];
  domains: SituationDomainSummary[];
}

export type SituationGeoSelection = SituationSitePoint | SituationTerminalRegion;
