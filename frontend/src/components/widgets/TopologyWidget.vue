<template>
  <div class="topology-wrap" role="img" :aria-label="ariaLabel">
    <div class="topology-stage-strip" aria-hidden="true">
      <span v-for="stage in stages" :key="stage">{{ stage }}</span>
    </div>

    <svg class="topology-scene" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="topology-core-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(45, 226, 230, 0.9)" />
          <stop offset="100%" stop-color="rgba(30, 136, 255, 0.9)" />
        </linearGradient>
        <filter id="topology-glow">
          <feGaussianBlur stdDeviation="1.4" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="topology-arrow-info" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="rgba(45, 226, 230, 0.76)" />
        </marker>
        <marker id="topology-arrow-success" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="rgba(61, 220, 151, 0.82)" />
        </marker>
        <marker id="topology-arrow-warning" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="rgba(255, 181, 71, 0.82)" />
        </marker>
        <marker id="topology-arrow-danger" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill="rgba(255, 107, 125, 0.82)" />
        </marker>
      </defs>

      <path
        v-for="link in sceneLinks"
        :key="`${link.from}-${link.to}`"
        class="topology-link"
        :class="`is-${link.tone}`"
        :d="link.path"
        :marker-end="`url(#topology-arrow-${link.tone})`"
      />

      <g class="core-rings" filter="url(#topology-glow)">
        <circle class="core-ring ring-outer" cx="50" cy="50" r="21" />
        <circle class="core-ring ring-middle" cx="50" cy="50" r="15.4" />
        <circle class="core-ring ring-inner" cx="50" cy="50" r="9.6" fill="url(#topology-core-gradient)" />
      </g>

      <text
        v-for="link in sceneLinks"
        :key="`${link.from}-${link.to}-label`"
        class="link-label"
        :x="link.labelX"
        :y="link.labelY"
      >
        {{ link.label }}
      </text>
    </svg>

    <div class="topology-overlay">
      <div class="core-node">
        <span class="core-chip">态势中枢</span>
        <strong>{{ coreTitle }}</strong>
        <p>{{ coreDescription }}</p>
        <dl class="core-metrics">
          <div v-for="item in coreMetrics" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </div>

      <article
        v-for="node in peripheralNodes"
        :key="node.id"
        class="node"
        :class="`is-${node.status}`"
        :style="{ left: `${node.x}%`, top: `${node.y}%` }"
      >
        <span class="node-status-dot" :class="`is-${node.status}`" />
        <strong>{{ node.name }}</strong>
        <span>{{ node.meta }}</span>
      </article>
    </div>

    <footer class="topology-footer">
      <div class="topology-legend">
        <span v-for="item in legendItems" :key="item.label">
          <i :class="`is-${item.tone}`" />
          {{ item.label }}
        </span>
      </div>
      <div class="topology-summary-grid">
        <article v-for="item in footerStats" :key="item.label" class="summary-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TopologyNode {
  id: string;
  name: string;
  meta: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  x: number;
  y: number;
}

interface TopologyLine {
  from: string;
  to: string;
}

interface SceneLink extends TopologyLine {
  label: string;
  tone: TopologyNode['status'];
  labelX: number;
  labelY: number;
  path: string;
}

const props = defineProps<{
  nodes: TopologyNode[];
  lines: TopologyLine[];
}>();

const stages = ['接入汇聚', '智能研判', '策略联动'];

const nodeMap = computed(() => new Map(props.nodes.map((node) => [node.id, node])));

const coreNode = computed(
  () => nodeMap.value.get('analysis') ?? props.nodes.find((node) => node.id.includes('analysis')) ?? props.nodes[0] ?? null
);

const peripheralNodes = computed(() => props.nodes.filter((node) => node.id !== coreNode.value?.id));

const linkMeta: Record<string, { label: string; tone: TopologyNode['status'] }> = {
  'gateway-collector': { label: '链路汇聚', tone: 'info' },
  'collector-analysis': { label: '数据归一', tone: 'info' },
  'mail-analysis': { label: '业务画像', tone: 'success' },
  'analysis-sign': { label: '流转评估', tone: 'warning' },
  'analysis-zt': { label: '策略联动', tone: 'warning' },
  'analysis-defense': { label: '行为采集', tone: 'success' },
  'analysis-db': { label: '实时归档', tone: 'info' },
  'zt-screen': { label: '展示推送', tone: 'success' },
  'sign-screen': { label: '签批态势', tone: 'warning' }
};

