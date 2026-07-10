<template>
  <section class="overview-executive">
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
        <section class="resource-card glass-card">
          <header>
            <h3>重点保障对象</h3>
            <span>当前纳管 {{ totalCoverage }} 类</span>
          </header>
          <div class="resource-ring">
            <div class="resource-total">
              <strong>{{ totalCoverage }}</strong>
              <span>重点领域</span>
            </div>
            <div class="ring-segments">
              <div v-for="item in sourceItems" :key="item.name" class="ring-segment" :class="item.tone">
                <strong>{{ item.name }}</strong>
                <span>{{ item.status }}</span>
                <p>{{ item.coverage }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="resource-card glass-card">
          <header>
            <h3>保障资源概况</h3>
            <span>围绕运行、业务、终端持续监测</span>
          </header>
          <div class="bar-list">
            <article v-for="item in sourceBarItems" :key="item.label" class="bar-item">
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
            <h3>综合态势趋势</h3>
            <p>近 7 个周期告警与处置变化</p>
          </div>
          <div class="trend-legend">
            <span><i class="danger"></i>风险事件</span>
            <span><i class="success"></i>处置闭环</span>
          </div>
        </header>

        <div class="trend-plot">
          <div class="trend-grid-lines">
            <span v-for="line in 5" :key="line"></span>
          </div>

          <div class="trend-svg-wrap">
            <svg viewBox="0 0 100 44" preserveAspectRatio="none" class="trend-svg" aria-hidden="true">
              <path :d="trendAreaPath" class="trend-area"></path>
              <path :d="trendPathAlert" class="trend-line danger"></path>
              <path :d="trendPathClosed" class="trend-line success"></path>
              <circle
                v-for="point in alertPoints"
                :key="`alert-${point.x}-${point.y}`"
                class="trend-dot danger"
                :cx="point.x"
                :cy="point.y"
                r="1.1"
              />
              <circle
                v-for="point in closedPoints"
                :key="`closed-${point.x}-${point.y}`"
                class="trend-dot success"
                :cx="point.x"
                :cy="point.y"
                r="1.1"
              />
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
            <h3>事件处置情况</h3>
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
            <h3>实时事件流</h3>
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

interface SourceCardItem {
  name: string;
  status: string;
  description: string;
  sync: string;
  coverage: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}

const props = defineProps<{
  digestItems: SituationDigestItem[];
  feedItems: OperationalFeedItem[];
  sourceItems: SourceCardItem[];
}>();

const topStats = computed(() => [
  { label: '汇聚数据项', value: '76', unit: '项', description: '统一汇聚终端、安全、业务、运维四类信息', detail: '终端 23 项  业务 21 项  安全 18 项  运维 14 项', tone: 'info' as const },
  { label: '纳管对象数', value: '58', unit: '个', description: '重点对象均已纳入综合监测范围', detail: '终端 33 个  服务 9 个  设备 10 个  用户 6 个', tone: 'success' as const },
  { label: '综合安全指数', value: '59', unit: '%', description: '当前整体风险可控，局部存在待跟进事项', detail: '处置闭环 91%  修复完成 60%  合规达标 92%', tone: 'warning' as const },
  { label: '在线资产率', value: '71', unit: '%', description: '在线对象保持稳定，少量终端处于离线缓存', detail: '在线对象 27 个  总对象 38 个', tone: 'warning' as const }
]);

const signalItems = computed(() => [
  { label: '今日新增告警', value: '21 件', tone: 'info' as const },
  { label: '异常事件总数', value: '41 件', tone: 'danger' as const },
  { label: '本月异常行为', value: '41 次', tone: 'warning' as const },
  { label: '待处置事项', value: '47 件', tone: 'warning' as const },
  { label: '今日闭环处置', value: '21 件', tone: 'success' as const }
]);

const totalCoverage = computed(() => props.sourceItems.length);

const sourceBarItems = computed(() => [
  { label: '终端运行监测', value: '42', percent: 84, tone: 'info' as const },
  { label: '业务运行监测', value: '21', percent: 64, tone: 'success' as const },
  { label: '安全运行监测', value: '33', percent: 72, tone: 'warning' as const }
]);

const funnelItems = computed(() => [
  { label: '异常事件', value: '76', width: '92%', tone: 'info' as const },
  { label: '未处置事件', value: '47', width: '68%', tone: 'danger' as const },
  { label: '已处置事件', value: '29', width: '46%', tone: 'success' as const }
]);

const displayFeedItems = computed(() => {
  if (props.feedItems.length >= 5) {
    return props.feedItems.slice(0, 5);
  }

  return [
    { tag: '终端', title: '终端在线率保持高位，离线终端已进入逐台核查', description: '', meta: '21:10:24', tone: 'warning' as const },
    { tag: '安全', title: '高风险事件均已进入处置流程，当前无扩散迹象', description: '', meta: '21:09:24', tone: 'danger' as const },
    { tag: '业务', title: '密信与签阅主链路保持稳定，业务处理时效正常', description: '', meta: '21:08:24', tone: 'success' as const },
    { tag: '运维', title: '资源负载平稳，未发现影响主链路的异常波动', description: '', meta: '21:05:24', tone: 'info' as const },
    { tag: '处置', title: '重点事项已明确责任人和处置时限，持续跟踪闭环', description: '', meta: '21:03:24', tone: 'warning' as const }
  ];
});

const alertValues = [4, 41, 17, 15, 14, 7, 12];
const closedValues = [1, 10, 10, 6, 2, 5, 7];
const trendAxis = ['7-3', '7-4', '7-5', '7-6', '7-7', '7-8', '7-9'];

function toPoints(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value, index) => ({
    x: 4 + index * 15.3,
    y: 38 - (value / max) * 30
  }));
}

