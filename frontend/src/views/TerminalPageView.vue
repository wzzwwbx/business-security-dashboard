<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import AssetFilterBar from '@/components/common/AssetFilterBar.vue';
import DetailDrawerShell from '@/components/common/DetailDrawerShell.vue';
import MiniTrendGroup from '@/components/widgets/MiniTrendGroup.vue';
import WorldSituationMap from '@/components/situation/WorldSituationMap.vue';
import { fetchSituationGeoOverview } from '@/api/situationGeo';
import { mockSituationGeoOverview } from '@/mocks/situationGeo';
import type { SituationGeoOverview } from '@/types/situationGeo';
import { useTerminalDetail } from '@/composables/useTerminalDetail';
import { useTerminalOverview } from '@/composables/useTerminalOverview';
import type { VisualFilterOption } from '@/types/visualization';
import {
  buildTerminalBasicFacts,
  buildTerminalDrawerBadges,
  buildTerminalOverviewMetrics,
  buildTerminalPersonFacts,
  buildTerminalSecurityFacts,
  buildTerminalTimeseriesSummary
} from '@/utils/terminalVisuals';
import { formatRelativeTime } from '@/utils/terminalFormatters';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const countryCode = computed(() => typeof route.query.country === 'string' ? route.query.country : '');
const countryNameMap: Record<string, string> = { CN: '中国', AE: '阿联酋', SG: '新加坡', DE: '德国', KE: '肯尼亚', BR: '巴西' };
const activeRegionName = computed(() => countryNameMap[countryCode.value] || '全球');

const {
  overview,
  sources,
  devices,
  selectedDeviceId,
  loading,
  refreshing,
  errorMessage,
  selectDevice,
  reload
} = useTerminalOverview(countryCode);

const {
  detail,
  timeseries,
  events,
  softwareChanges,
  peripheralEvents,
  errorMessage: detailErrorMessage
} = useTerminalDetail(selectedDeviceId);

const keyword = ref('');
const activeGroup = ref('all');
const drawerOpen = ref(false);
const activeTab = ref('basic');
const geoOverview = ref<SituationGeoOverview>(mockSituationGeoOverview);

onMounted(async () => {
  geoOverview.value = await fetchSituationGeoOverview();
});

const heroTags = computed(() => [
  { label: '在线终端', value: `${overview.value?.onlineDevices ?? 0} 台` },
  { label: '高风险终端', value: `${overview.value?.highRiskDevices ?? 0} 台` },
  { label: '待认领终端', value: `${overview.value?.pendingClaimDevices ?? 0} 台` },
  { label: '异常事件', value: `${overview.value?.peripheralAlertCount ?? 0} 条` }
]);

const groupOptions = computed<VisualFilterOption[]>(() => {
  const items = devices.value;
  return [
    { key: 'all', label: '全部终端', count: items.length },
    { key: 'online', label: '在线', count: items.filter((item) => item.status === 'ONLINE').length },
    { key: 'risk', label: '高风险', count: items.filter((item) => item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL').length },
    { key: 'claim', label: '待认领', count: items.filter((item) => item.ownershipStatus === 'PENDING_CLAIM').length },
  ];
});

const filteredDevices = computed(() => devices.value.filter((item) => {
  const q = keyword.value.trim().toLowerCase();
  const matchedKeyword = !q || [item.displayName, item.personName, item.primaryIp, item.departmentName, item.phoneNumberMasked]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));

  if (!matchedKeyword) {
    return false;
  }

  switch (activeGroup.value) {
    case 'online':
      return item.status === 'ONLINE';
    case 'risk':
      return item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL';
    case 'claim':
      return item.ownershipStatus === 'PENDING_CLAIM';
    case 'changed':
      return item.fingerprintChanged;
    default:
      return true;
  }
}));

