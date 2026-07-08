export type VisualTone = 'success' | 'warning' | 'danger' | 'info';

export type AssetType =
  | 'domain'
  | 'service'
  | 'server'
  | 'database'
  | 'gateway'
  | 'source'
  | 'terminal'
  | 'mobile'
  | 'person'
  | 'alert'
  | 'policy'
  | 'cluster';

export interface VisualMetricItem {
  label: string;
  value: string;
  tone?: VisualTone;
}

export interface VisualBadgeItem {
  label: string;
  tone?: VisualTone;
}

export interface VisualFactItem {
  label: string;
  value: string;
}

export interface VisualTimelineItem {
  time?: string;
  title: string;
  description?: string;
  tone?: VisualTone;
}

export interface VisualNodeDetail {
  summary?: string;
  metrics?: VisualMetricItem[];
  facts?: VisualFactItem[];
  events?: VisualTimelineItem[];
}

export interface VisualAssetNode {
  id: string;
  name: string;
  assetType: AssetType;
  status: VisualTone;
  description?: string;
  x?: number;
  y?: number;
  groupKey?: string;
  count?: number;
  icon?: string;
  metrics?: VisualMetricItem[];
  badges?: VisualBadgeItem[];
  children?: VisualAssetNode[];
  drilldownKey?: string;
  detail?: VisualNodeDetail;
}

export interface VisualLink {
  id?: string;
  from: string;
  to: string;
  label?: string;
  tone?: VisualTone;
}

export interface VisualFilterOption {
  key: string;
  label: string;
  count?: number;
}

export interface MiniTrendItem {
  key: string;
  label: string;
  value: string;
  trend?: string;
  percent?: number;
  tone?: VisualTone;
}
