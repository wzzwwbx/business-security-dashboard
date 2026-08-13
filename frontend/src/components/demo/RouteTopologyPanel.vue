<script setup lang="ts">
import { demoSituationScenario } from '@/mocks/demoSituation';
import type { DemoRoute, DemoRouteHop, DemoRouteStatus } from '@/types/demoSituation';
import { computed } from 'vue';

const props = defineProps<{
  countryCode: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const primary = computed(() => demoSituationScenario.routes.find((route) => route.countryCode === props.countryCode && route.kind === 'primary'));
const backup = computed(() => demoSituationScenario.routes.find((route) => route.countryCode === props.countryCode && route.kind === 'backup'));
const active = computed(() => (primary.value && primary.value.status !== 'switched' ? primary.value : backup.value));
const policy = computed(() => demoSituationScenario.routeSwitches.find((item) => item.countryCode === props.countryCode));

const regionName = computed(() => {
  const region = demoSituationScenario.regions.find((item) => item.countryCode === props.countryCode);
  return region ? (region.countryCode === 'CN' ? '北京' : region.countryName) : props.countryCode;
});

const routeName = computed(() => active.value?.name ?? '');
const underAttack = computed(() => primary.value?.status === 'attacked' || primary.value?.status === 'switching');
const switched = computed(() => primary.value?.status === 'switched');
const backupActive = computed(() => backup.value?.status === 'active');

function statusLabel(route: DemoRoute | undefined) {
  if (!route) return '';
  if (route.kind === 'backup') return route.status === 'active' ? '备用生效' : '备用待命';
  const labels: Record<DemoRouteStatus, string> = {
    normal: '运行正常',
    attacked: '遭受攻击',
    switching: '策略切换中',
    switched: '已切换停用',
    restoring: '回切中'
  };
  return labels[route.status];
}

function statusClass(route: DemoRoute | undefined) {
  if (!route) return 'st-normal';
  if (route.kind === 'backup') return route.status === 'active' ? 'st-active' : 'st-standby';
  return `st-${route.status}`;
}

function policyTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// —— 拓扑节点链构建 ——
type TopoNodeType = 'origin' | 'router' | 'switch' | 'satellite' | 'gateway' | 'site';

interface TopoNode {
  id: string;
  name: string;
  type: TopoNodeType;
  status: 'normal' | 'degraded' | 'blocked';
  hop?: DemoRouteHop;
}

function nodeTypeOf(hop: DemoRouteHop | undefined): TopoNodeType {
  switch (hop?.type) {
    case 'satellite': return 'satellite';
    case 'gateway': return 'gateway';
    case 'submarine': return 'switch';
    default: return 'router';
  }
}

function nodeChain(route: DemoRoute | undefined): TopoNode[] {
  if (!route) return [];
  return [
    { id: `${route.id}-origin`, name: '北京接入中心', type: 'origin', status: 'normal' },
    ...route.hops.map((hop, index) => ({
      id: hop.id,
      name: hop.name,
      type: nodeTypeOf(hop),
      status: hop.status,
      hop
    })),
    { id: `${route.id}-site`, name: regionName.value, type: 'site' as TopoNodeType, status: 'normal' }
  ];
}

const primaryChain = computed(() => nodeChain(primary.value));
const backupChain = computed(() => nodeChain(backup.value));

// 节点行坐标：横向等距。
const SVG_W = 860;
const SVG_H = 252;
const ROW_TOP = 92;
const ROW_BOTTOM = 192;
const X_PAD = 44;

function rowPositions(count: number, y: number) {
  const step = count <= 1 ? 0 : (SVG_W - X_PAD * 2) / (count - 1);
  return Array.from({ length: count }, (_, index) => ({ x: X_PAD + index * step, y }));
}

function edgeColor(status: TopoNode['status'], dimmed: boolean) {
  if (dimmed) return '#4a5a72';
  return status === 'blocked' ? '#ef6579' : status === 'degraded' ? '#e9b949' : '#5a95ff';
}

// —— 节点图标 ——
const ICONS: Record<TopoNodeType, string> = {
  origin: '<rect x="3" y="6" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 6 V4 h8 v2 M12 10 v4 M10 12 h4" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  router: '<rect x="4" y="7" width="16" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M1 9 l4 3 l-4 3 M23 9 l-4 3 l4 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  switch: '<rect x="4" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 10 v4 M11 10 v4 M15 10 v4 M8 9 h6 M8 15 h6" stroke="currentColor" stroke-width="1.2" fill="none"/>',
  satellite: '<path d="M8 16 L12 5 L16 16 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 16 h16 M8 13 h8 M4 19 h16" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  gateway: '<path d="M12 20 V8 M6 20 h12 M12 8 l-5 6 h10 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  site: '<circle cx="12" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 17 v5 M7 22 h10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
};

const TYPE_LABELS: Record<TopoNodeType, string> = {
  origin: '接入中心',
  router: '路由器',
  switch: '交换机',
  satellite: '卫星',
  gateway: '信关站',
  site: '站点'
};

function nodeStatusClass(status: TopoNode['status']) {
  return status === 'blocked' ? 'st-blocked' : status === 'degraded' ? 'st-degraded' : 'st-normal';
}

function hopDetail(hop: DemoRouteHop | undefined) {
  if (!hop) return '';
  return `${hop.latencyMs}ms · 丢包 ${hop.packetLossPct.toFixed(1)}% · ${hop.throughputMbps.toFixed(1)} Mbps`;
}

// 边样式：正常蓝 / 降级黄 / 阻断红闪。
function edgeClass(chain: TopoNode[], index: number) {
  const hop = chain[index + 1]?.hop;
  const status = hop?.status ?? 'normal';
  if (status === 'blocked') return 'tp-edge tp-edge-attacked';
  if (status === 'degraded') return 'tp-edge tp-edge-degraded';
  return 'tp-edge';
}
</script>

<template>
  <aside class="topology-panel" aria-label="多跳线路拓扑">
    <header class="tp-header">
      <div class="tp-title">
        <strong>{{ regionName }} · 多跳线路拓扑</strong>
        <small>{{ routeName }}</small>
      </div>
      <span class="tp-badge" :class="statusClass(active)">{{ statusLabel(active) }}</span>
      <button type="button" class="tp-close" aria-label="关闭" @click="emit('close')">×</button>
    </header>

    <div class="tp-meta">
      <span>总时延 <b>{{ active?.latencyMs ?? 0 }} ms</b></span>
      <span>中继 <b>{{ active?.hops.length ?? 0 }}</b> 跳</span>
      <span v-if="switched">当前线路：<b class="tp-ok">备用线路</b></span>
      <span v-else>当前线路：<b class="tp-ok">主线路</b></span>
    </div>

    <!-- 拓扑图：主路径（或当前生效路径） + 备用路径（切换后） -->
    <div class="tp-topology">
      <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="tp-svg" role="img" aria-label="多跳拓扑">
        <defs>
          <marker id="tp-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="#5a95ff" />
          </marker>
        </defs>

        <!-- 主路径边 -->
        <g v-for="(node, index) in primaryChain" :key="`pe-${index}`">
          <line
            v-if="index < primaryChain.length - 1"
            :x1="rowPositions(primaryChain.length, ROW_TOP)[index].x"
            :y1="ROW_TOP"
            :x2="rowPositions(primaryChain.length, ROW_TOP)[index + 1].x"
            :y2="ROW_TOP"
            :class="[edgeClass(primaryChain, index), { 'tp-edge-dim': switched }]"
          />
        </g>

        <!-- 备用路径边：待命灰色虚线，切换生效后绿色点亮 -->
        <g v-if="backupChain.length">
          <line
            v-for="(node, index) in backupChain.slice(0, -1)"
            :key="`be-${index}`"
            :x1="rowPositions(backupChain.length, ROW_BOTTOM)[index].x"
            :y1="ROW_BOTTOM"
            :x2="rowPositions(backupChain.length, ROW_BOTTOM)[index + 1].x"
            :y2="ROW_BOTTOM"
            :class="backupActive ? 'tp-edge tp-edge-backup' : 'tp-edge tp-edge-standby'"
          />
        </g>

        <!-- 主路径节点 -->
        <g v-for="(node, index) in primaryChain" :key="`pn-${node.id}`" :transform="`translate(${rowPositions(primaryChain.length, ROW_TOP)[index].x}, ${ROW_TOP})`">
          <circle r="20" class="tp-node-bg" :class="[nodeStatusClass(node.status), { 'tp-dim': switched }]" />
          <g class="tp-node-icon" :class="[nodeStatusClass(node.status), { 'tp-dim': switched }]" transform="translate(-12,-12)">
            <g v-html="ICONS[node.type]" />
          </g>
          <text class="tp-node-label" :class="{ 'tp-text-dim': switched }" y="38" text-anchor="middle">{{ node.name }}</text>
          <text class="tp-node-sub" :class="{ 'tp-text-dim': switched }" y="54" text-anchor="middle">{{ node.type === 'site' || node.type === 'origin' ? TYPE_LABELS[node.type] : `${TYPE_LABELS[node.type]} · ${hopDetail(node.hop)}` }}</text>
        </g>

        <!-- 备用路径节点：待命灰色，切换生效后绿色点亮 -->
        <g v-if="backupChain.length" v-for="(node, index) in backupChain" :key="`bn-${node.id}`" :transform="`translate(${rowPositions(backupChain.length, ROW_BOTTOM)[index].x}, ${ROW_BOTTOM})`">
          <circle r="20" class="tp-node-bg" :class="backupActive ? nodeStatusClass(node.status) : 'st-standby'" />
          <g class="tp-node-icon" :class="backupActive ? nodeStatusClass(node.status) : 'st-standby'" transform="translate(-12,-12)">
            <g v-html="ICONS[node.type]" />
          </g>
          <text class="tp-node-label" :class="{ 'tp-text-dim': !backupActive }" y="38" text-anchor="middle">{{ node.name }}</text>
          <text class="tp-node-sub" :class="{ 'tp-text-dim': !backupActive }" y="54" text-anchor="middle">{{ node.type === 'site' || node.type === 'origin' ? TYPE_LABELS[node.type] : `${TYPE_LABELS[node.type]} · ${hopDetail(node.hop)}` }}</text>
        </g>

        <!-- 行标签：主线路（当前 / 已切换停用）、备线路（待命 / 已切换生效） -->
        <text x="10" :y="ROW_TOP + 4" class="tp-row-label" :class="{ 'tp-row-dim': switched }">主线路{{ switched ? '（已切换停用）' : '' }}</text>
        <text v-if="backupChain.length" x="10" :y="ROW_BOTTOM + 4" class="tp-row-label" :class="{ 'tp-row-backup': backupActive }">{{ backupActive ? '备线路（已切换生效）' : '备线路（待命）' }}</text>
      </svg>

      <!-- 攻击告警横幅 -->
      <div v-if="underAttack" class="tp-attack">
        <i />检测到攻击：{{ primary?.attackNote }}，智能分析中……
      </div>
    </div>

    <!-- 切换策略卡 -->
    <div v-if="policy" class="tp-policy">
      <div class="tp-policy-head">
        <strong>智能切换策略 · {{ policy.status === 'applied' ? '已执行' : '已下发' }}</strong>
        <time>{{ policyTime(policy.issuedAt) }}</time>
      </div>
      <p>{{ policy.reason }}</p>
    </div>

    <!-- 每跳明细 -->
    <ul class="tp-hops">
      <li v-for="(node, index) in active?.hops ?? []" :key="node.id">
        <i class="tp-hop-dot" :class="nodeStatusClass(node.status)" />
        <span class="tp-hop-seq">{{ index + 1 }}</span>
        <span class="tp-hop-copy"><strong>{{ node.name }}</strong><small>{{ TYPE_LABELS[nodeTypeOf(node)] }} · {{ node.note }}</small></span>
        <span class="tp-hop-metrics">{{ node.latencyMs }}ms · 丢包 {{ node.packetLossPct.toFixed(1) }}%</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.topology-panel { position: absolute; z-index: 10; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 620px; max-width: calc(100% - 24px); display: flex; flex-direction: column; border: 1px solid rgba(70, 97, 127, .55); background: rgba(9, 15, 27, .9); backdrop-filter: blur(6px); box-shadow: 0 12px 38px rgba(0, 0, 0, .55); }
.tp-header { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #263147; }
.tp-title { min-width: 0; flex: 1 1 auto; }
.tp-title strong { display: block; overflow: hidden; color: #eef4ff; font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }
.tp-title small { display: block; overflow: hidden; margin-top: 2px; color: #8492a8; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.tp-badge { flex: 0 0 auto; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.tp-badge.st-normal { color: #72deb9; background: rgba(67, 215, 162, .12); border: 1px solid rgba(67, 215, 162, .4); }
.tp-badge.st-attacked { color: #ff8798; background: rgba(239, 101, 121, .12); border: 1px solid rgba(239, 101, 121, .45); }
.tp-badge.st-switching { color: #edc66b; background: rgba(233, 185, 73, .12); border: 1px solid rgba(233, 185, 73, .45); }
.tp-badge.st-restoring { color: #8fc3ff; background: rgba(90, 149, 255, .12); border: 1px solid rgba(90, 149, 255, .45); animation: tp-blink 1s ease-in-out infinite; }
@keyframes tp-blink { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
.tp-badge.st-switched, .tp-badge.st-standby { color: #9aa8bd; background: rgba(119, 131, 151, .12); border: 1px solid rgba(119, 131, 151, .4); }
.tp-badge.st-active { color: #72deb9; background: rgba(67, 215, 162, .12); border: 1px solid rgba(67, 215, 162, .4); }
.tp-close { flex: 0 0 auto; width: 26px; height: 26px; padding: 0; border: 1px solid #35445d; color: #aeb9ca; background: transparent; font-size: 17px; line-height: 1; cursor: pointer; }
.tp-close:hover { color: #fff; border-color: #5d7aa8; background: #1a2942; }
.tp-meta { display: flex; align-items: center; gap: 16px; padding: 7px 12px; border-bottom: 1px solid #222d41; color: #8f9cb1; font-size: 12px; }
.tp-meta b { color: #c3cfdf; font-weight: 600; }
.tp-meta .tp-ok { color: #72deb9; }
.tp-topology { position: relative; padding: 4px 0 0; }
.tp-svg { display: block; width: 100%; height: auto; }
.tp-node-bg { fill: rgba(20, 32, 51, .92); stroke: #4a6589; stroke-width: 1.4; }
.tp-node-bg.st-degraded { stroke: #e9b949; fill: rgba(48, 40, 18, .92); }
.tp-node-bg.st-blocked { stroke: #ef6579; fill: rgba(52, 18, 26, .95); animation: tp-pulse 1.1s ease-in-out infinite; }
.tp-node-bg.st-active { stroke: #43d7a2; }
.tp-node-bg.st-standby { stroke: #3d4c63; fill: rgba(26, 34, 48, .8); }
.tp-node-bg.tp-dim { stroke: #4a5a72; fill: rgba(24, 31, 44, .8); }
.tp-node-icon { color: #8fb2e4; }
.tp-node-icon.st-degraded { color: #e9b949; }
.tp-node-icon.st-blocked { color: #ff8798; }
.tp-node-icon.st-standby { color: #5c6b82; }
.tp-node-icon.tp-dim { color: #5c6b82; }
.tp-text-dim { fill: #5c6b82 !important; }
.tp-row-dim { fill: #4a5a72 !important; }
.tp-node-label { fill: #d5deec; font-size: 11px; }
.tp-node-sub { fill: #7d8ba2; font-size: 10px; }
.tp-edge { stroke-width: 2; stroke: #5a95ff; }
.tp-edge-dim { stroke: #4a5a72; stroke-dasharray: 5 4; opacity: .6; }
.tp-edge-degraded { stroke: #e9b949; stroke-width: 2.4; }
.tp-edge-standby { stroke: #3d4c63; stroke-width: 1.8; stroke-dasharray: 4 4; opacity: .6; }
.tp-edge-backup { stroke: #43d7a2; stroke-width: 2.4; marker-end: url(#tp-arrow); }
.tp-edge-attacked { stroke: #ef6579; stroke-width: 2.6; animation: tp-edge-blink 1s ease-in-out infinite; }
.tp-row-label { fill: #6d7c93; font-size: 10px; }
.tp-row-backup { fill: #43d7a2; }
.tp-attack { display: flex; align-items: flex-start; gap: 8px; margin: 0 12px 8px; padding: 8px 10px; border: 1px solid rgba(239, 101, 121, .5); border-left: 3px solid #ef6579; background: rgba(239, 101, 121, .08); color: #ffb9c2; font-size: 12px; line-height: 1.5; }
.tp-attack i { flex: 0 0 auto; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: #ef6579; box-shadow: 0 0 8px #ef6579; }
.tp-policy { margin: 0 12px 8px; padding: 9px 11px; border: 1px solid rgba(233, 185, 73, .4); border-left: 3px solid #e9b949; background: rgba(233, 185, 73, .07); }
.tp-policy-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.tp-policy-head strong { color: #edc66b; font-size: 13px; }
.tp-policy-head time { color: #8492a8; font: 11px var(--font-family-mono, monospace); white-space: nowrap; }
.tp-policy p { margin: 6px 0 0; color: #b9c4d6; font-size: 12px; line-height: 1.6; }
.tp-hops { flex: 1 1 auto; max-height: 150px; min-height: 0; overflow-y: auto; margin: 0; padding: 2px 12px 8px; list-style: none; }
.tp-hops li { display: grid; grid-template-columns: 8px 20px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #222d41; }
.tp-hops li:last-child { border-bottom: 0; }
.tp-hop-dot { width: 8px; height: 8px; border-radius: 50%; background: #5a95ff; }
.tp-hop-dot.st-degraded { background: #e9b949; box-shadow: 0 0 6px rgba(233, 185, 73, .7); }
.tp-hop-dot.st-blocked { background: #ef6579; box-shadow: 0 0 8px rgba(239, 101, 121, .9); }
.tp-hop-seq { color: #73829a; font: 600 11px var(--font-family-mono, monospace); text-align: center; }
.tp-hop-copy { min-width: 0; }
.tp-hop-copy strong, .tp-hop-copy small { display: block; }
.tp-hop-copy strong { overflow: hidden; color: #dce3ee; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.tp-hop-copy small { overflow: hidden; margin-top: 2px; color: #8492a8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.tp-hop-metrics { color: #92a0b5; font: 11px var(--font-family-mono, monospace); white-space: nowrap; }

@keyframes tp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
@keyframes tp-edge-blink { 0%, 100% { stroke-opacity: 1; } 50% { stroke-opacity: .3; } }
</style>