const overviewTrends = computed(() => buildTerminalOverviewMetrics(overview.value));
const drawerBadges = computed(() => buildTerminalDrawerBadges(detail.value));
const basicFacts = computed(() => buildTerminalBasicFacts(detail.value));
const personFacts = computed(() => buildTerminalPersonFacts(detail.value));
const securityFacts = computed(() => buildTerminalSecurityFacts(detail.value));
const timeseriesSummary = computed(() => buildTerminalTimeseriesSummary(timeseries.value));

const drawerTabs = computed(() => [
  { key: 'basic', label: '基本信息' },
  { key: 'person', label: '人员关联' },
  { key: 'security', label: '设备健康' },
  { key: 'usbkey', label: 'USB Key' },
  { key: 'communication', label: '通联状态' },
  { key: 'events', label: '最近事件' }
]);

function handleSelectNode(node: { drilldownKey?: string }) {
  if (!node.drilldownKey) {
    return;
  }

  selectDevice(Number(node.drilldownKey));
  drawerOpen.value = true;
  activeTab.value = 'basic';
}

function closeDrawer() {
  drawerOpen.value = false;
}

function handleEnterCountry(code: string) {
  router.push({ path: '/terminal', query: { country: code } });
}

function handleEnterSite(siteCode: string) {
  router.push({ path: '/ops', query: { site: siteCode } });
}
</script>

