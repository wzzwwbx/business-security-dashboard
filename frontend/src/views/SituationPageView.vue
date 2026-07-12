<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import DetailDrawerShell from '@/components/common/DetailDrawerShell.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import { useSituationPage } from '@/composables/useSituationPage';
import type {
  SituationChartSection,
  SituationInsight,
  SituationKpi,
  SituationPageCode,
  SituationSignalItem,
  SituationSignalsSection,
  SituationTimelineItem,
  SituationTimelineSection,
  SituationTone
} from '@/types/situation';
import type { VisualAssetNode } from '@/types/visualization';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

type DashboardPanelKey = 'leftTop' | 'leftMini' | 'leftBottom' | 'rightTop' | 'rightMini' | 'rightBottom' | 'centerTop' | 'bottomCenter';

interface DashboardPanel {
  key: DashboardPanelKey;
  code?: string;
  section: SituationChartSection | null;
  title: string;
  description?: string;
  accent: SituationTone;
  option: Record<string, unknown>;
}

interface DashboardEventPanel {
  key: DashboardPanelKey;
  title: string;
  description?: string;
  accent: SituationTone;
  items: (SituationSignalItem | SituationTimelineItem)[];
}

type DashboardPanelDraft = Omit<DashboardPanel, 'option' | 'section'> & {
  fallbackOption?: Record<string, unknown>;
};

interface DashboardLayout {
  layoutClass: string;
  left: DashboardPanel[];
  centerTop: DashboardPanel;
  bottomCenter: DashboardPanel;
  right: DashboardPanel[];
  eventPanel: DashboardEventPanel;
}

const route = useRoute();

const pageCode = computed<SituationPageCode>(() => {
  const candidate = String(route.meta.pageCode ?? 'overview');
  return candidate === 'security' || candidate === 'business' || candidate === 'terminal' ? candidate : 'overview';
});

const {
  page,
  loading,
  errorDescription,
  warningMessage,
  resolvedSource,
  visibleSections,
  hasFilterResult,
  selectedInsight,
  selectInsight,
  clearInsight,
  loadPage
} = useSituationPage(pageCode);

const selectedNode = ref<VisualAssetNode | null>(null);

watch(pageCode, () => {
  selectedNode.value = null;
  clearInsight();
});

const titlePrefix = computed(() => {
  if (pageCode.value === 'overview') {
    return '业务安全态势系统';
  }

  return '业务安全态势系统';
});

const pageTitle = computed(() => `${titlePrefix.value}-${page.value?.title ?? '态势总览'}`);

const topKpis = computed(() => (page.value?.kpis ?? []).slice(0, 4));
const tickerKpis = computed(() => (page.value?.kpis ?? []).slice(4));
const highlightItems = computed(() => page.value?.highlights.slice(0, 4) ?? []);

const chartSections = computed<SituationChartSection[]>(() =>
  visibleSections.value.filter((section): section is SituationChartSection => section.kind === 'chart')
);

const signalSection = computed<SituationSignalsSection | null>(
  () => visibleSections.value.find((section): section is SituationSignalsSection => section.kind === 'signals') ?? null
);

const timelineSection = computed<SituationTimelineSection | null>(
  () => visibleSections.value.find((section): section is SituationTimelineSection => section.kind === 'timeline') ?? null
);

const eventItems = computed(() => {
  if (signalSection.value?.items.length) {
    return signalSection.value.items.slice(0, 8);
  }

  if (timelineSection.value?.items.length) {
    return timelineSection.value.items.slice(0, 8).map((item) => ({
      label: item.actor,
      title: item.title,
      description: item.description,
      meta: item.time,
      tone: item.tone
    }));
  }

  return [];
});

function cloneOption<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneOption(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cloneOption(item)])
    ) as T;
  }

  return value;
}

