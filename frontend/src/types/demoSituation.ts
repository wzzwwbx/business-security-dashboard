import type { SituationTone } from '@/types/situation';

export type DemoSuiteStatus = 'healthy' | 'degraded' | 'offline';
export type DemoEquipmentType = 'pad' | 'crypto-box' | 'key' | 'message-app' | 'signing-app' | 'satellite';

export interface DemoActivity {
  id: string;
  type: 'login' | 'logout' | 'message' | 'file' | 'signing' | 'security';
  title: string;
  detail: string;
  minutesAgo: number;
  tone: SituationTone;
  /** 关联人员编号，用于安全事件与人员联动。 */
  personId?: string;
}

export interface DemoEquipment {
  type: DemoEquipmentType;
  label: string;
  code: string;
  status: 'online' | 'ready' | 'connected' | 'logged-in' | 'available' | 'degraded' | 'offline';
  statusLabel: string;
  version: string;
  detail: string;
  tone: SituationTone;
}

export interface DemoMessageMetrics {
  login: number;
  logout: number;
  sentMessages: number;
  receivedMessages: number;
  sentFiles: number;
  receivedFiles: number;
}

export interface DemoSigningMetrics {
  received: number;
  processed: number;
  pending: number;
  exception: number;
}

export interface DemoPerson {
  id: string;
  code: string;
  name: string;
  department: string;
  countryCode: string;
  countryName: string;
  city: string;
  online: boolean;
  suiteStatus: DemoSuiteStatus;
  suiteStatusLabel: string;
  lastActiveMinutes: number;
  primaryIp: string;
  equipment: DemoEquipment[];
  message: DemoMessageMetrics;
  signing: DemoSigningMetrics;
  activities: DemoActivity[];
}

export interface DemoRegion {
  countryCode: string;
  countryName: string;
  city: string;
  longitude: number;
  latitude: number;
  people: DemoPerson[];
  trafficGb: number;
  uplinkMbps: number;
  downlinkMbps: number;
}

export interface DemoBusinessTrend {
  times: string[];
  messageSent: number[];
  messageReceived: number[];
  fileCount: number[];
  signingReceived: number[];
  signingProcessed: number[];
  signingPending: number[];
}

export interface DemoLinkSnapshot {
  capacityMbps: number;
  uplinkMbps: number;
  downlinkMbps: number;
  utilization: number;
  trafficGb: number;
  peakMbps: number;
  peakUtilization: number;
  threshold: number;
  times: string[];
  uplinkTrend: number[];
  downlinkTrend: number[];
}

export interface DemoSituationScenario {
  generatedAt: string;
  people: DemoPerson[];
  regions: DemoRegion[];
  link: DemoLinkSnapshot;
  businessTrend: DemoBusinessTrend;
  securityEvents: DemoActivity[];
}