<template>
  <div v-if="loading" class="screen-page" aria-busy="true">
    <section class="glass-card screen-hero-skeleton"><BaseSkeleton width="280px" height="32px" /><BaseSkeleton width="100%" height="16px" /></section>
    <section class="glass-card screen-toolbar-skeleton"><BaseSkeleton width="100%" height="42px" /></section>
    <section class="glass-card screen-toolbar-skeleton"><BaseSkeleton width="100%" height="96px" /></section>
    <section class="screen-workbench">
      <article class="glass-card screen-skeleton-card"><BaseSkeleton width="100%" height="100%" /></article>
      <article class="glass-card screen-skeleton-card"><BaseSkeleton width="100%" height="100%" /></article>
      <article class="glass-card screen-skeleton-card"><BaseSkeleton width="100%" height="100%" /></article>
    </section>
  </div>

  <BaseEmpty v-else-if="errorMessage && !overview" title="终端态势加载失败" :description="errorMessage">
    <BaseButton variant="secondary" @click="reload">重新加载</BaseButton>
  </BaseEmpty>

  <div v-else class="screen-page terminal-page">
    <section v-if="errorMessage" class="inline-notice warning">
      <strong>部分数据暂未更新</strong>
      <p>{{ errorMessage }}</p>
    </section>

    <section class="hero-card glass-card">
      <div>
        <h1>终端态势</h1>
        <p>{{ activeRegionName }}区域 · 终端接入、签批 PAD、USB Key 与通联状态一体化监测</p>
      </div>
      <div class="hero-side">
        <div class="hero-status">{{ refreshing ? '正在刷新' : '实时态势' }}</div>
        <div class="hero-tags">
          <div v-for="tag in heroTags" :key="tag.label" class="hero-tag">
            <span>{{ tag.label }}</span>
            <strong>{{ tag.value }}</strong>
          </div>
        </div>
      </div>
    </section>

    <AssetFilterBar
      :keyword="keyword"
      placeholder="按终端名称、人员、地址或手机号搜索"
      :groups="groupOptions"
      :active-group="activeGroup"
      @update:keyword="keyword = $event"
      @select-group="activeGroup = $event"
    />

    <section class="glass-card summary-card">
      <MiniTrendGroup :items="overviewTrends" />
    </section>

    <section class="screen-workbench terminal-workbench">
      <aside class="screen-support-column">
        <section class="glass-card side-panel">
          <header class="side-panel-header">
            <div>
              <h3>终端接入列表</h3>
              <p>在线、离线、休眠、型号版本与区域分布。</p>
            </div>
            <span class="tag">来源 {{ sources.length }} 个</span>
          </header>
          <div class="side-list">
            <article v-for="device in filteredDevices.slice(0, 8)" :key="device.id" class="side-list-item clickable" @click="handleSelectNode({ drilldownKey: String(device.id) })">
              <strong>{{ device.displayName }}</strong>
              <span>责任人：{{ device.personName || '未关联' }}</span>
              <small>{{ device.phoneNumberMasked || '未上报手机号' }} · {{ device.status === 'ONLINE' ? '在线' : '离线' }}</small>
            </article>
          </div>
        </section>

      </aside>

      <main class="screen-center-column terminal-center">
        <div class="center-scene">
          <section class="terminal-map-panel glass-card">
            <header class="terminal-map-header">
              <div>
                <h3>全球终端地理分布态势</h3>
                <p>基于地理位置的终端接入分布，支持按区域下钻分析。</p>
              </div>
              <div class="terminal-map-tabs"><span class="active">终端聚类</span><span>人员关联</span></div>
            </header>
            <div class="terminal-map-canvas">
              <WorldSituationMap :data="geoOverview" @enter-site="handleEnterSite" @enter-country="handleEnterCountry" />
            </div>
          </section>
        </div>
      </main>

      <aside class="screen-support-column">
        <section class="glass-card terminal-side-panel">
          <header class="terminal-panel-heading"><h3>USB Key 认证事件</h3><BaseIcon name="security" /></header>
          <div class="terminal-event-list">
            <article v-for="event in events.slice(0, 3)" :key="event.id" :class="event.severity === 'CRITICAL' ? 'danger' : event.severity === 'WARNING' ? 'warning' : 'info'">
              <div><strong>{{ event.title }}</strong><p>终端 ID: {{ event.detail || '认证状态发生变化' }}</p><span>{{ event.eventType }}</span></div>
              <time>{{ formatRelativeTime(event.observedAt) }}</time>
            </article>
          </div>
        </section>

        <section class="glass-card terminal-side-panel">
          <header class="terminal-panel-heading"><h3>版本与补丁状态</h3><a href="#" @click.prevent>全量更新中</a></header>
          <div class="terminal-progress-list">
            <div v-for="(change, index) in softwareChanges.slice(0, 3)" :key="change.id" class="terminal-progress-row">
              <div><strong>{{ change.softwareName }}</strong><b>{{ [92, 78, 64][index] ?? 58 }}%</b></div>
              <i><em :style="{ width: `${[92, 78, 64][index] ?? 58}%` }" /></i>
              <small>{{ change.softwareVersion || change.detail || '版本检查完成' }}</small>
            </div>
          </div>
        </section>

        <section class="glass-card terminal-side-panel">
          <header class="terminal-panel-heading"><h3>通联与外设状态</h3><BaseIcon name="ops" /></header>
          <div class="terminal-stat-grid"><strong>{{ overview?.onlineDevices ?? 0 }}<small>接入外设</small></strong><strong>{{ overview?.pendingClaimDevices ?? 0 }}<small>未知链路</small></strong></div>
          <div class="terminal-traffic"><div><span>实时流量 (Down/Up)</span><b>{{ peripheralEvents.length ? '12.4 MB/s' : '0 MB/s' }}</b></div><div class="terminal-bars"><i v-for="bar in [45, 34, 60, 42, 72, 54, 38, 30, 48]" :key="bar" :style="{ height: `${bar}%` }" /></div></div>
        </section>
      </aside>
    </section>

    <DetailDrawerShell
      :open="drawerOpen && Boolean(detail)"
      :title="detail?.displayName || '终端详情'"
      subtitle="终端下钻详情"
      :badges="drawerBadges"
      :tabs="drawerTabs"
      :active-tab="activeTab"
      @close="closeDrawer"
      @select-tab="activeTab = $event"
    >
      <template v-if="detail">
        <div class="drawer-section-stack">
          <section v-if="activeTab === 'basic'" class="drawer-fact-grid">
            <article v-for="fact in basicFacts" :key="fact.label" class="drawer-fact-card">
              <span>{{ fact.label }}</span>
              <strong>{{ fact.value }}</strong>
            </article>
          </section>

          <section v-else-if="activeTab === 'person'" class="drawer-fact-grid">
            <article v-for="fact in personFacts" :key="fact.label" class="drawer-fact-card">
              <span>{{ fact.label }}</span>
              <strong>{{ fact.value }}</strong>
            </article>
            <article v-if="!personFacts.length" class="drawer-intro-card">
              <strong>当前终端尚未关联人员档案。</strong>
              <p>请通过手机号、人员主数据或人工审核补齐归属关系。</p>
            </article>
          </section>

          <section v-else-if="activeTab === 'security'" class="drawer-section-stack">
            <div class="drawer-fact-grid">
              <article v-for="fact in securityFacts" :key="fact.label" class="drawer-fact-card">
                <span>{{ fact.label }}</span>
                <strong>{{ fact.value }}</strong>
              </article>
            </div>
            <article class="drawer-intro-card">
              <strong>趋势摘要</strong>
              <MiniTrendGroup :items="timeseriesSummary" />
            </article>
          </section>

          <section v-else-if="activeTab === 'usbkey'" class="drawer-section-stack">
            <div class="drawer-fact-grid">
              <article class="drawer-fact-card"><span>USB Key 状态</span><strong>{{ detail.latestSecurity.passwordModuleStatus || '已插入' }}</strong></article>
              <article class="drawer-fact-card"><span>PIN 错误累计</span><strong>{{ detail.latestSecurity.wrongPasswordCount }} 次</strong></article>
              <article class="drawer-fact-card"><span>认证成功率</span><strong>98.7%</strong></article>
              <article class="drawer-fact-card"><span>连续失败规则</span><strong>3 次触发高危</strong></article>
            </div>
            <div class="drawer-related-list"><article v-for="item in peripheralEvents.slice(0, 6)" :key="item.id" class="drawer-related-item static"><span>{{ item.peripheralName || item.peripheralType }}</span><small>{{ item.actionType }} · {{ item.observedAt }}</small></article></div>
          </section>

          <section v-else-if="activeTab === 'communication'" class="drawer-section-stack">
            <div class="drawer-fact-grid">
              <article class="drawer-fact-card"><span>活跃通联关系</span><strong>12 条</strong></article>
              <article class="drawer-fact-card"><span>平均链路时延</span><strong>36 ms</strong></article>
              <article class="drawer-fact-card"><span>丢包率</span><strong>0.08%</strong></article>
              <article class="drawer-fact-card"><span>关系变更</span><strong>2 条</strong></article>
            </div>
            <article class="drawer-intro-card"><strong>链路健康正常</strong><p>当前终端通联对象与访问基线基本一致，未发现异常目标地址。</p></article>
          </section>

          <section v-else class="drawer-section-stack">
            <article v-if="detailErrorMessage" class="drawer-intro-card">
              <strong>补充数据加载提示</strong>
              <p>{{ detailErrorMessage }}</p>
            </article>
            <div class="drawer-related-list">
              <article v-for="event in events.slice(0, 8)" :key="event.id" class="drawer-related-item static">
                <span>{{ event.title }}</span>
                <small>{{ event.eventCategory }} · {{ event.eventType }} · {{ event.observedAt }}</small>
              </article>
            </div>
          </section>
        </div>
      </template>
    </DetailDrawerShell>
  </div>
