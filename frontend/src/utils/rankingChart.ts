// 收发排名（密信）与专题排名（签阅 / 系统流量）的共享 ECharts 配置。
// 首页综合态势与业务态势密信专题使用同一实现，保证切换维度后的颜色、布局与交互完全一致。

export type RankingMode = 'total' | 'sent' | 'received';

export const rankingPalette: Record<RankingMode, string> = {
  total: '#5a95ff',
  sent: '#4eb4ff',
  received: '#43d7a2'
};

export interface RankingRow {
  sent: number;
  received: number;
  total: number;
}

export function compactDepartmentName(name: string): string {
  return name.replace('业务保障组', '保障组').replace('通信保障中心', '保障中心');
}

// 密信收发排名图：首页与业务态势密信专题共用。
export function messageRankingOption<T extends RankingRow>(
  rows: T[],
  mode: RankingMode,
  nameOf: (item: T) => string,
  dataOf: (item: T) => Record<string, unknown>,
  tooltipNameOf: (item: T) => string = nameOf
) {
  const color = rankingPalette[mode];
  return {
    animationDurationUpdate: 320,
    grid: { left: 100, right: 48, top: 8, bottom: 8 },
    tooltip: {
      trigger: 'item',
      formatter: (params: { dataIndex: number; data: { context?: string } }) => {
        const item = rows[params.dataIndex];
        const context = params.data.context ? `<br/><span style="color:#8fa0b8">${params.data.context}</span>` : '';
        return `<strong>${tooltipNameOf(item)}</strong>${context}<br/>发送 ${item.sent} 条&nbsp;&nbsp;接收 ${item.received} 条<br/>收发总量 ${item.total} 条`;
      }
    },
    xAxis: { type: 'value', show: false, max: (value: { max: number }) => Math.max(1, Math.ceil(value.max * 1.22)) },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((item) => nameOf(item)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        align: 'right',
        margin: 10,
        formatter: (value: string, index: number) => `{${index < 3 ? 'top' : 'rank'}|${index + 1}}  {name|${value}}`,
        rich: {
          top: { width: 12, color: '#e9b949', fontSize: 11, fontWeight: 700, align: 'center' },
          rank: { width: 12, color: '#73829a', fontSize: 11, align: 'center' },
          name: { width: 68, color: '#bac5d5', fontSize: 12, overflow: 'truncate', align: 'left' }
        }
      }
    },
    series: [{
      type: 'bar',
      barWidth: 13,
      showBackground: true,
      backgroundStyle: { color: 'rgba(116,137,169,.12)' },
      data: rows.map((item, index) => ({
        value: item[mode],
        ...dataOf(item),
        itemStyle: { color, opacity: index < 3 ? 1 : 0.68, borderRadius: [0, 2, 2, 0] }
      })),
      label: { show: true, position: 'right', color: '#d9e4f5', fontSize: 11, formatter: '{c} 条' },
      emphasis: { focus: 'self', itemStyle: { opacity: 1, shadowBlur: 8, shadowColor: color } }
    }]
  };
}

export interface TopicRankRow {
  name: string;
  value: number;
  detail: string;
}

// 单值排名图（签阅处理 / 系统吞吐 / 区域链路），与收发排名保持同一视觉基线。
export function topicRankingOption(rows: TopicRankRow[], color: string, unit: string, decimals = 0) {
  const formatValue = (value: number) => (decimals > 0 ? value.toFixed(decimals) : String(Math.round(value)));
  return {
    animationDurationUpdate: 320,
    grid: { left: 100, right: 48, top: 8, bottom: 8 },
    tooltip: {
      trigger: 'item',
      formatter: (params: { dataIndex: number }) => {
        const item = rows[params.dataIndex];
        return `<strong>${item.name}</strong><br/>${item.detail}<br/>当前 ${formatValue(item.value)} ${unit}`;
      }
    },
    xAxis: { type: 'value', show: false, max: (value: { max: number }) => Math.max(1, Math.ceil(value.max * 1.22)) },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        align: 'right',
        margin: 10,
        formatter: (value: string, index: number) => `{${index < 3 ? 'top' : 'rank'}|${index + 1}}  {name|${value}}`,
        rich: {
          top: { width: 12, color: '#e9b949', fontSize: 11, fontWeight: 700, align: 'center' },
          rank: { width: 12, color: '#73829a', fontSize: 11, align: 'center' },
          name: { width: 68, color: '#bac5d5', fontSize: 12, overflow: 'truncate', align: 'left' }
        }
      }
    },
    series: [{
      type: 'bar',
      barWidth: 13,
      showBackground: true,
      backgroundStyle: { color: 'rgba(116,137,169,.12)' },
      data: rows.map((item, index) => ({
        value: item.value,
        itemStyle: { color, opacity: index < 3 ? 1 : 0.68, borderRadius: [0, 2, 2, 0] }
      })),
      label: { show: true, position: 'right', color: '#d9e4f5', fontSize: 11, formatter: (params: { value: number }) => `${formatValue(params.value)} ${unit}` },
      emphasis: { focus: 'self', itemStyle: { opacity: 1, shadowBlur: 8, shadowColor: color } }
    }]
  };
}
