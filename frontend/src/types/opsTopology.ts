import type { VisualTone } from '@/types/visualization';

export interface OpsSiteSummary {
  siteCode: string;
  name: string;
  countryName: string;
  city: string;
  status: VisualTone;
  deviceCount: number;
  onlineRate: number;
  alertCount: number;
  resourceUsage: number;
}

export interface OpsTopologyDevice {
  id: number;
  deviceCode: string;
  siteCode: string;
  name: string;
  deviceType: 'link' | 'firewall' | 'gateway' | 'switch' | 'server' | 'database' | 'storage' | 'collector';
  primaryIp: string;
  vendor: string;
  model: string;
  status: VisualTone;
  x: number;
  y: number;
  hostId?: number;
  alertCount: number;
  metrics: Array<{ label: string; value: string }>;
  policies: string[];
  audits: string[];
}

export interface OpsTopologyLink {
  from: number;
  to: number;
  status: VisualTone;
  latencyMs: number;
  bandwidth: string;
}

export interface OpsSiteTopology {
  site: OpsSiteSummary;
  devices: OpsTopologyDevice[];
  links: OpsTopologyLink[];
}