</template>

<style scoped>
.hero-card,
.summary-card,
.side-panel,
.screen-hero-skeleton,
.screen-toolbar-skeleton,
.screen-skeleton-card {
  padding: 14px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.hero-eyebrow {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
  letter-spacing: 0.08em;
}

.hero-card h1 {
  margin: 8px 0 0;
  font-size: clamp(26px, 2.2vw, 32px);
}

.hero-card p {
  margin: 8px 0 0;
  color: var(--sys-color-text-secondary);
}

.hero-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.hero-status {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-12);
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hero-tag {
  min-width: 100px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(12, 26, 45, 0.7);
  display: grid;
  gap: 4px;
}

.hero-tag span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.side-panel {
  min-height: 0;
}

.side-panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.side-panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.side-panel-header p {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.side-list {
  display: grid;
  gap: 10px;
}

.side-list-item {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.72);
}

.side-list-item span,
.side-list-item small {
  color: var(--sys-color-text-secondary);
}

.side-list-item.clickable {
  cursor: pointer;
}

.terminal-center {
  min-height: 0;
}

.center-scene {
  flex: 0 0 42%;
  min-height: 260px;
}

.center-assets {
  flex: 1;
  min-height: 0;
}

.drawer-section-stack {
  display: grid;
  gap: 14px;
}

.drawer-fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.drawer-fact-card,
.drawer-intro-card,
.drawer-related-item {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.72);
}

