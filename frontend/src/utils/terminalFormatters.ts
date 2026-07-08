function parseApiDate(value: string) {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  return new Date(normalized);
}

export function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '暂无';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(parseApiDate(value));
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) {
    return '暂无';
  }

  const date = parseApiDate(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时前`;
  }

  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function statusTone(status: string | null | undefined) {
  switch (status) {
    case 'ONLINE':
    case 'HEALTHY':
    case 'LOW':
    case 'BOUND':
    case '已恢复':
    case '正常':
      return 'success';
    case 'STALE':
    case 'DEGRADED':
    case 'MEDIUM':
    case 'WARNING':
    case 'PENDING_CLAIM':
    case '降级':
      return 'warning';
    case 'OFFLINE':
    case 'HIGH':
    case 'CRITICAL':
    case 'OPEN':
    case '异常':
      return 'danger';
    default:
      return 'info';
  }
}

export function deviceStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'ONLINE':
      return '在线';
    case 'STALE':
      return '延迟';
    case 'OFFLINE':
      return '离线';
    default:
      return status || '未知';
  }
}

export function sourceStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'HEALTHY':
      return '健康';
    case 'DEGRADED':
      return '降级';
    case 'OFFLINE':
      return '离线';
    case 'DISABLED':
      return '停用';
    case 'UNKNOWN':
      return '未知';
    default:
      return status || '未知';
  }
}

export function sourceTypeLabel(sourceType: string | null | undefined) {
  switch (sourceType) {
    case 'EXTERNAL_API':
      return '外部接口';
    case 'MANUAL_IMPORT':
      return '手工注入';
    default:
      return sourceType || '未知来源';
  }
}

export function riskLevelLabel(level: string | null | undefined) {
  switch (level) {
    case 'LOW':
      return '低风险';
    case 'MEDIUM':
      return '中风险';
    case 'HIGH':
      return '高风险';
    case 'CRITICAL':
      return '严重风险';
    default:
      return level || '未知';
  }
}

export function boolLabel(value: boolean) {
  return value ? '是' : '否';
}

export function sourceSystemLabel(value: string | null | undefined) {
  switch (value) {
    case 'zero-trust-gateway':
      return '零信任网关';
    case 'security-ops-manual':
      return '手工注入台';
    default:
      return value || '未命名来源';
  }
}


export function ownershipStatusLabel(value: string | null | undefined) {
  switch (value) {
    case 'BOUND':
      return '已关联人员';
    case 'PENDING_CLAIM':
      return '待认领';
    case 'ANONYMOUS':
      return '匿名终端';
    default:
      return value || '未知';
  }
}

export function softwareChangeTypeLabel(value: string | null | undefined) {
  switch ((value || '').toUpperCase()) {
    case 'INSTALL':
      return '安装';
    case 'UPDATE':
      return '更新';
    case 'UNINSTALL':
      return '卸载';
    default:
      return value || '未知';
  }
}

export function peripheralActionLabel(value: string | null | undefined) {
  switch ((value || '').toUpperCase()) {
    case 'INSERT':
      return '接入';
    case 'REMOVE':
      return '移除';
    default:
      return value || '变化';
  }
}

export function passwordModuleStatusLabel(value: string | null | undefined) {
  if (!value) {
    return '未知';
  }
  switch (value.trim().toUpperCase()) {
    case 'NORMAL':
    case 'HEALTHY':
    case 'ACTIVE':
    case 'AVAILABLE':
      return '正常';
    case 'DEGRADED':
      return '降级';
    case 'ABNORMAL':
    case 'ERROR':
      return '异常';
    default:
      return value;
  }
}

export function eventSeverityLabel(value: string | null | undefined) {
  switch (value) {
    case 'INFO':
      return '提示';
    case 'WARNING':
      return '关注';
    case 'HIGH':
      return '高危';
    case 'CRITICAL':
      return '严重';
    default:
      return value || '未知';
  }
}