function compactChartOption(section: SituationChartSection | null, key: DashboardPanelKey) {
  if (!section) {
    return {};
  }

  const option = cloneOption(section.option) as Record<string, any>;
  const series = Array.isArray(option.series) ? option.series : [];
  const firstType = series[0]?.type;

  if (firstType === 'pie') {
    option.legend = {
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 7,
      itemGap: 8,
      textStyle: { fontSize: 11 },
      ...(option.legend ?? {})
    };
    option.title = {
      ...(option.title ?? {}),
      top: '38%',
      textStyle: {
        fontSize: key === 'leftTop' ? 25 : 22,
        fontWeight: 700,
        ...(option.title?.textStyle ?? {})
      },
      subtextStyle: {
        fontSize: 11,
        ...(option.title?.subtextStyle ?? {})
      }
    };
    option.series = series.map((item) => ({
      ...item,
      radius: ['43%', '64%'],
      center: ['50%', '43%'],
      labelLayout: { hideOverlap: false },
      labelLine: {
        length: 8,
        length2: 10,
        maxSurfaceAngle: 80,
        ...(item.labelLine ?? {})
      },
      label: {
        formatter: '{b}\n{c}',
        fontSize: 10,
        lineHeight: 13,
        overflow: 'break',
        width: 58,
        ...(item.label ?? {})
      }
    }));
  }

  if (firstType === 'bar') {
    option.legend = option.legend
      ? {
          top: 0,
          right: 4,
          itemWidth: 10,
          itemHeight: 7,
          itemGap: 10,
          textStyle: { fontSize: 11 },
          ...(option.legend ?? {})
        }
      : option.legend;
    option.grid = key === 'bottomCenter'
      ? { left: 92, right: 34, top: 22, bottom: 18, ...(option.grid ?? {}) }
      : { left: 30, right: 20, top: 30, bottom: 24, ...(option.grid ?? {}) };
    option.series = series.map((item) => ({
      ...item,
      barWidth: key === 'bottomCenter' ? 14 : 18,
      label: item.label
        ? {
            fontSize: 10,
            ...(item.label ?? {})
          }
        : item.label
    }));
  }

  if (firstType === 'line') {
    option.legend = {
      top: 0,
      right: 4,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { fontSize: 11 },
      ...(option.legend ?? {})
    };
    option.grid = { left: 36, right: 22, top: 40, bottom: 24, ...(option.grid ?? {}) };
  }

  if (firstType === 'funnel') {
    option.series = series.map((item) => ({
      ...item,
      left: '18%',
      top: 28,
      bottom: 18,
      width: '64%',
      gap: 6,
      label: {
        fontSize: 12,
        lineHeight: 16,
        ...(item.label ?? {})
      }
    }));
  }

  if (firstType === 'radar') {
    option.radar = {
      radius: '58%',
      center: ['50%', '52%'],
      axisName: { fontSize: 10 },
      ...(option.radar ?? {})
    };
  }

  return option;
}

function readMetricNumber(value: string) {
  const metric = Number.parseFloat(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(metric) ? metric : 0;
}

function metricMiniBarOption(kpis: SituationKpi[]) {
  const items = kpis.slice(0, 4);
  const rawValues = items.map((item) => readMetricNumber(item.value));
  const maxValue = Math.max(...rawValues, 1);

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 74, right: 30, top: 8, bottom: 10 },
    xAxis: {
      type: 'value',
      max: 100,
      splitLine: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: items.map((item) => item.label),
      axisLabel: { fontSize: 10 }
    },
    series: [{
      type: 'bar',
      barWidth: 8,
      label: { show: true, position: 'right', formatter: '{c}%' },
      data: rawValues.map((value) => Math.max(8, Math.round((value / maxValue) * 100)))
    }]
  };
}

function eventToneRingOption(items: Array<Pick<SituationSignalItem, 'tone'>>) {
  const toneLabels: Record<SituationTone, string> = {
    danger: '高危',
    warning: '关注',
    success: '稳定',
    info: '跟进'
  };
  const counts = items.reduce<Record<SituationTone, number>>((total, item) => {
    total[item.tone] += 1;
    return total;
  }, { success: 0, warning: 0, danger: 0, info: 0 });
  const data = (Object.keys(toneLabels) as SituationTone[])
    .map((tone) => ({ name: toneLabels[tone], value: counts[tone] }))
    .filter((item) => item.value > 0);
  const safeData = data.length ? data : [{ name: '稳定', value: 1 }];

  return {
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 7,
      itemGap: 8,
      textStyle: { fontSize: 10 }
    },
    title: {
      text: String(safeData.reduce((sum, item) => sum + item.value, 0)),
      subtext: '事件总数',
      left: 'center',
      top: '36%',
      textAlign: 'center',
      textStyle: { fontSize: 22, fontWeight: 700 },
      subtextStyle: { fontSize: 10 }
    },
    series: [{
      type: 'pie',
      radius: ['42%', '64%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      label: { show: false },
      data: safeData
    }]
  };
}

function hasPanelOption(panel: DashboardPanel) {
  return Object.keys(panel.option).length > 0;
}

const chartSectionMap = computed(() => new Map(chartSections.value.map((section) => [section.code, section] as const)));

function resolvePanel(spec: DashboardPanelDraft): DashboardPanel {
  const section = spec.code ? chartSectionMap.value.get(spec.code) ?? null : null;
  return {
    ...spec,
    section,
    option: section ? compactChartOption(section, spec.key) : spec.fallbackOption ?? {}
  };
}

