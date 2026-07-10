<template>
  <section class="business-executive">
    <section class="top-kpi-row">
      <article v-for="item in topStats" :key="item.label" class="top-kpi-card glass-card" :class="item.tone">
        <div class="top-kpi-label">{{ item.label }}</div>
        <div class="top-kpi-value-row">
          <strong>{{ item.value }}</strong>
          <span v-if="item.unit">{{ item.unit }}</span>
        </div>
        <p>{{ item.description }}</p>
        <div class="top-kpi-foot">{{ item.detail }}</div>
      </article>
    </section>

    <section class="signal-strip glass-card">
      <div v-for="item in signalItems" :key="item.label" class="signal-item">
        <i :class="item.tone"></i>
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="main-grid">
      <aside class="left-stack">
        <section class="panel-card glass-card">
          <header>
            <h3>业务结构概览</h3>
            <span>当前纳管 4 类核心业务</span>
          </header>
          <div class="donut-summary">
            <div class="donut-core">
              <strong>89.1%</strong>
              <span>办结率</span>
            </div>
            <div class="legend-list">
              <article v-for="item in categoryItems" :key="item.label" class="legend-item">
                <i :class="item.tone"></i>
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </article>
            </div>
          </div>
        </section>

        <section class="panel-card glass-card">
          <header>
            <h3>业务资源概况</h3>
            <span>重点链路持续监测</span>
          </header>
          <div class="bar-list">
            <article v-for="item in barItems" :key="item.label" class="bar-item">
              <div class="bar-head">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :class="item.tone" :style="{ width: `${item.percent}%` }"></div>
              </div>
            </article>
          </div>
        </section>
      </aside>

      <section class="trend-card glass-card">
        <header class="trend-header">
          <div>
            <h3>业务处理趋势</h3>
            <p>近 7 个周期业务总量与异常回退变化</p>
          </div>
          <div class="trend-legend">
            <span><i class="info"></i>业务总量</span>
            <span><i class="warning"></i>异常回退</span>
          </div>
        </header>

        <div class="trend-plot">
          <div class="trend-grid-lines">
            <span v-for="line in 5" :key="line"></span>
          </div>

          <div class="trend-svg-wrap">
            <svg viewBox="0 0 100 44" preserveAspectRatio="none" class="trend-svg" aria-hidden="true">
              <path :d="volumeAreaPath" class="trend-area"></path>
              <path :d="volumePath" class="trend-line info"></path>
              <path :d="rollbackPath" class="trend-line warning"></path>
              <circle v-for="point in volumePoints" :key="`v-${point.x}-${point.y}`" class="trend-dot info" :cx="point.x" :cy="point.y" r="1.1" />
              <circle v-for="point in rollbackPoints" :key="`r-${point.x}-${point.y}`" class="trend-dot warning" :cx="point.x" :cy="point.y" r="1.1" />
            </svg>
          </div>

          <div class="trend-axis">
            <span v-for="item in trendAxis" :key="item">{{ item }}</span>
          </div>
        </div>
      </section>

      <aside class="right-stack">
        <section class="funnel-card glass-card">
          <header>
            <h3>流转处置情况</h3>
          </header>
          <div class="funnel-body">
            <div v-for="item in funnelItems" :key="item.label" class="funnel-segment" :class="item.tone" :style="{ width: item.width }">
              <strong>{{ item.label }}</strong>
              <span>{{ item.value }}</span>
            </div>
          </div>
        </section>

        <section class="event-card glass-card">
          <header>
            <h3>实时业务流</h3>
          </header>
          <div class="event-list">
            <article v-for="item in displayFeedItems" :key="item.title" class="event-item">
              <span class="event-time">{{ item.meta }}</span>
              <span class="event-tag" :class="item.tone">{{ item.tag }}</span>
              <p>{{ item.title }}</p>
            </article>
          </div>
        </section>
      </aside>
    </section>

    <section class="bottom-grid">
      <article v-for="item in digestItems" :key="item.label" class="bottom-card glass-card" :class="item.tone">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <p>{{ item.description }}</p>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { OperationalFeedItem, SituationDigestItem } from '@/composables/useDashboardInsights';
import { computed } from 'vue';

const props = defineProps<{
  digestItems: SituationDigestItem[];
  feedItems: OperationalFeedItem[];
  lastUpdated: string;
}>();

