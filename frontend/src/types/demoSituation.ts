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

/** 路由跳的安全状态。 */
export type DemoHopStatus = 'normal' | 'degraded' | 'blocked';

/** 路由整体状态（含切换/回切状态机）。 */
export type DemoRouteStatus = 'normal' | 'attacked' | 'switching' | 'switched' | 'restoring';

/** 中继节点类型。 */
export type DemoHopType = 'ground' | 'satellite' | 'submarine' | 'terrestrial' | 'gateway';

/** 某跳被攻击时的绕行替代节点（分段切换：起点、终点不变，中间节点绕行）。 */
export interface DemoBypassNode {
  name: string;
  type: DemoHopType;
  latitude: number;
  longitude: number;
  latencyMs: number;
  packetLossPct: number;
  throughputMbps: number;
  note: string;
}

/** 通信线路中的一跳（中继节点间的一段链路）。 */
export interface DemoRouteHop {
  id: string;
  /** 中继节点名称，如“华南中继 R1”“卫-1 印度洋中继星”。 */
  name: string;
  type: DemoHopType;
  /** 本跳终点坐标（起点为上一跳终点 / 北京接入中心）。 */
  longitude: number;
  latitude: number;
  latencyMs: number;
  packetLossPct: number;
  throughputMbps: number;
  status: DemoHopStatus;
  note: string;
  /** 本跳被攻击时的绕行替代节点（起点=上一跳终点，终点=本跳终点不变）。 */
  bypass?: DemoBypassNode[];
}

/** 一条完整业务路由：北京接入中心 → 多跳中继 → 站点。 */
export interface DemoRoute {
  id: string;
  /** 目标站点国家代码。 */
  countryCode: string;
  /** 路由名称，如“北京 → 阿布扎比”。 */
  name: string;
  /** 主路由 / 备用路由。 */
  kind: 'primary' | 'backup';
  /** 多跳序列（不含北京起点）。 */
  hops: DemoRouteHop[];
  /** 总时延（ms）。 */
  latencyMs: number;
  status: DemoRouteStatus;
  /** 最近一次攻击检测说明（attacked 时）。 */
  attackNote?: string;
  /** 当前绕行的跳索引（分段切换时，该跳绕行至 bypass 节点）。 */
  bypassedHopIndex?: number;
}

/** 智能分析生成的线路切换策略（已下发）。 */
export interface DemoRouteSwitch {
  id: string;
  countryCode: string;
  /** 切换原因（智能分析结论）。 */
  reason: string;
  /** 原路由。 */
  fromRouteId: string;
  /** 切换后的目标路由。 */
  toRouteId: string;
  /** 策略下发时间（固定 ISO）。 */
  issuedAt: string;
  status: 'issued' | 'applied';
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
  /** 多跳业务路由（主路由 + 备用路由）。 */
  routes: DemoRoute[];
  /** 智能分析下发的线路切换策略记录。 */
  routeSwitches: DemoRouteSwitch[];
}
