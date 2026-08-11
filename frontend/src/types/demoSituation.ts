import type { SituationTone } from '@/types/situation';

export type DemoSuiteStatus = 'healthy' | 'degraded' | 'offline';
export type DemoEquipmentType = 'pad' | 'crypto-box' | 'key' | 'message-app' | 'signing-app' | 'satellite';

/** 区域与北京之间的接入信道类型：卫星链路或地面链路。 */
export type DemoLinkType = 'satellite' | 'ground';
export type DemoSecurityLevel = 'high' | 'medium' | 'notice';

/** 收发关系：本用户与另一名用户之间的消息往来计数。 */
export interface DemoMessageRelation {
  /** 关联人员编号。 */
  personId: string;
  /** 往来消息条数。 */
  count: number;
}

export interface DemoActivity {
  id: string;
  type: 'login' | 'logout' | 'message' | 'file' | 'signing' | 'security';
  title: string;
  detail: string;
  minutesAgo: number;
  tone: SituationTone;
  /** 安全事件的固定发生时间与告警等级；普通业务活动可不提供。 */
  occurredAt?: string;
  securityLevel?: DemoSecurityLevel;
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
  /** 主要接收对象：本用户发送给谁最多（A→B 发送关系）。 */
  topRecipients: DemoMessageRelation[];
  /** 主要发送来源：谁发给本用户最多。 */
  topSenders: DemoMessageRelation[];
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
  /** 与北京接入中心之间的信道类型。 */
  linkType: DemoLinkType;
  /** 卫星链路时对应的卫星标识（ground 时为空）。 */
  satelliteId?: string;
}

/** 通信卫星节点（接入态势中的中继点）。 */
export interface DemoSatellite {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  status: SituationTone;
  bandwidthMbps: number;
  utilization: number;
  note: string;
}

/** 业务系统流量快照：各业务系统当前吞吐、累计流量与成功率。 */
export interface DemoSystemTrafficItem {
  code: string;
  name: string;
  throughputMbps: number;
  trafficGb: number;
  peakMbps: number;
  successRate: number;
  tone: SituationTone;
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
  /** 通信卫星中继节点。 */
  satellites: DemoSatellite[];
  /** 各业务系统流量（业务态势·系统流量专题）。 */
  systemTraffic: {
    times: string[];
    series: Array<{ code: string; name: string; data: number[] }>;
    snapshot: DemoSystemTrafficItem[];
  };
}