function buildEventPanel(
  key: DashboardPanelKey,
  title: string,
  description: string,
  accent: SituationTone,
  items: (SituationSignalItem | SituationTimelineItem)[]
): DashboardEventPanel {
  return {
    key,
    title,
    description,
    accent,
    items
  };
}

const dashboardLayout = computed<DashboardLayout>(() => {
  switch (pageCode.value) {
    case 'security':
      return {
        layoutClass: 'board-grid--security',
        left: [
          { key: 'leftTop', code: 'security-firewall-trend', title: '防火墙告警趋势', description: '边界防火墙拦截与告警走势。', accent: 'info' },
          { key: 'leftMini', code: 'security-vuln-ring', title: '漏洞风险等级', description: '高危、中危、低危与已修复分布。', accent: 'warning' },
          { key: 'leftBottom', code: 'security-ids-trend', title: '入侵检测趋势', description: '入侵检测告警与阻断变化。', accent: 'danger' }
        ].map(resolvePanel),
        centerTop: resolvePanel({
          key: 'centerTop',
          code: 'security-risk-trend',
          title: '高危事件趋势',
          description: '高危安全事件与处置变化。',
          accent: 'success'
        }),
        bottomCenter: resolvePanel({
          key: 'bottomCenter',
          code: 'security-defense-radar',
          title: '防护能力雷达',
          description: '安全防护各维度表现。',
          accent: 'warning'
        }),
        right: [
          { key: 'rightTop', code: 'security-funnel', title: '安全事件处置漏斗', description: '从发现到复盘的闭环进度。', accent: 'warning' },
          { key: 'rightMini', code: 'security-asset-bar', title: '受影响资产排行', description: '边界和核心资产受影响情况。', accent: 'info' }
        ].map(resolvePanel),
        eventPanel: buildEventPanel('rightBottom', '安全事件流', '防火墙、入侵检测、漏洞和处置状态滚动呈现。', 'danger', eventItems.value)
      };
    case 'business':
      return {
        layoutClass: 'board-grid--business',
        left: [
          { key: 'leftTop', code: 'business-message-trend', title: '密信业务量趋势', description: '密信业务量变化。', accent: 'success' },
          { key: 'leftMini', code: 'business-success-ring', title: '密信与签阅成功率', description: '密信和签阅成功率结构。', accent: 'info' },
          { key: 'leftBottom', code: 'business-sign-trend', title: '签阅处理趋势', description: '签阅业务流转趋势。', accent: 'warning' }
        ].map(resolvePanel),
        centerTop: resolvePanel({
          key: 'centerTop',
          code: 'business-volume',
          title: '业务处理总量趋势',
          description: '终端密信与签阅处理总量走势。',
          accent: 'success'
        }),
        bottomCenter: resolvePanel({
          key: 'bottomCenter',
          code: 'business-stack',
          title: '终端密信与签阅分布',
          description: '业务对象状态分布。',
          accent: 'danger'
        }),
        right: [
          { key: 'rightTop', code: 'business-latency', title: '链路时延排行', description: '业务链路时延对比。', accent: 'warning' },
          { key: 'rightMini', code: 'business-queue-funnel', title: '积压队列处置情况', description: '业务积压队列处理进度。', accent: 'info' }
        ].map(resolvePanel),
        eventPanel: buildEventPanel('rightBottom', '业务事件流', '密信、签阅、网关和数据库事件滚动呈现。', 'danger', eventItems.value)
      };
    case 'terminal':
      return {
        layoutClass: 'board-grid--terminal',
        left: [
          { key: 'leftTop', code: 'terminal-risk-ring', title: '终端风险分布', description: '终端风险类型分布。', accent: 'warning' },
          {
            key: 'leftMini',
            title: '核心指标对比',
            description: '按当前核心指标生成对比视图。',
            accent: 'info',
            fallbackOption: metricMiniBarOption(topKpis.value)
          },
          { key: 'leftBottom', code: 'terminal-owner-stack', title: '终端归属分布', description: '按组织角色展示终端归属。', accent: 'success' }
        ].map(resolvePanel),
        centerTop: resolvePanel({
          key: 'centerTop',
          code: 'terminal-online-trend',
          title: '近七日终端在线趋势',
          description: '终端在线与活跃走势。',
          accent: 'success'
        }),
        bottomCenter: resolvePanel({
          key: 'bottomCenter',
          code: 'terminal-category',
          title: '终端异常分类统计',
          description: '终端异常类型排行。',
          accent: 'danger'
        }),
        right: [
          { key: 'rightTop', code: 'terminal-alert-funnel', title: '终端异常处置漏斗', description: '终端异常事件处置进度。', accent: 'warning' },
          {
            key: 'rightMini',
            title: '事件状态占比',
            description: '按事件状态展示当前分布。',
            accent: 'info',
            fallbackOption: eventToneRingOption(eventItems.value)
          }
        ].map(resolvePanel),
        eventPanel: buildEventPanel('rightBottom', '终端事件流', '重点终端事件滚动呈现。', 'danger', eventItems.value)
      };
    case 'overview':
    default:
      return {
        layoutClass: 'board-grid--overview',
        left: [
          { key: 'leftTop', code: 'overview-asset-ring', title: '内网实体台账概览', description: '按实体类型展示当前纳管规模。', accent: 'info' },
          {
            key: 'leftMini',
            title: '核心指标对比',
            description: '按当前核心指标生成对比视图。',
            accent: 'info',
            fallbackOption: metricMiniBarOption(topKpis.value)
          },
          { key: 'leftBottom', code: 'overview-resource', title: '接入资源概览', description: '人员、设备、组织接入分布。', accent: 'success' }
        ].map(resolvePanel),
        centerTop: resolvePanel({
          key: 'centerTop',
          code: 'overview-trend',
          title: '近七日告警处置趋势',
          description: '告警与处置变化趋势。',
          accent: 'success'
        }),
        bottomCenter: resolvePanel({
          key: 'bottomCenter',
          code: 'overview-behavior',
          title: '异常行为分类统计',
          description: '按异常行为类型展示月度分布。',
          accent: 'danger'
        }),
        right: [
          { key: 'rightTop', code: 'overview-funnel', title: '异常告警处置情况', description: '展示事件从发现到处置的流转规模。', accent: 'warning' },
          {
            key: 'rightMini',
            title: '事件状态占比',
            description: '按事件状态展示当前分布。',
            accent: 'info',
            fallbackOption: eventToneRingOption(eventItems.value)
          }
        ].map(resolvePanel),
        eventPanel: buildEventPanel('rightBottom', '实时事件流', '当前重点事件滚动呈现。', 'danger', eventItems.value)
      };
  }
});

