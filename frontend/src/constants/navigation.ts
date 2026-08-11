import type { SystemTabKey } from '@/types/iam';

export type AppPageCode = 'overview' | 'security' | 'business' | 'terminal' | 'ops' | 'system';
export type BaseIconName = 'overview' | 'security' | 'business' | 'terminal' | 'ops' | 'system' | 'user' | 'logout' | 'empty' | 'refresh';

export interface MainNavItem {
  code: AppPageCode;
  label: string;
  route: string;
  icon: BaseIconName;
  description: string;
}

export interface SystemTabDefinition {
  key: SystemTabKey;
  label: string;
  description: string;
  route: string;
  requiredAuthorities: string[];
}

export const PAGE_PERMISSION_MAP: Record<AppPageCode, string> = {
  overview: 'page:overview:view',
  security: 'page:security:view',
  business: 'page:business:view',
  terminal: 'page:terminal:view',
  ops: 'page:ops:view',
  system: 'page:system:view'
};

export const DEFAULT_PAGE_ORDER: AppPageCode[] = ['overview', 'security', 'business', 'terminal', 'ops', 'system'];

const configuredVisiblePages = String(import.meta.env.VITE_VISIBLE_PAGES ?? 'overview')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean) as AppPageCode[];

export const VISIBLE_PAGE_CODES = new Set<AppPageCode>(configuredVisiblePages);

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  { code: 'overview', label: '综合态势', route: '/overview', icon: 'overview', description: '统一展示业务、安全、终端与运维的综合态势。' },
  { code: 'business', label: '业务态势', route: '/business', icon: 'business', description: '关注业务连续性、链路健康与关键系统服务质量。' },
  { code: 'terminal', label: '终端态势', route: '/terminal', icon: 'terminal', description: '呈现终端资产、健康度、风险分布与处置状态。' },
  { code: 'ops', label: '运维态势', route: '/ops', icon: 'ops', description: '查看安全与运维合并后的主机、拓扑、告警与趋势数据。' }
];

export const SYSTEM_TAB_ITEMS: SystemTabDefinition[] = [
  {
    key: 'accounts',
    label: '账户治理',
    description: '账号、角色分配、口令初始化与启停用申请。',
    route: '/system/accounts',
    requiredAuthorities: ['account:view']
  },
  {
    key: 'roles',
    label: '角色权限',
    description: '内置角色、模板角色与页面/动作权限映射。',
    route: '/system/roles',
    requiredAuthorities: ['role:view']
  },
  {
    key: 'approvals',
    label: '审批中心',
    description: '高危操作审批、双人复核与执行留痕。',
    route: '/system/approvals',
    requiredAuthorities: ['approval:view']
  },
  {
    key: 'audit',
    label: '审计留痕',
    description: '登录审计、操作审计与审批追踪。',
    route: '/system/audit',
    requiredAuthorities: ['audit:view']
  }
];

export function resolveFirstAccessibleSystemRoute(hasAuthority: (code: string) => boolean) {
  return SYSTEM_TAB_ITEMS.find((item) => item.requiredAuthorities.every((code) => hasAuthority(code)))?.route ?? null;
}