const sceneLinks = computed<SceneLink[]>(() =>
  props.lines.flatMap((line) => {
    const from = nodeMap.value.get(line.from);
    const to = nodeMap.value.get(line.to);

    if (!from || !to) {
      return [];
    }

    const meta = linkMeta[`${line.from}-${line.to}`] ?? { label: '链路同步', tone: 'info' as const };
    const midpointX = (from.x + to.x) / 2;
    const midpointY = (from.y + to.y) / 2;
    const controlX = midpointX + (to.y - from.y) * 0.08;
    const controlY = midpointY - (to.x - from.x) * 0.04;

    return [
      {
        ...line,
        ...meta,
        labelX: midpointX,
        labelY: midpointY - 2,
        path: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`
      }
    ];
  })
);

const healthyNodeCount = computed(() => props.nodes.filter((node) => node.status === 'success' || node.status === 'info').length);
const attentionNodeCount = computed(() => props.nodes.filter((node) => node.status === 'warning' || node.status === 'danger').length);

const coreTitle = computed(() => coreNode.value?.name ?? '业务安全态势中枢');
const coreDescription = computed(() => coreNode.value?.meta ?? '聚合接入、分析研判与策略联动的主控核心');

const coreMetrics = computed(() => [
  { label: '接入节点', value: `${props.nodes.length} 个` },
  { label: '联动链路', value: `${props.lines.length} 条` },
  { label: '关注告警', value: `${attentionNodeCount.value} 项` }
]);

const footerStats = computed(() => [
  { label: '健康节点', value: `${healthyNodeCount.value}/${props.nodes.length}` },
  { label: '高优链路', value: `${sceneLinks.value.filter((item) => item.tone === 'warning' || item.tone === 'danger').length} 条` },
  { label: '运行归档', value: sceneLinks.value.some((item) => item.label === '实时归档') ? '已启用' : '正常' }
]);

const legendItems = [
  { label: '采集 / 传输', tone: 'info' as const },
  { label: '稳定 / 正常', tone: 'success' as const },
  { label: '策略 / 告警', tone: 'warning' as const }
];

const ariaLabel = computed(() => `${coreTitle.value}拓扑图，当前展示 ${props.nodes.length} 个节点与 ${props.lines.length} 条链路`);
</script>

<style scoped>
.topology-wrap {
  position: relative;
  min-height: 440px;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 1px solid var(--sys-color-border-secondary);
  background:
    radial-gradient(circle at 50% 50%, rgba(30, 136, 255, 0.16), transparent 24%),
    linear-gradient(var(--sys-color-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--sys-color-grid-line) 1px, transparent 1px),
    linear-gradient(180deg, rgba(12, 24, 40, 0.98), rgba(8, 17, 31, 0.96));
  background-size: auto, 38px 38px, 38px 38px, auto;
}

.topology-wrap::before {
  content: '';
  position: absolute;
  inset: 24px;
  border-radius: calc(var(--radius-xl) - 8px);
  border: 1px solid rgba(91, 151, 255, 0.08);
  pointer-events: none;
}

.topology-stage-strip {
  position: absolute;
  inset: 18px 18px auto;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.topology-stage-strip span {
  flex: 1;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(91, 151, 255, 0.16);
  background: rgba(12, 28, 48, 0.64);
  color: var(--sys-color-text-tertiary);
  font-size: var(--font-size-12);
  letter-spacing: 0.08em;
  text-align: center;
}

.topology-scene,
.topology-overlay {
  position: absolute;
  inset: 0;
}

.topology-overlay {
  z-index: 1;
}

.topology-scene {
  width: 100%;
  height: 100%;
}

.topology-link {
  fill: none;
  stroke-width: 0.42;
  stroke-dasharray: 2.4 1.7;
  opacity: 0.86;
}

.topology-link.is-info {
  stroke: rgba(45, 226, 230, 0.72);
}

.topology-link.is-success {
  stroke: rgba(61, 220, 151, 0.72);
}

.topology-link.is-warning {
  stroke: rgba(255, 181, 71, 0.78);
}

.topology-link.is-danger {
  stroke: rgba(255, 107, 125, 0.82);
}

.core-ring {
  fill: transparent;
  stroke: rgba(45, 226, 230, 0.26);
}

.ring-outer {
  stroke-width: 0.4;
  stroke-dasharray: 2.2 1.4;
}

.ring-middle {
  stroke-width: 0.28;
  stroke: rgba(30, 136, 255, 0.42);
}

.ring-inner {
  stroke-width: 0.2;
  stroke: rgba(219, 233, 255, 0.4);
}

.link-label {
  fill: rgba(217, 232, 255, 0.66);
  font-size: 2.25px;
  text-anchor: middle;
}

.core-node {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  width: clamp(180px, 18vw, 232px);
  transform: translate(-50%, -50%);
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(91, 151, 255, 0.36);
  background:
    linear-gradient(180deg, rgba(17, 39, 64, 0.92), rgba(8, 18, 33, 0.94)),
    radial-gradient(circle at top, rgba(45, 226, 230, 0.16), transparent 62%);
  box-shadow:
    0 0 0 1px rgba(45, 226, 230, 0.08) inset,
    0 16px 48px rgba(2, 10, 22, 0.42),
    0 0 48px rgba(30, 136, 255, 0.18);
}

.core-chip {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: rgba(45, 226, 230, 0.14);
  color: var(--sys-color-status-info-text);
  font-size: var(--font-size-12);
  letter-spacing: 0.08em;
}

.core-node strong {
  display: block;
  margin-top: var(--space-4);
  font-size: var(--font-size-18);
  line-height: 1.3;
}

.core-node p {
  margin: var(--space-3) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  line-height: 1.6;
}

.core-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin: var(--space-5) 0 0;
}

.core-metrics div {
  padding: 10px 8px;
  border-radius: var(--radius-lg);
  background: rgba(12, 26, 44, 0.68);
  border: 1px solid rgba(91, 151, 255, 0.12);
}

.core-metrics dt {
  color: var(--sys-color-text-secondary);
  font-size: 11px;
}

.core-metrics dd {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-bold);
}

.node {
  position: absolute;
  z-index: 2;
  width: clamp(104px, 13vw, 176px);
  padding: 12px 14px;
  border-radius: 18px;
  transform: translate(-50%, -50%);
  background: rgba(8, 20, 36, 0.9);
  border: 1px solid rgba(91, 151, 255, 0.2);
  box-shadow: 0 10px 30px rgba(2, 8, 20, 0.28);
  backdrop-filter: blur(4px);
}

.node-status-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
}

.node strong {
  display: block;
  padding-right: 14px;
  font-size: var(--font-size-14);
  line-height: 1.4;
}

.node span:last-child {
  display: block;
  margin-top: var(--space-2);
  color: var(--sys-color-text-secondary);
  font-size: 11px;
  line-height: 1.5;
}

.node.is-success {
  border-color: rgba(61, 220, 151, 0.26);
  box-shadow: 0 10px 30px rgba(2, 8, 20, 0.28), 0 0 0 1px rgba(61, 220, 151, 0.12) inset;
}

.node.is-warning {
  border-color: rgba(255, 181, 71, 0.28);
  box-shadow: 0 10px 30px rgba(2, 8, 20, 0.28), 0 0 0 1px rgba(255, 181, 71, 0.12) inset;
}

.node.is-danger {
  border-color: rgba(255, 107, 125, 0.28);
  box-shadow: 0 10px 30px rgba(2, 8, 20, 0.28), 0 0 0 1px rgba(255, 107, 125, 0.14) inset;
}

.node.is-info {
  border-color: rgba(45, 226, 230, 0.28);
  box-shadow: 0 10px 30px rgba(2, 8, 20, 0.28), 0 0 0 1px rgba(45, 226, 230, 0.14) inset;
}

.node-status-dot.is-success {
  color: var(--sys-color-status-success);
  background: var(--sys-color-status-success);
}

.node-status-dot.is-warning {
  color: var(--sys-color-status-warning);
  background: var(--sys-color-status-warning);
}

.node-status-dot.is-danger {
  color: var(--sys-color-status-danger);
  background: var(--sys-color-status-danger);
}

.node-status-dot.is-info {
  color: var(--sys-color-status-info);
  background: var(--sys-color-status-info);
}

.topology-footer {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
}

.topology-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.topology-legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 10px;
  border-radius: var(--radius-pill);
  background: rgba(9, 19, 34, 0.72);
  border: 1px solid rgba(91, 151, 255, 0.14);
  color: var(--sys-color-text-tertiary);
  font-size: 11px;
}

.topology-legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.topology-legend i.is-info {
  background: var(--sys-color-status-info);
}

.topology-legend i.is-success {
  background: var(--sys-color-status-success);
}

.topology-legend i.is-warning {
  background: var(--sys-color-status-warning);
}

.topology-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  min-width: min(460px, 48%);
}

.summary-card {
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(9, 21, 39, 0.82);
  border: 1px solid rgba(91, 151, 255, 0.14);
}

.summary-card span {
  display: block;
  color: var(--sys-color-text-secondary);
  font-size: 11px;
}

.summary-card strong {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--font-size-14);
}

@media (max-width: 1100px) {
  .topology-wrap {
    min-height: 520px;
  }

  .topology-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .topology-summary-grid {
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .topology-wrap {
    min-height: 620px;
  }

  .topology-stage-strip {
    inset: 14px 14px auto;
  }

  .topology-stage-strip span {
    padding-inline: 8px;
    font-size: 11px;
  }

  .core-node {
    width: min(220px, calc(100% - 48px));
    padding: 16px;
  }

  .core-metrics {
    grid-template-columns: 1fr;
  }

  .topology-summary-grid {
    grid-template-columns: 1fr;
  }

  .topology-footer {
    left: 14px;
    right: 14px;
    bottom: 14px;
  }

  .node {
    padding: 10px 12px;
  }

  .link-label {
    display: none;
  }
}
</style>