const dashboardEventRows = computed(() =>
  dashboardLayout.value.eventPanel.items.map((item) => ({
    source: item,
    meta: 'meta' in item ? item.meta : item.time,
    label: 'label' in item ? item.label : item.actor,
    title: item.title,
    tone: item.tone
  }))
);

const statusText = computed(() => {
  if (warningMessage.value) {
    return '数据已更新';
  }

  return resolvedSource.value === 'integration' ? '数据已更新' : '页面已刷新';
});

const dashboardTime = computed(() => page.value?.lastUpdated?.slice(11, 19) ?? new Date().toLocaleTimeString('zh-CN', { hour12: false }));

const drawerOpen = computed(() => Boolean(selectedNode.value || selectedInsight.value));
const drawerTitle = computed(() => selectedNode.value?.name ?? selectedInsight.value?.title ?? '详情');
const drawerSubtitle = computed(() => selectedNode.value ? '节点下钻' : selectedInsight.value?.label ?? '态势洞察');
const drawerBadges = computed(() => selectedNode.value?.badges ?? []);

function toneClass(tone?: SituationTone) {
  return tone ? `tone-${tone}` : 'tone-info';
}

function handleSelectNode(node: VisualAssetNode) {
  selectedNode.value = node;
  clearInsight();
}

function handleSelectInsight(insight: SituationInsight) {
  selectedNode.value = null;
  selectInsight(insight);
}

function selectKpi(kpi: SituationKpi) {
  handleSelectInsight({
    id: `kpi-${kpi.label}`,
    label: kpi.label,
    title: kpi.label,
    description: kpi.description,
    tone: kpi.tone,
    metric: `${kpi.value}${kpi.unit ?? ''}`,
    meta: kpi.trend
  });
}

function selectSignal(item: SituationSignalItem | SituationTimelineItem) {
  handleSelectInsight({
    id: `event-${item.title}-${'meta' in item ? item.meta : item.time}`,
    label: '事件详情',
    title: item.title,
    description: item.description,
    tone: item.tone,
    meta: 'meta' in item ? item.meta : item.time
  });
}

function closeDrawer() {
  selectedNode.value = null;
  clearInsight();
}
</script>