const alertPoints = toPoints(alertValues);
const closedPoints = toPoints(closedValues);

function pointsToPath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

const trendPathAlert = pointsToPath(alertPoints);
const trendPathClosed = pointsToPath(closedPoints);
const trendAreaPath = `${trendPathAlert} L ${alertPoints[alertPoints.length - 1].x} 40 L ${alertPoints[0].x} 40 Z`;
</script>

<style scoped>
.overview-executive {
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
.resource-card,
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
.resource-card header span,
.bar-head span,
.event-time,
.bottom-card span,
.bottom-card p,
.trend-header p,
.signal-item span {
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
.trend-legend i {
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
  grid-template-columns: 320px minmax(0, 1fr) 360px;
  gap: var(--layout-card-gap);
}

.left-stack,
.right-stack {
  display: grid;
  gap: var(--layout-card-gap);
}

.resource-card,
.trend-card,
.funnel-card,
.event-card,
.bottom-card {
  padding: var(--space-4);
}

.resource-card header,
.trend-header,
.funnel-card header,
.event-card header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.resource-card h3,
.trend-card h3,
.funnel-card h3,
.event-card h3 {
  margin: 0;
  color: #bfefff;
  font-size: var(--font-size-16);
}

.resource-ring {
  display: grid;
  gap: var(--space-4);
}

.resource-total {
  display: grid;
  place-items: center;
  min-height: 112px;
  border-radius: 50%;
  border: 10px solid rgba(107, 80, 255, 0.68);
  box-shadow: inset 0 0 0 8px rgba(27, 220, 255, 0.08);
}

.resource-total strong {
  font-size: 34px;
  color: #18daff;
}

.resource-total span { color: var(--sys-color-text-secondary); }

.ring-segments,
.bar-list,
.event-list {
  display: grid;
  gap: var(--space-3);
}

.ring-segment {
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: rgba(8, 18, 31, 0.76);
}

.ring-segment strong,
.bar-head strong,
.event-item p,
.bottom-card strong {
  color: #effcff;
}

.ring-segment span,
.ring-segment p {
  color: var(--sys-color-text-secondary);
}

.ring-segment p {
  margin: 4px 0 0;
  font-size: var(--font-size-12);
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
  min-height: 400px;
}

.trend-legend {
  display: flex;
  gap: var(--space-4);
  color: var(--sys-color-text-secondary);
}

.trend-plot {
  position: relative;
  height: calc(100% - 54px);
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
  fill: rgba(255, 67, 107, 0.14);
}

.trend-line {
  fill: none;
  stroke-width: 0.9;
}

.trend-line.danger { stroke: #ff2f5f; }
.trend-line.success { stroke: #12ea88; }
.trend-dot.danger { fill: #ff2f5f; }
.trend-dot.success { fill: #12ea88; }

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

@media (max-width: 1600px) {
  .main-grid {
    grid-template-columns: 280px minmax(0, 1fr) 320px;
  }
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
