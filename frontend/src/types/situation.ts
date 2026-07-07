export type SituationTone = 'success' | 'warning' | 'danger' | 'info';
export type SituationPageCode = 'overview' | 'security' | 'business' | 'terminal';
export type SituationDataMode = 'mock' | 'planned';
export type SituationResolvedSource = 'integration' | 'mock';

export interface SituationHeroTag {
  label: string;
  value: string;
  tone?: SituationTone;
}

export interface SituationActionItem {
  label: string;
  detail: string;
  tone: SituationTone;
}

export interface SituationKpi {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  description: string;
  tone: SituationTone;
}

export interface SituationHighlight {
  title: string;
  description: string;
  metric: string;
  meta: string;
  tone: SituationTone;
}

export interface SituationMatrixItem {
  name: string;
  owner: string;
  score: string;
  status: string;
  trend: string;
  source: string;
  description: string;
  tone: SituationTone;
}

export interface SituationSignalItem {
  label: string;
  title: string;
  description: string;
  meta: string;
  tone: SituationTone;
}

export interface SituationSourceItem {
  source: string;
  status: string;
  latency: string;
  coverage: string;
  note: string;
  tone: SituationTone;
}

export interface SituationCardItem {
  name: string;
  summary: string;
  metric: string;
  detail: string;
  tone: SituationTone;
  progress?: number;
}

export interface SituationTableColumn {
  key: string;
  label: string;
  tone?: boolean;
}

export interface SituationTableRow {
  cells: Record<string, string>;
  tones?: Record<string, SituationTone>;
}

export interface SituationTimelineItem {
  time: string;
  title: string;
  description: string;
  actor: string;
  tone: SituationTone;
}

interface SituationSectionBase {
  code: string;
  title: string;
  description?: string;
  tags?: string[];
  colSpan: number;
  minHeight?: number;
}

export interface SituationMatrixSection extends SituationSectionBase {
  kind: 'matrix';
  items: SituationMatrixItem[];
}

export interface SituationChartSection extends SituationSectionBase {
  kind: 'chart';
  option: Record<string, unknown>;
  footer?: string;
}

export interface SituationSignalsSection extends SituationSectionBase {
  kind: 'signals';
  items: SituationSignalItem[];
}

export interface SituationSourcesSection extends SituationSectionBase {
  kind: 'sources';
  items: SituationSourceItem[];
}

export interface SituationCardsSection extends SituationSectionBase {
  kind: 'cards';
  items: SituationCardItem[];
}

export interface SituationTableSection extends SituationSectionBase {
  kind: 'table';
  columns: SituationTableColumn[];
  rows: SituationTableRow[];
}

export interface SituationTimelineSection extends SituationSectionBase {
  kind: 'timeline';
  items: SituationTimelineItem[];
}

export type SituationSection =
  | SituationMatrixSection
  | SituationChartSection
  | SituationSignalsSection
  | SituationSourcesSection
  | SituationCardsSection
  | SituationTableSection
  | SituationTimelineSection;

export interface SituationPage {
  code: SituationPageCode;
  name: string;
  title: string;
  subtitle: string;
  location: string;
  lastUpdated: string;
  dataMode: SituationDataMode;
  summary: string;
  heroTags: SituationHeroTag[];
  actions: SituationActionItem[];
  kpis: SituationKpi[];
  highlights: SituationHighlight[];
  sections: SituationSection[];
}

export interface SituationPageResult {
  page: SituationPage;
  source: SituationResolvedSource;
  warningMessage?: string;
}

export interface SituationFilterChip {
  key: string;
  label: string;
  count: number;
}

export interface SituationInsight {
  id: string;
  label: string;
  title: string;
  description: string;
  tone: SituationTone;
  metric?: string;
  meta?: string;
  sourceSectionCode?: string;
  sourceSectionTitle?: string;
}