<template>
  <div v-if="loading" class="situation-board situation-board--loading" aria-busy="true">
    <BaseSkeleton class="board-skeleton-title" width="360px" height="34px" />
    <section class="board-kpis">
      <article v-for="item in 4" :key="item" class="board-card kpi-card">
        <BaseSkeleton width="90px" height="12px" />
        <BaseSkeleton width="120px" height="28px" />
        <BaseSkeleton width="100%" height="12px" />
      </article>
    </section>
    <section class="board-grid">
      <article v-for="item in 6" :key="item" class="board-card">
        <BaseSkeleton width="100%" height="100%" />
      </article>
    </section>
  </div>

  <div v-else-if="page" class="situation-board">
    <header class="board-header">
      <div class="board-nav-dot">
        <span class="nav-light" />
        <span>{{ page.name }}总览</span>
      </div>
      <h1>{{ pageTitle }}</h1>
      <div class="board-clock">{{ dashboardTime }}</div>
    </header>

    <section class="board-kpis" aria-label="关键指标">
      <button
        v-for="item in topKpis"
        :key="item.label"
        type="button"
        class="board-card kpi-card"
        :class="toneClass(item.tone)"
        @click="selectKpi(item)"
      >
        <span class="kpi-label">{{ item.label }}</span>
        <strong class="kpi-value">{{ item.value }}<small>{{ item.unit }}</small></strong>
        <span class="kpi-foot">
          <span>{{ item.trend || item.description }}</span>
        </span>
      </button>
    </section>

    <section class="board-ticker" aria-label="态势摘要">
      <strong>{{ page.highlights[0]?.metric ?? statusText }}</strong>
      <span v-for="item in tickerKpis" :key="item.label" :class="toneClass(item.tone)">
        {{ item.label }} <b>{{ item.value }}{{ item.unit }}</b>
      </span>
      <span v-for="item in highlightItems" :key="item.title" :class="toneClass(item.tone)">
        {{ item.title }} <b>{{ item.metric }}</b>
      </span>
    </section>

    <section v-if="hasFilterResult" class="board-grid" :class="dashboardLayout.layoutClass" aria-label="态势驾驶舱">
      <div class="side-stack side-stack--left">
        <article
          v-for="panel in dashboardLayout.left"
          :key="panel.key"
          class="board-card dashboard-panel"
          :class="[`panel-${panel.key}`, toneClass(panel.accent)]"
        >
          <header class="panel-heading">
            <span>{{ panel.title }}</span>
            <small v-if="panel.description">{{ panel.description }}</small>
          </header>

          <div class="panel-body">
            <EChartWidget v-if="hasPanelOption(panel)" :option="panel.option" />
            <BaseEmpty v-else title="暂无数据" description="当前视图暂无可展示内容。" />
          </div>
        </article>
      </div>

      <article
        :key="dashboardLayout.centerTop.key"
        class="board-card dashboard-panel"
        :class="[`panel-${dashboardLayout.centerTop.key}`, toneClass(dashboardLayout.centerTop.accent)]"
      >
        <header class="panel-heading">
          <span>{{ dashboardLayout.centerTop.title }}</span>
          <small v-if="dashboardLayout.centerTop.description">{{ dashboardLayout.centerTop.description }}</small>
        </header>

        <div class="panel-body">
          <EChartWidget v-if="hasPanelOption(dashboardLayout.centerTop)" :option="dashboardLayout.centerTop.option" />
          <BaseEmpty v-else title="暂无数据" description="当前视图暂无可展示内容。" />
        </div>
      </article>

      <article
        :key="dashboardLayout.bottomCenter.key"
        class="board-card dashboard-panel"
        :class="[`panel-${dashboardLayout.bottomCenter.key}`, toneClass(dashboardLayout.bottomCenter.accent)]"
      >
        <header class="panel-heading">
          <span>{{ dashboardLayout.bottomCenter.title }}</span>
          <small v-if="dashboardLayout.bottomCenter.description">{{ dashboardLayout.bottomCenter.description }}</small>
        </header>

        <div class="panel-body">
          <EChartWidget v-if="hasPanelOption(dashboardLayout.bottomCenter)" :option="dashboardLayout.bottomCenter.option" />
          <BaseEmpty v-else title="暂无数据" description="当前视图暂无可展示内容。" />
        </div>
      </article>

      <div class="side-stack side-stack--right">
        <article
          v-for="panel in dashboardLayout.right"
          :key="panel.key"
          class="board-card dashboard-panel"
          :class="[`panel-${panel.key}`, toneClass(panel.accent)]"
        >
          <header class="panel-heading">
            <span>{{ panel.title }}</span>
            <small v-if="panel.description">{{ panel.description }}</small>
          </header>

          <div class="panel-body">
            <EChartWidget v-if="hasPanelOption(panel)" :option="panel.option" />
            <BaseEmpty v-else title="暂无数据" description="当前视图暂无可展示内容。" />
          </div>
        </article>

        <article class="board-card event-panel" :class="toneClass(dashboardLayout.eventPanel.accent)">
          <header class="panel-heading">
            <span>{{ dashboardLayout.eventPanel.title }}</span>
            <small>{{ dashboardLayout.eventPanel.description ?? statusText }}</small>
          </header>
          <div class="event-list">
            <button
              v-for="item in dashboardEventRows"
              :key="`${item.meta}-${item.title}`"
              type="button"
              class="event-row"
              :class="toneClass(item.tone)"
              @click="selectSignal(item.source)"
            >
              <time>{{ item.meta }}</time>
              <b>{{ item.label }}</b>
              <span>{{ item.title }}</span>
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-else class="board-card filter-empty-state" aria-live="polite">
      <BaseEmpty title="暂无态势内容" description="当前视图暂无可展示内容。" />
      <BaseButton variant="secondary" @click="loadPage">重新加载</BaseButton>
    </section>

    <DetailDrawerShell
      :open="drawerOpen"
      :title="drawerTitle"
      :subtitle="drawerSubtitle"
      :badges="drawerBadges"
      @close="closeDrawer"
    >
      <template v-if="selectedNode">
        <section class="drawer-section-stack">
          <article class="drawer-intro-card">
            <strong>{{ selectedNode.description || '该节点可结合当前态势指标继续研判。' }}</strong>
            <p>点击图表、事件流和关键指标，可在统一详情抽屉内完成下钻浏览。</p>
          </article>

          <div v-if="selectedNode.metrics?.length" class="drawer-fact-grid">
            <article v-for="metric in selectedNode.metrics" :key="metric.label" class="drawer-fact-card">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </article>
          </div>

          <div v-if="selectedNode.children?.length" class="drawer-related-list">
            <strong>关联子节点</strong>
            <button v-for="child in selectedNode.children" :key="child.id" type="button" class="drawer-related-item" @click="handleSelectNode(child)">
              <span>{{ child.name }}</span>
              <small>{{ child.description || '点击继续下钻' }}</small>
            </button>
          </div>
        </section>
      </template>

      <template v-else-if="selectedInsight">
        <section class="drawer-section-stack">
          <article class="drawer-intro-card">
            <strong>{{ selectedInsight.description }}</strong>
            <p>{{ selectedInsight.meta || '该洞察来源于当前页面的关键板块。' }}</p>
          </article>
          <div v-if="selectedInsight.metric" class="drawer-fact-grid">
            <article class="drawer-fact-card">
              <span>关键数值</span>
              <strong>{{ selectedInsight.metric }}</strong>
            </article>
          </div>
          <div v-if="selectedInsight.sourceSectionTitle" class="drawer-related-list">
            <strong>来源板块</strong>
            <div class="drawer-related-item static">
              <span>{{ selectedInsight.sourceSectionTitle }}</span>
              <small>{{ selectedInsight.sourceSectionCode }}</small>
            </div>
          </div>
        </section>
      </template>
    </DetailDrawerShell>
  </div>

  <BaseEmpty v-else title="态势页面加载失败" :description="errorDescription">
    <BaseButton class="retry-button" variant="secondary" @click="loadPage">重新加载</BaseButton>
  </BaseEmpty>
