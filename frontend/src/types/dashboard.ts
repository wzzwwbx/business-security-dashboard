export type DashboardStatusTone = 'success' | 'warning' | 'danger' | 'info';
export type DashboardDataMode = 'api' | 'mock';
export type DashboardDataSource = 'integration' | 'mock';

export interface DashboardMenuItem {
  code: string;
  name: string;
  route: string;
  badge?: number;
}

export interface MetricCard {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  status?: DashboardStatusTone;
  description?: string;
}

export interface WidgetDefinition {
  code: string;
  title: string;
  type:
    | 'lineChart'
    | 'barChart'
    | 'pieChart'
    | 'radarChart'
    | 'gaugeChart'
    | 'statusGrid'
    | 'topology'
    | 'table'
    | 'timeline'
    | 'alertList'
    | 'recommendationList'
    | 'nodeMap';
  colSpan: number;
  minHeight?: number;
  tags?: string[];
  payload: Record<string, unknown>;
}

export interface DashboardPage {
  code: string;
  name: string;
  title: string;
  subtitle: string;
  location: string;
  lastUpdated: string;
  dataMode: DashboardDataMode;
  summaryMetrics: MetricCard[];
  widgets: WidgetDefinition[];
}

export interface DashboardRuntimeInfo {
  applicationName: string;
  activeProfile: string;
  dataSourceMode: 'mock' | 'mysql';
  apiBasePath: string;
  javaVersion: string;
  databaseEnabled: boolean;
  seedEnabled: boolean;
  status: string;
}
