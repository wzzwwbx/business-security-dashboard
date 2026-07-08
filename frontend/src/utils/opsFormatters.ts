function parseApiDate(value: string) {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  return new Date(normalized);
}

export function formatPercent(value: number, digits = 1) {
  return `${Number.isFinite(value) ? value.toFixed(digits) : '0.0'}%`;
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

export function statusTone(status: string) {
  switch (status) {
    case 'ONLINE':
    case 'OPEN':
      return status === 'ONLINE' ? 'success' : 'danger';
    case 'STALE':
    case 'WARNING':
      return 'warning';
    case 'OFFLINE':
    case 'CRITICAL':
      return 'danger';
    default:
      return 'info';
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case 'ONLINE':
      return '在线';
    case 'STALE':
      return '延迟';
    case 'OFFLINE':
      return '离线';
    case 'PROBE':
      return '探针';
    case 'EXTERNAL_API':
      return '外部接口';
    case 'MANUAL_IMPORT':
      return '手工导入';
    case 'OPEN':
      return '未恢复';
    case 'RESOLVED':
      return '已恢复';
    case 'CRITICAL':
      return '严重';
    case 'WARNING':
      return '警告';
    case 'INFO':
      return '提示';
    default:
      return status;
  }
}

export function sourceSystemLabel(value: string | null | undefined) {
  switch (value) {
    case 'ops-probe-arm':
    case 'linux-arm-probe':
      return '主机探针';
    case 'ops-external-gateway':
      return '外部接入网关';
    case 'ops-manual-console':
      return '手工注入台';
    default:
      return value ? '接入来源' : '未命名来源';
  }
}

export function bindingStatusLabel(value: string | null | undefined) {
  switch ((value || '').toUpperCase()) {
    case 'BOUND':
    case 'ACTIVE':
      return '已绑定';
    case 'PENDING':
      return '待确认';
    case 'DISABLED':
      return '停用';
    case 'UNBOUND':
      return '未绑定';
    default:
      return value || '未知';
  }
}

export function processStateLabel(value: string | null | undefined) {
  switch ((value || '').toUpperCase()) {
    case 'R':
    case 'RUNNING':
      return '运行中';
    case 'S':
    case 'SLEEPING':
      return '休眠';
    case 'D':
      return '等待';
    case 'T':
    case 'STOPPED':
      return '暂停';
    case 'Z':
    case 'ZOMBIE':
      return '僵尸';
    case 'I':
      return '空闲';
    default:
      return value || '未知';
  }
}

export function archLabel(value: string | null | undefined) {
  switch ((value || '').toLowerCase()) {
    case 'aarch64':
    case 'arm64':
      return 'ARM64';
    case 'x86_64':
    case 'amd64':
      return 'x86 64位';
    default:
      return value || '未知';
  }
}