</template>

<style scoped>
.situation-board {
  position: relative;
  display: grid;
  grid-template-rows: 54px 102px 38px minmax(0, 1fr);
  gap: 8px;
  height: calc(100vh - var(--layout-page-padding) * 2);
  min-height: 680px;
  overflow: hidden;
  color: #eaf7ff;
}

.situation-board::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  background:
    radial-gradient(circle at 22% 8%, rgba(0, 229, 255, 0.12), transparent 24%),
    radial-gradient(circle at 76% 18%, rgba(105, 79, 255, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(6, 18, 36, 0.94), rgba(4, 14, 28, 0.98));
}

.situation-board > * {
  position: relative;
  z-index: 1;
}

.situation-board--loading {
  place-items: stretch;
}

.board-skeleton-title {
  justify-self: center;
}

.board-header {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 220px;
  align-items: center;
  min-height: 0;
  border-bottom: 1px solid rgba(18, 202, 255, 0.22);
}

.board-header h1 {
  margin: 0;
  text-align: center;
  font-size: clamp(24px, 2vw, 34px);
  font-weight: 500;
  letter-spacing: 0;
  color: #eafaff;
  text-shadow: 0 0 14px rgba(45, 226, 230, 0.42);
}

.board-nav-dot,
.board-clock {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-family-mono, monospace);
  color: #25e6ff;
  font-size: 15px;
  font-weight: 700;
}

.board-clock {
  justify-content: flex-end;
  font-size: 18px;
  letter-spacing: 1px;
}

.nav-light {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #1ce7ff;
  box-shadow: 0 0 16px rgba(28, 231, 255, 0.85);
}

.board-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  min-height: 0;
}

