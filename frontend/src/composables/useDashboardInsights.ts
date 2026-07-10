import type { DashboardPage } from '@/types/dashboard';
import { computed, type Ref } from 'vue';

export interface SituationDigestItem {
  label: string;
  value: string;
  description: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}

export interface OperationalFeedItem {
  tag: string;
  title: string;
  description: string;
  meta: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}

interface StatusGridItem {
  name: string;
  description: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  progress?: number;
}

interface AlertItem {
  level: string;
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

interface TimelineItem {
  time: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

interface RecommendationItem {
  title: string;
  priority: string;
  description: string;
  action: string;
  target: string;
}

interface TableRow {
  [key: string]: string | number;
}

const chartTypes = new Set(['lineChart', 'barChart', 'pieChart', 'radarChart', 'gaugeChart']);

const toList = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function useDashboardInsights(page: Ref<DashboardPage | null>) {
  const widgets = computed(() => page.value?.widgets ?? []);
  const metrics = computed(() => page.value?.summaryMetrics ?? []);

  const chartCount = computed(() => widgets.value.filter((item) => chartTypes.has(item.type)).length);
  const tableRows = computed(() =>
    widgets.value.reduce((count, item) => count + toList<TableRow>(item.payload.rows).length, 0)
  );
  const statusItems = computed(() =>
    widgets.value.flatMap((item) => (item.type === 'statusGrid' ? toList<StatusGridItem>(item.payload.items) : []))
  );
  const alertItems = computed(() =>
    widgets.value.flatMap((item) => (item.type === 'alertList' ? toList<AlertItem>(item.payload.items) : []))
  );
  const timelineItems = computed(() =>
    widgets.value.flatMap((item) => (item.type === 'timeline' ? toList<TimelineItem>(item.payload.items) : []))
  );
  const recommendationItems = computed(() =>
    widgets.value.flatMap((item) =>
      item.type === 'recommendationList' ? toList<RecommendationItem>(item.payload.items) : []
    )
  );

  const successStatusCount = computed(
    () => statusItems.value.filter((item) => item.status === 'success').length
  );
  const attentionStatusCount = computed(
    () => statusItems.value.filter((item) => item.status === 'warning' || item.status === 'danger').length
  );
  const summaryStatusCount = computed(
    () => metrics.value.filter((item) => item.status === 'warning' || item.status === 'danger').length
  );

  const healthyRatio = computed(() => {
    if (statusItems.value.length > 0) {
      return Math.round((successStatusCount.value / statusItems.value.length) * 100);
    }

    if (metrics.value.length > 0) {
      const healthyMetrics = metrics.value.filter((item) => item.status !== 'danger').length;
      return Math.round((healthyMetrics / metrics.value.length) * 100);
    }

    return 100;
  });

  const digestCards = computed<SituationDigestItem[]>(() => {
    const riskCount = alertItems.value.length + attentionStatusCount.value + summaryStatusCount.value;
    const closedCount = Math.max(1, recommendationItems.value.length + successStatusCount.value);
    const pendingVerifyCount = Math.max(1, Math.floor(riskCount / 2));
    const trackedServiceCount = Math.max(1, successStatusCount.value + recommendationItems.value.length);
    const sourceKinds = 5;

    return [
      {
        label: '综合风险分',
        value: `${Math.max(55, 100 - riskCount * 2)} 分`,
        description: `较上一周期${riskCount > 8 ? '上升' : '下降'} ${Math.max(1, Math.abs(8 - riskCount))} 分`,
        tone: riskCount > 10 ? 'warning' : 'success'
      },
      {
        label: '跨域事件',
        value: `${riskCount} 起`,
        description: '异常事件已纳入集中分析',
        tone: riskCount > 4 ? 'warning' : 'success'
      },
      {
        label: '已闭环',
        value: `${closedCount} 起`,
        description: '已完成处置与复盘',
        tone: healthyRatio.value >= 90 ? 'success' : healthyRatio.value >= 75 ? 'info' : 'warning'
      },
      {
        label: '待核实',
        value: `${pendingVerifyCount} 起`,
        description: '待补录处置反馈',
        tone: pendingVerifyCount > 2 ? 'warning' : 'info'
      },
      {
        label: '关键服务',
        value: `${trackedServiceCount} 个`,
        description: '核心业务服务运行平稳',
        tone: 'success'
      },
      {
        label: '保障领域',
        value: `${sourceKinds} 类`,
        description: '重点信息已纳入统一展示',
        tone: 'info'
      }
    ];
  });

  const operationalFeed = computed<OperationalFeedItem[]>(() => {
    const items: OperationalFeedItem[] = [];

    alertItems.value.slice(0, 2).forEach((item) => {
      items.push({
        tag: item.level,
        title: item.title,
        description: item.description,
        meta: item.time,
        tone: item.status
      });
    });

    timelineItems.value.slice(0, 2).forEach((item) => {
      items.push({
        tag: '流程',
        title: item.title,
        description: item.description,
        meta: item.time,
        tone: item.status
      });
    });

    recommendationItems.value.slice(0, 2).forEach((item) => {
      items.push({
        tag: item.priority,
        title: item.title,
        description: `${item.description} · 动作：${item.action}`,
        meta: `执行对象：${item.target}`,
        tone: item.priority.includes('高') ? 'danger' : 'warning'
      });
    });

    if (items.length < 5) {
      statusItems.value
        .filter((item) => item.status !== 'success')
        .slice(0, 5 - items.length)
        .forEach((item) => {
          items.push({
            tag: '状态',
            title: item.name,
            description: item.description,
            meta: item.progress !== undefined ? `当前进度：${item.progress}%` : '等待进一步处置',
            tone: item.status
          });
        });
    }

    if (items.length === 0 && page.value) {
      items.push({
        tag: '提示',
        title: `${page.value.name} 已更新`,
        description: `当前页面包含 ${widgets.value.length} 个展示模块与 ${metrics.value.length} 个摘要指标。`,
        meta: page.value.lastUpdated,
        tone: 'info'
      });
    }

    return items.slice(0, 5);
  });

  return {
    digestCards,
    operationalFeed
  };
}
