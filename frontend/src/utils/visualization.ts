import type { AssetType, VisualTone } from '@/types/visualization';

export function assetTypeIcon(assetType: AssetType) {
  switch (assetType) {
    case 'domain':
      return 'overview';
    case 'service':
      return 'business';
    case 'server':
      return 'server';
    case 'database':
      return 'database';
    case 'gateway':
      return 'gateway';
    case 'source':
      return 'source';
    case 'terminal':
      return 'terminal';
    case 'mobile':
      return 'mobile';
    case 'person':
      return 'user';
    case 'alert':
      return 'alert';
    case 'policy':
      return 'policy';
    case 'cluster':
      return 'cluster';
    default:
      return 'overview';
  }
}

export function normalizeTone(status: string | null | undefined): VisualTone {
  switch ((status || '').toUpperCase()) {
    case 'ONLINE':
    case 'HEALTHY':
    case 'NORMAL':
    case 'BOUND':
    case 'SUCCESS':
    case 'LOW':
      return 'success';
    case 'STALE':
    case 'WARNING':
    case 'MEDIUM':
    case 'PENDING_CLAIM':
    case 'DEGRADED':
      return 'warning';
    case 'OFFLINE':
    case 'CRITICAL':
    case 'HIGH':
    case 'DANGER':
    case 'OPEN':
    case 'ABNORMAL':
      return 'danger';
    default:
      return 'info';
  }
}

export function percentageTone(value: number, warning = 70, danger = 90): VisualTone {
  if (!Number.isFinite(value)) {
    return 'info';
  }
  if (value >= danger) {
    return 'danger';
  }
  if (value >= warning) {
    return 'warning';
  }
  return 'success';
}