const topStats = computed(() => [
  { label: '当日业务量', value: '8942', unit: '笔', description: '峰值集中在 16:00 至 19:00', detail: '密信 3421  签阅 2278  电报 1987  数字信封 1256', tone: 'info' as const },
  { label: '办结率', value: '89.1', unit: '%', description: '跨部门流转整体保持平稳', detail: '已办结 68%  处理中 21%  待签收 11%', tone: 'success' as const },
  { label: '加解密总量', value: '1486', unit: '次', description: '数字信封链路稳定运行', detail: '加密 834  解密 652  跨系统占比持续提升', tone: 'warning' as const },
  { label: '业务成功率', value: '98.3', unit: '%', description: '核心通道运行稳定可控', detail: '超时 17 条  回退 6 次  当前无大面积积压', tone: 'success' as const }
]);

const signalItems = computed(() => [
  { label: '今日办结', value: '214 笔', tone: 'success' as const },
  { label: '签阅高峰', value: '17 条超时', tone: 'warning' as const },
  { label: '归档延迟', value: '8 分钟', tone: 'info' as const },
  { label: '异常回退', value: '6 次', tone: 'warning' as const },
  { label: '主链路状态', value: '整体稳定', tone: 'info' as const }
]);

const categoryItems = computed(() => [
  { label: '密信投递', value: '34%', tone: 'info' as const },
  { label: '签阅流转', value: '28%', tone: 'success' as const },
  { label: '电报收发', value: '22%', tone: 'warning' as const },
  { label: '数字信封', value: '16%', tone: 'danger' as const }
]);

const barItems = computed(() => [
  { label: '业务处理时效', value: '91', percent: 91, tone: 'info' as const },
  { label: '签阅链路稳定', value: '83', percent: 83, tone: 'success' as const },
  { label: '归档同步效率', value: '79', percent: 79, tone: 'warning' as const }
]);

const funnelItems = computed(() => [
  { label: '业务总量', value: '8942', width: '92%', tone: 'info' as const },
  { label: '处理中', value: '1876', width: '68%', tone: 'warning' as const },
  { label: '已办结', value: '7066', width: '52%', tone: 'success' as const }
]);

const displayFeedItems = computed(() => {
  if (props.feedItems.length >= 5) {
    return props.feedItems.slice(0, 5);
  }

  return [
    { tag: '签阅', title: '签阅流转在高峰时段出现波峰，相关部门已同步跟进', description: '', meta: '21:12:24', tone: 'warning' as const },
    { tag: '归档', title: '归档同步存在轻微延迟，但未影响主流程办理', description: '', meta: '21:10:24', tone: 'info' as const },
    { tag: '业务', title: '密信、电报和数字信封主通道运行稳定', description: '', meta: '21:08:24', tone: 'success' as const },
    { tag: '回退', title: '异常回退均已进入恢复流程，暂无长时间积压', description: '', meta: '21:05:24', tone: 'warning' as const },
    { tag: '办理', title: '业务成功率维持高位，重点保障对象运行正常', description: '', meta: '21:03:24', tone: 'info' as const }
  ];
});

const volumeValues = [320, 342, 356, 388, 410, 394, 402];
const rollbackValues = [3, 4, 6, 3, 4, 2, 3];
const trendAxis = ['7-3', '7-4', '7-5', '7-6', '7-7', '7-8', '7-9'];

function toPoints(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value, index) => ({
    x: 4 + index * 15.3,
    y: 38 - (value / max) * 30
  }));
}

const volumePoints = toPoints(volumeValues);
const rollbackPoints = toPoints(rollbackValues);

function pointsToPath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

const volumePath = pointsToPath(volumePoints);
const rollbackPath = pointsToPath(rollbackPoints);
const volumeAreaPath = `${volumePath} L ${volumePoints[volumePoints.length - 1].x} 40 L ${volumePoints[0].x} 40 Z`;
</script>

<style scoped>
.business-executive {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.top-kpi-row,
.bottom-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--layout-card-gap);
}

.top-kpi-card,
.signal-strip,
.panel-card,
.trend-card,
.funnel-card,
.event-card,
.bottom-card {
  border: 1px solid rgba(60, 180, 255, 0.16);
  background: linear-gradient(180deg, rgba(8, 23, 42, 0.98), rgba(7, 20, 36, 0.94));
}

.top-kpi-card {
  padding: var(--space-4);
}

.top-kpi-label,
.top-kpi-card p,
.top-kpi-foot,
.panel-card header span,
.bar-head span,
.event-time,
.bottom-card span,
.bottom-card p,
.trend-header p,
.signal-item span,
.legend-item span {
  color: var(--sys-color-text-secondary);
}

.top-kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.top-kpi-value-row strong {
  font-size: clamp(28px, 2vw, 36px);
  line-height: 1;
}

.top-kpi-value-row span {
  font-size: var(--font-size-15);
}

.top-kpi-card p {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-12);
}