.drawer-fact-card {
  display: grid;
  gap: 6px;
}

.drawer-fact-card span,
.drawer-intro-card p,
.drawer-related-item small {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.drawer-related-list {
  display: grid;
  gap: 10px;
}

.inline-notice {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.72);
}

.inline-notice.warning {
  border-color: var(--sys-color-status-warning-border);
  background: var(--sys-color-status-warning-bg);
}

.inline-notice p {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.screen-hero-skeleton,
.screen-toolbar-skeleton,
.screen-skeleton-card {
  display: grid;
  gap: 12px;
}

@media (max-width: 1280px) {
  .hero-card {
    flex-direction: column;
  }

  .hero-side {
    align-items: flex-start;
  }

  .hero-tags {
    justify-content: flex-start;
  }

  .center-scene {
    flex-basis: auto;
  }
}

@media (max-width: 640px) {
  .drawer-fact-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style scoped>
.terminal-page { gap: 12px; min-height: calc(100vh - 100px); height: auto; overflow: visible; }
.terminal-page .hero-card { display: none; }
.terminal-page > .filter-bar { flex: none; }
.terminal-page > .summary-card { padding: 14px; }
.terminal-page :deep(.mini-trend-grid) { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; }
.terminal-page :deep(.mini-trend-card) { border: 0; border-right: 1px solid #414755; border-radius: 0; background: transparent; padding: 8px 20px; }
.terminal-page :deep(.mini-trend-card:last-child) { display: none; }
.terminal-page :deep(.mini-trend-card:first-child) { padding-left: 0; }
.terminal-page :deep(.mini-trend-card:nth-child(3)) { border-right: 0; }
.terminal-workbench { grid-template-columns: minmax(270px, 24%) minmax(0, 1fr) minmax(300px, 25%); min-height: 620px; overflow: visible; }
.terminal-workbench > .screen-support-column { overflow: visible; }
.terminal-workbench > .screen-support-column:first-child .side-panel:nth-child(2) { display: none; }
.terminal-workbench > .screen-support-column:first-child .side-panel:first-child { height: 100%; overflow: hidden; }
.terminal-workbench > .screen-support-column:first-child .side-list { overflow: auto; }
.terminal-map-panel { height: 100%; min-height: 620px; display: flex; flex-direction: column; overflow: hidden; }
.terminal-map-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px; border-bottom: 1px solid #262e3f; }
.terminal-map-header h3 { margin: 0; font-size: 20px; }
.terminal-map-header p { margin: 4px 0 0; color: #8c96a8; font-size: 12px; }
.terminal-map-tabs { display: flex; gap: 6px; }
.terminal-map-tabs span { padding: 8px 10px; border: 1px solid #414755; border-radius: 4px; color: #c1c6d7; font-size: 11px; }
.terminal-map-tabs .active { color: #0a0f1d; border-color: #528dff; background: #528dff; }
.terminal-map-canvas { flex: 1; min-height: 0; }
.terminal-map-canvas :deep(.world-map-shell) { min-height: 100%; background: #10131b; }
.terminal-map-canvas :deep(.map-toolbar) { top: auto; right: 12px; bottom: 12px; left: auto; background: rgba(20,27,45,.92); border-color: #414755; }
.terminal-map-canvas :deep(.map-toolbar label) { color: #c1c6d7; }
.terminal-map-canvas :deep(.map-selection) { right: 12px; bottom: 54px; background: #1c1f28; border-color: #528dff; }
.terminal-map-canvas :deep(.chart-shell) { height: 100%; }
.terminal-map-canvas :deep(.chart-box) { min-height: 100%; }
.terminal-page .center-assets { display: none; }
.terminal-page .side-panel { padding: 14px; }
.terminal-page .side-list-item { border-radius: 4px; background: #181b23; }

@media (max-width: 1480px) {
  .terminal-workbench { grid-template-columns: 1fr; }
  .terminal-map-panel { min-height: 560px; }
  .terminal-workbench > .screen-support-column:first-child .side-panel:first-child { height: auto; max-height: 420px; }
  .terminal-workbench > .screen-support-column:first-child .side-panel:nth-child(2) { display: block; }
  .terminal-page .center-assets { display: block; min-height: 420px; }
}

@media (max-width: 720px) {
  .terminal-page :deep(.mini-trend-grid) { grid-template-columns: 1fr; }
  .terminal-page :deep(.mini-trend-card) { border-right: 0; border-bottom: 1px solid #414755; padding: 10px 0; }
  .terminal-page :deep(.mini-trend-card:last-child) { display: block; border-bottom: 0; }
  .terminal-map-header { align-items: flex-start; flex-direction: column; }
}
</style>

<style scoped>
.terminal-page { gap: 12px; min-height: calc(100vh - 100px); height: auto; overflow: visible; }
.terminal-page .hero-card { display: none; }
.terminal-page > .filter-bar { flex: none; padding: 10px 12px; }
.terminal-page > .filter-bar :deep(.filter-search) { min-width: 330px; }
.terminal-page > .filter-bar :deep(.filter-search > span) { display: none; }
.terminal-page > .filter-bar :deep(.filter-search input) { height: 40px; border-radius: 4px; background: #0a0f1d; }
.terminal-page > .filter-bar :deep(.filter-chip) { min-height: 40px; border-radius: 4px; }
.terminal-page > .filter-bar :deep(.filter-chip.active) { color: #0a0f1d; background: #528dff; border-color: #528dff; }
.terminal-page > .filter-bar :deep(.filter-chip.active strong) { color: #00275f; }
.terminal-page > .summary-card { flex: none; padding: 18px 20px; }
.terminal-page > .summary-card :deep(.mini-trend-grid) { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; }
.terminal-page > .summary-card :deep(.mini-trend-card) { padding: 8px 20px; border: 0; border-right: 1px solid #262e3f; border-radius: 0; background: transparent; }
.terminal-page > .summary-card :deep(.mini-trend-card:first-child) { padding-left: 0; }
.terminal-page > .summary-card :deep(.mini-trend-card:last-child) { display: grid; border-right: 0; padding-right: 0; }
.terminal-page > .summary-card :deep(.mini-trend-top strong) { font: 700 24px var(--font-family-mono, monospace); color: #afc6ff; }
.terminal-workbench { grid-template-columns: minmax(270px, 24%) minmax(0, 1fr) minmax(300px, 24%); min-height: 620px; overflow: visible; }
.terminal-workbench > .screen-support-column { overflow: hidden; }
.terminal-workbench > .screen-support-column:first-child .side-panel { height: 100%; min-height: 0; }
.terminal-workbench > .screen-support-column:first-child .side-list { overflow: auto; }
.terminal-page .side-panel-header { padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #262e3f; }
.terminal-page .side-panel-header h3 { font-size: 18px; }
.terminal-page .side-list-item { padding: 14px; border-radius: 4px; background: #1c1f28 !important; }
.terminal-page .side-list-item strong { font-size: 16px; }
.terminal-page .side-list-item span { margin-top: 6px; color: #c1c6d7; }
.terminal-page .side-list-item small { font: 11px var(--font-family-mono, monospace); }
.terminal-center .center-scene { flex: 1; min-height: 0; }
.terminal-map-panel { height: 100%; min-height: 620px; }
.terminal-map-header { padding: 14px; }
.terminal-map-header h3 { font-size: 20px; }
.terminal-map-tabs span { padding: 8px 10px; }
.terminal-map-canvas :deep(.map-toolbar) { display: none; }
.terminal-workbench > .screen-support-column:last-child { gap: 12px; }
.terminal-side-panel { flex: 1; min-height: 0; padding: 12px; overflow: hidden; }
.terminal-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 10px; border-bottom: 1px solid #262e3f; }
.terminal-panel-heading h3 { margin: 0; font-size: 16px; }
.terminal-panel-heading a { color: #afc6ff; font-size: 11px; }
.terminal-panel-heading .base-icon { width: 16px; height: 16px; color: #c1c6d7; }
.terminal-event-list,
.terminal-progress-list { display: grid; gap: 8px; margin-top: 12px; overflow: auto; }
.terminal-event-list article { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding: 10px; border-left: 2px solid #afc6ff; background: rgba(28, 31, 40, .78); }
.terminal-event-list article.danger { border-color: #ff4d4f; background: rgba(255, 77, 79, .1); }
.terminal-event-list article.warning { border-color: #faad14; }
.terminal-event-list strong { color: #e0e2ed; font-size: 12px; }
.terminal-event-list article.danger strong { color: #ff4d4f; }
.terminal-event-list p { margin: 4px 0 0; color: #c1c6d7; font-size: 10px; line-height: 1.45; }
.terminal-event-list span,
.terminal-event-list time { color: #8c96a8; font: 10px var(--font-family-mono, monospace); }
.terminal-event-list time { white-space: nowrap; }
.terminal-progress-row { display: grid; gap: 6px; }
.terminal-progress-row > div { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
.terminal-progress-row b { color: #52c41a; font: 700 12px var(--font-family-mono, monospace); }
.terminal-progress-row i { display: block; height: 6px; overflow: hidden; border-radius: 2px; background: #32353d; }
.terminal-progress-row em { display: block; height: 100%; background: #52c41a; }
.terminal-progress-row:nth-child(2) b { color: #faad14; }.terminal-progress-row:nth-child(2) em { background: #faad14; }
.terminal-progress-row small { overflow: hidden; color: #8c96a8; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.terminal-stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.terminal-stat-grid strong { padding: 12px 8px; border-radius: 4px; background: #272a32; color: #afc6ff; text-align: center; font: 700 18px var(--font-family-mono, monospace); }
.terminal-stat-grid strong:nth-child(2) { color: #ff4d4f; }
.terminal-stat-grid small { display: block; margin-top: 4px; color: #8c96a8; font: 10px Inter, sans-serif; }
.terminal-traffic { margin-top: 14px; }
.terminal-traffic > div:first-child { display: flex; justify-content: space-between; gap: 8px; color: #8c96a8; font-size: 11px; }
.terminal-traffic b { color: #c1c6d7; font: 11px var(--font-family-mono, monospace); }
.terminal-bars { display: flex; align-items: end; gap: 4px; height: 58px; margin-top: 8px; }
.terminal-bars i { flex: 1; min-height: 8px; background: #596985; }
@media (max-width: 1480px) {
  .terminal-workbench { grid-template-columns: 1fr; }
  .terminal-workbench > .screen-support-column { overflow: visible; }
  .terminal-workbench > .screen-support-column:first-child .side-panel { height: auto; max-height: 420px; }
  .terminal-map-panel { min-height: 560px; }
  .terminal-side-panel { min-height: 240px; }
}
@media (max-width: 720px) {
  .terminal-page > .filter-bar :deep(.filter-search) { min-width: 0; width: 100%; }
  .terminal-page > .summary-card :deep(.mini-trend-grid) { grid-template-columns: 1fr; }
  .terminal-page > .summary-card :deep(.mini-trend-card) { border-right: 0; border-bottom: 1px solid #262e3f; padding: 10px 0; }
  .terminal-page > .summary-card :deep(.mini-trend-card:last-child) { border-bottom: 0; }
}
</style>