.board-card {
  min-width: 0;
  min-height: 0;
  border: 1px solid rgba(40, 177, 255, 0.24);
  border-radius: 7px;
  background: rgba(8, 24, 47, 0.78);
  box-shadow: inset 0 0 28px rgba(28, 124, 194, 0.08);
}

.kpi-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 4px;
  padding: 12px 16px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  border-left-width: 3px;
}

.kpi-label {
  color: rgba(222, 239, 255, 0.7);
  font-size: 12px;
}

.kpi-value {
  align-self: center;
  color: #19dcff;
  font-family: var(--font-family-mono, monospace);
  font-size: clamp(28px, 2.2vw, 38px);
  line-height: 1;
}

.kpi-value small {
  margin-left: 4px;
  color: rgba(222, 239, 255, 0.75);
  font-size: 12px;
}

.kpi-foot {
  overflow: hidden;
  color: #11f0b0;
  font-size: 11px;
  line-height: 1.25;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.board-ticker {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0 14px;
  border: 1px solid rgba(28, 140, 215, 0.28);
  border-radius: 6px;
  background: rgba(7, 28, 52, 0.72);
  color: rgba(218, 235, 255, 0.76);
  font-size: 12px;
  white-space: nowrap;
}

.board-ticker strong,
.board-ticker b {
  color: #22e4ff;
  font-family: var(--font-family-mono, monospace);
  font-size: 16px;
}

.board-grid {
  display: grid;
  grid-template-columns: minmax(250px, 0.82fr) minmax(0, 2.46fr) minmax(270px, 0.9fr);
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas:
    'leftStack centerTop rightStack'
    'leftStack bottomCenter rightStack';
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

.board-grid--security {
  grid-template-columns: minmax(250px, 0.86fr) minmax(0, 2.56fr) minmax(270px, 0.92fr);
}

.board-grid--business {
  grid-template-columns: minmax(248px, 0.84fr) minmax(0, 2.62fr) minmax(262px, 0.94fr);
}

.board-grid--terminal {
  grid-template-columns: minmax(244px, 0.84fr) minmax(0, 2.5fr) minmax(266px, 0.92fr);
}

.side-stack {
  display: grid;
  gap: 8px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.side-stack--left {
  grid-area: leftStack;
  grid-template-rows: minmax(0, 1.14fr) minmax(0, 0.86fr) minmax(0, 0.58fr);
}

.side-stack--right {
  grid-area: rightStack;
  grid-template-rows: minmax(0, 1fr) minmax(0, 0.74fr) minmax(0, 0.98fr);
}

.board-grid--security .side-stack--left {
  grid-template-rows: minmax(0, 1.06fr) minmax(0, 0.82fr) minmax(0, 0.92fr);
}

.board-grid--security .side-stack--right {
  grid-template-rows: minmax(0, 1fr) minmax(0, 0.78fr) minmax(0, 1.06fr);
}

.board-grid--business .side-stack--left {
  grid-template-rows: minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 0.96fr);
}

.board-grid--business .side-stack--right {
  grid-template-rows: minmax(0, 1fr) minmax(0, 0.76fr) minmax(0, 1fr);
}

.board-grid--terminal .side-stack--left {
  grid-template-rows: minmax(0, 1fr) minmax(0, 0.75fr) minmax(0, 0.9fr);
}

.board-grid--terminal .side-stack--right {
  grid-template-rows: minmax(0, 0.98fr) minmax(0, 0.74fr) minmax(0, 0.92fr);
}

.dashboard-panel,
.event-panel {
  display: grid;
  grid-template-rows: 34px minmax(0, 1fr);
  overflow: hidden;
}

.panel-centerTop {
  grid-area: centerTop;
}

.panel-bottomCenter {
  grid-area: bottomCenter;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px 4px;
  color: rgba(226, 244, 255, 0.78);
  font-size: 13px;
}

.panel-leftMini,
.panel-rightMini {
  grid-template-rows: 28px minmax(0, 1fr);
}

.panel-leftMini .panel-heading,
.panel-rightMini .panel-heading {
  padding-top: 6px;
  font-size: 12px;
}

.panel-leftMini .panel-heading small,
.panel-rightMini .panel-heading small {
  display: none;
}

.panel-heading span {
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.panel-heading small {
  overflow: hidden;
  max-width: 48%;
  color: rgba(140, 174, 204, 0.82);
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.panel-body {
  min-width: 0;
  min-height: 0;
  padding: 0 8px 8px;
}

.event-list {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  gap: 5px;
  min-height: 0;
  padding: 0 8px 8px;
  overflow: hidden;
}

.event-row {
  display: grid;
  grid-template-columns: 44px minmax(38px, auto) minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-width: 0;
  min-height: 0;
  padding: 0 8px;
  border: 1px solid rgba(28, 202, 255, 0.18);
  border-radius: 4px;
  background: rgba(8, 34, 60, 0.58);
  color: rgba(232, 245, 255, 0.84);
  text-align: left;
  cursor: pointer;
}

.event-row time {
  color: rgba(155, 190, 220, 0.86);
  font-family: var(--font-family-mono, monospace);
  font-size: 10px;
}

.event-row b {
  display: inline-flex;
  justify-content: center;
  max-width: 58px;
  padding: 2px 3px;
  overflow: hidden;
  border: 1px solid currentColor;
  border-radius: 3px;
  color: #19dcff;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.event-row span {
  overflow: hidden;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tone-success {
  border-color: rgba(34, 239, 171, 0.42);
}

.tone-warning {
  border-color: rgba(255, 213, 64, 0.48);
}

.tone-danger {
  border-color: rgba(255, 45, 95, 0.5);
}

.tone-info {
  border-color: rgba(34, 214, 255, 0.45);
}

.tone-success .kpi-value,
.tone-success b {
  color: #10ee9f;
}

.tone-warning .kpi-value,
.tone-warning b {
  color: #ffd43d;
}

.tone-danger .kpi-value,
.tone-danger b {
  color: #ff2d5f;
}

.tone-info .kpi-value,
.tone-info b {
  color: #19dcff;
}

.filter-empty-state {
  display: grid;
  place-items: center;
  padding: 24px;
}

.situation-board :deep(.chart-shell),
.situation-board :deep(.chart-box),
.situation-board :deep(.chart-loading),
.situation-board :deep(.chart-empty) {
  min-height: 0;
  height: 100%;
}

.situation-board :deep(.chart-loading .base-skeleton) {
  min-height: 0;
}

.drawer-section-stack {
  display: grid;
  gap: 14px;
}

.drawer-intro-card {
  padding: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-lg);
  background: rgba(9, 22, 39, 0.74);
}

.drawer-intro-card p {
  margin: 8px 0 0;
  color: var(--sys-color-text-secondary);
}

.drawer-fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.drawer-fact-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-md);
  background: rgba(9, 22, 39, 0.72);
}

.drawer-fact-card span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.drawer-related-list {
  display: grid;
  gap: 10px;
}

.drawer-related-list strong {
  font-size: var(--font-size-14);
}

.drawer-related-item {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-md);
  background: rgba(9, 22, 39, 0.72);
  color: inherit;
  text-align: left;
}

.drawer-related-item.static {
  cursor: default;
}

.drawer-related-item small {
  color: var(--sys-color-text-secondary);
}

@media (max-width: 1280px) {
  .situation-board {
    grid-template-rows: 48px 90px 34px minmax(0, 1fr);
    min-height: 640px;
    gap: 7px;
  }

  .board-header {
    grid-template-columns: minmax(150px, 0.7fr) minmax(0, 1.8fr) minmax(92px, 0.42fr);
  }

  .board-header h1 {
    font-size: 23px;
  }

  .board-grid {
    grid-template-columns: minmax(0, 0.86fr) minmax(0, 2.12fr) minmax(0, 0.94fr);
    gap: 7px;
  }

  .side-stack {
    gap: 7px;
  }

  .kpi-card {
    padding: 8px 10px;
  }

  .kpi-value {
    font-size: 25px;
  }

  .board-kpis {
    gap: 7px;
  }

  .board-ticker {
    gap: 18px;
    padding: 0 10px;
  }

  .panel-heading {
    padding-inline: 10px;
  }

  .panel-heading small {
    max-width: 42%;
  }

  .panel-body,
  .event-list {
    padding-inline: 7px;
  }

  .event-row {
    grid-template-columns: 42px minmax(34px, auto) minmax(0, 1fr);
    gap: 5px;
    padding-inline: 6px;
  }
}

@media (max-width: 980px) {
  .situation-board {
    display: flex;
    height: auto;
    min-height: calc(100vh - var(--layout-page-padding) * 2);
    overflow: visible;
  }

  .board-header,
  .board-kpis,
  .board-grid {
    width: 100%;
  }

  .board-header {
    grid-template-columns: 1fr;
    gap: 6px;
    padding-bottom: 8px;
  }

  .board-nav-dot,
  .board-clock {
    justify-content: center;
  }

  .board-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .board-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas:
      'centerTop'
      'bottomCenter'
      'leftStack'
      'rightStack';
    overflow: visible;
  }

  .dashboard-panel,
  .event-panel {
    min-height: 280px;
  }

  .side-stack {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .board-kpis {
    grid-template-columns: 1fr;
  }

  .board-ticker {
    gap: 14px;
    overflow-x: auto;
  }

  .drawer-fact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