.top-kpi-foot {
  margin-top: var(--space-2);
  font-size: var(--font-size-12);
}

.top-kpi-card.info strong { color: #17d9ff; }
.top-kpi-card.success strong { color: #12ea88; }
.top-kpi-card.warning strong { color: #ffd447; }
.top-kpi-card.danger strong { color: #ff436b; }

.signal-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
}

.signal-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.signal-item i,
.trend-legend i,
.legend-item i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.info { background: #17d9ff; }
.success { background: #12ea88; }
.warning { background: #ffd447; }
.danger { background: #ff436b; }

.signal-item strong {
  color: #effcff;
  font-size: var(--font-size-16);
}

.main-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 340px;
  gap: var(--layout-card-gap);
}

.left-stack,
.right-stack {
  display: grid;
  gap: var(--layout-card-gap);
}

.panel-card,
.trend-card,
.funnel-card,
.event-card,
.bottom-card {
  padding: var(--space-4);
}

.panel-card header,
.trend-header,
.funnel-card header,
.event-card header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.panel-card h3,
.trend-card h3,
.funnel-card h3,
.event-card h3 {
  margin: 0;
  color: #bfefff;
  font-size: var(--font-size-16);
}

.donut-summary {
  display: grid;
  gap: var(--space-3);
}

.donut-core {
  display: grid;
  place-items: center;
  min-height: 104px;
  border-radius: 50%;
  border: 10px solid rgba(255, 181, 71, 0.68);
  box-shadow: inset 0 0 0 8px rgba(27, 220, 255, 0.08);
}

.donut-core strong {
  font-size: 32px;
  color: #ffd447;
}

.donut-core span { color: var(--sys-color-text-secondary); }

.legend-list,
.bar-list,
.event-list {
  display: grid;
  gap: var(--space-3);
}

.legend-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: center;
}

.legend-item strong,
.bar-head strong,
.event-item p,
.bottom-card strong {
  color: #effcff;
}

.bar-item {
  display: grid;
  gap: var(--space-2);
}

.bar-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.bar-track {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
}

.bar-fill.info { background: linear-gradient(90deg, #0fb8ff, #2ee7ff); }
.bar-fill.success { background: linear-gradient(90deg, #12d879, #23f1a4); }
.bar-fill.warning { background: linear-gradient(90deg, #f7c942, #ff9f43); }

.trend-card {
  min-height: 390px;
}

.trend-legend {
  display: flex;
  gap: var(--space-4);
  color: var(--sys-color-text-secondary);
}

.trend-plot {
  position: relative;
  height: calc(100% - 48px);
}

.trend-grid-lines {
  position: absolute;
  inset: 8px 0 42px;
  display: grid;
}

.trend-grid-lines span {
  border-top: 1px dashed rgba(117, 221, 255, 0.1);
}

.trend-svg-wrap {
  position: absolute;
  inset: 0 0 34px;
}

.trend-svg {
  width: 100%;
  height: 100%;
}

.trend-area {
  fill: rgba(23, 217, 255, 0.14);
}

.trend-line {
  fill: none;
  stroke-width: 0.9;
}

.trend-line.info { stroke: #17d9ff; }
.trend-line.warning { stroke: #ffd447; }
.trend-dot.info { fill: #17d9ff; }
.trend-dot.warning { fill: #ffd447; }

.trend-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  color: var(--sys-color-text-secondary);
}

.funnel-body {
  display: grid;
  place-items: center;
  gap: var(--space-2);
  min-height: 170px;
  padding-top: var(--space-3);
}

.funnel-segment {
  display: grid;
  place-items: center;
  height: 40px;
  clip-path: polygon(10% 0, 90% 0, 78% 100%, 22% 100%);
  color: #06111f;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-13);
}

.event-list {
  max-height: 210px;
  overflow: auto;
}

.event-item {
  display: grid;
  grid-template-columns: 64px 50px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: start;
  padding: 10px 0;
  border-bottom: 1px solid rgba(117, 221, 255, 0.08);
}

.event-tag {
  display: inline-flex;
  justify-content: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  color: #06111f;
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.event-item p {
  margin: 0;
  line-height: var(--line-height-base);
}

.bottom-card strong {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--font-size-22);
}

.bottom-card p {
  margin: 6px 0 0;
  font-size: var(--font-size-12);
}

@media (max-width: 1280px) {
  .top-kpi-row,
  .bottom-grid,
  .signal-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .top-kpi-row,
  .bottom-grid,
  .signal-strip {
    grid-template-columns: 1fr;
  }

  .main-grid {
    gap: var(--space-3);
  }

  .event-item {
    grid-template-columns: 1fr;
  }
}
</style>
