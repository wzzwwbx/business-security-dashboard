<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import AssetFilterBar from '@/components/common/AssetFilterBar.vue';
import DetailDrawerShell from '@/components/common/DetailDrawerShell.vue';
import AssetClusterWidget from '@/components/widgets/AssetClusterWidget.vue';
import MiniTrendGroup from '@/components/widgets/MiniTrendGroup.vue';
import SceneBoardWidget from '@/components/widgets/SceneBoardWidget.vue';
import { useOpsHostDetail } from '@/composables/useOpsHostDetail';
import { useOpsOverview } from '@/composables/useOpsOverview';
import type { OpsHostSummaryDto } from '@/types/ops';
import type { VisualFilterOption } from '@/types/visualization';
import {
  buildOpsAlertNodes,
  buildOpsAssetCluster,
  buildOpsDetailFacts,
  buildOpsDrawerBadges,
  buildOpsOverviewMetrics,
  buildOpsProcessNodes,
  buildOpsRelations,
  buildOpsRuntimeFacts,
  buildOpsScene,
  buildOpsTimeseriesSummary
} from '@/utils/opsVisuals';
import { formatRelativeTime, sourceSystemLabel, statusLabel } from '@/utils/opsFormatters';
import { computed, ref } from 'vue';

const {
  overview,
  sources,
  hosts,
  selectedHostId,
  loading,
  refreshing,
  errorMessage,
  selectHost,
  reload
} = useOpsOverview();

const {
  detail,
  timeseries,
  processes,
  alerts,
  loading: detailLoading,
  errorMessage: detailErrorMessage
} = useOpsHostDetail(selectedHostId);

const keyword = ref('');
const activeGroup = ref('all');
const drawerOpen = ref(false);
const activeTab = ref('basic');

const heroTags = computed(() => [
  { label: '在线主机', value: `${overview.value?.onlineHosts ?? 0} 台` },
  { label: '延迟主机', value: `${overview.value?.staleHosts ?? 0} 台` },
  { label: '离线主机', value: `${overview.value?.offlineHosts ?? 0} 台` },
  { label: '资源告警', value: `${overview.value?.openAlerts ?? 0} 条` }
]);

const groupOptions = computed<VisualFilterOption[]>(() => {
  const items = hosts.value;
  return [
    { key: 'all', label: '全部主机', count: items.length },
    { key: 'online', label: '在线', count: items.filter((item) => item.status === 'ONLINE').length },
    { key: 'attention', label: '重点关注', count: items.filter((item) => item.status !== 'ONLINE' || item.openAlertCount > 0 || item.cpuUsagePct >= 75 || item.memoryUsagePct >= 80).length },
    { key: 'probe', label: '主机采集', count: items.filter((item) => item.sourceType === 'PROBE').length },
    { key: 'external', label: '业务接入', count: items.filter((item) => item.sourceType === 'EXTERNAL_API').length },
    { key: 'manual', label: '人工补录', count: items.filter((item) => item.sourceType === 'MANUAL_IMPORT').length }
  ];
});

const filteredHosts = computed(() => hosts.value.filter((item) => {
  const q = keyword.value.trim().toLowerCase();
  const matchedKeyword = !q || [item.displayName, item.hostname, item.primaryIp, item.hostCode]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));

  if (!matchedKeyword) {
    return false;
  }

  switch (activeGroup.value) {
    case 'online':
      return item.status === 'ONLINE';
    case 'attention':
      return item.status !== 'ONLINE' || item.openAlertCount > 0 || item.cpuUsagePct >= 75 || item.memoryUsagePct >= 80;
    case 'probe':
      return item.sourceType === 'PROBE';
    case 'external':
      return item.sourceType === 'EXTERNAL_API';
    case 'manual':
      return item.sourceType === 'MANUAL_IMPORT';
    default:
      return true;
  }
}));

const highlightedHosts = computed(() => [...filteredHosts.value]
  .sort((a, b) => scoreHost(b) - scoreHost(a))
  .slice(0, 6));

const overviewTrends = computed(() => buildOpsOverviewMetrics(overview.value));
const sceneData = computed(() => buildOpsScene(sources.value, filteredHosts.value));
const assetNodes = computed(() => buildOpsAssetCluster(filteredHosts.value));
const alertNodes = computed(() => buildOpsAlertNodes(alerts.value));
const processNodes = computed(() => buildOpsProcessNodes(processes.value));
const timeseriesSummary = computed(() => buildOpsTimeseriesSummary(timeseries.value));
const drawerBadges = computed(() => buildOpsDrawerBadges(detail.value));
const basicFacts = computed(() => buildOpsDetailFacts(detail.value));
const runtimeFacts = computed(() => buildOpsRuntimeFacts(detail.value));
const relationFacts = computed(() => buildOpsRelations(detail.value));
const selectedNodeId = computed(() => detail.value ? `host-${detail.value.id}` : undefined);
const selectedHostSummary = computed(() => hosts.value.find((item) => item.id === selectedHostId.value) ?? null);

const drawerTabs = computed(() => [
  { key: 'basic', label: '基本信息' },
  { key: 'runtime', label: '运行指标' },
  { key: 'alerts', label: '风险告警' },
  { key: 'relations', label: '关联关系' },
  { key: 'processes', label: '热点进程' }
]);

const drawerTitle = computed(() => detail.value?.displayName || detail.value?.hostname || selectedHostSummary.value?.displayName || selectedHostSummary.value?.hostname || '主机详情');

function scoreHost(host: OpsHostSummaryDto) {
  const statusScore = host.status === 'OFFLINE' ? 100 : host.status === 'STALE' ? 65 : 0;
  return statusScore + host.openAlertCount * 18 + host.cpuUsagePct * 0.55 + host.memoryUsagePct * 0.4;
}

function handleSelectNode(node: { drilldownKey?: string; children?: { drilldownKey?: string }[] }) {
  const targetKey = node.drilldownKey ?? node.children?.[0]?.drilldownKey;
  if (!targetKey) {
    return;
  }

  selectHost(Number(targetKey));
  drawerOpen.value = true;
  activeTab.value = 'basic';
}

function openAlertDrawer() {
  if (!selectedHostId.value && filteredHosts.value[0]) {
    selectHost(filteredHosts.value[0].id);
  }
  drawerOpen.value = true;
  activeTab.value = 'alerts';
}

function openProcessDrawer() {
  if (!selectedHostId.value && filteredHosts.value[0]) {
    selectHost(filteredHosts.value[0].id);
  }
  drawerOpen.value = true;
  activeTab.value = 'processes';
}

function closeDrawer() {
  drawerOpen.value = false;
}
</script>

<template>
  <div v-if="loading" class="screen-page" aria-busy="true">
    <section class="glass-card screen-hero-skeleton"><BaseSkeleton width="100%" height="108px" /></section>
    <section class="glass-card screen-toolbar-skeleton"><BaseSkeleton width="100%" height="96px" /></section>
    <section class="glass-card summary-card"><BaseSkeleton width="100%" height="96px" /></section>
    <section class="screen-workbench">
      <article class="glass-card screen-skeleton-card"><BaseSkeleton width="100%" height="100%" /></article>
      <article class="glass-card screen-skeleton-card"><BaseSkeleton width="100%" height="100%" /></article>
      <article class="glass-card screen-skeleton-card"><BaseSkeleton width="100%" height="100%" /></article>
    </section>
  </div>

  <BaseEmpty v-else-if="errorMessage && !overview" title="运维态势加载失败" :description="errorMessage">
    <BaseButton variant="secondary" @click="reload">重新加载</BaseButton>
  </BaseEmpty>

  <div v-else class="screen-page ops-page">
    <section class="hero-card glass-card">
      <div>
        <div class="hero-eyebrow">基础设施资源舱</div>
        <h1>运维态势</h1>
        <p>以来源关系、主机集群和异常联动为主，不再把长列表放在首屏中心。</p>
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
      placeholder="按主机名称、地址或主机编码搜索"
      :groups="groupOptions"
      :active-group="activeGroup"
      @update:keyword="keyword = $event"
      @select-group="activeGroup = $event"
    />

    <section class="glass-card summary-card">
      <MiniTrendGroup :items="overviewTrends" />
    </section>

    <section class="screen-workbench ops-workbench">
      <aside class="screen-support-column">
        <section class="glass-card side-panel">
          <header class="side-panel-header">
            <div>
              <h3>来源接入</h3>
              <p>各类主机数据统一接入后，在同一资源域中汇聚展示。</p>
            </div>
            <span class="tag">来源 {{ sources.length }} 个</span>
          </header>
          <div class="side-list">
            <article v-for="source in sources" :key="`${source.sourceType}-${source.sourceSystem}`" class="side-list-item">
              <strong>{{ sourceSystemLabel(source.sourceSystem) }}</strong>
              <span>{{ statusLabel(source.sourceType) }} · {{ source.enabled ? statusLabel(source.status) : '停用' }}</span>
              <small>{{ source.hostCount }} 台主机 · {{ source.lastSeenAt ? formatRelativeTime(source.lastSeenAt) : '暂无更新时间' }}</small>
            </article>
          </div>
        </section>

        <section class="glass-card side-panel">
          <header class="side-panel-header">
            <div>
              <h3>异常主机</h3>
              <p>优先关注离线、告警较多和资源过热的主机。</p>
            </div>
          </header>
          <div class="side-list">
            <article
              v-for="host in highlightedHosts"
              :key="host.id"
              class="side-list-item clickable"
              @click="handleSelectNode({ drilldownKey: String(host.id) })"
            >
              <strong>{{ host.displayName || host.hostname }}</strong>
              <span>{{ host.primaryIp }} · {{ statusLabel(host.status) }}</span>
              <small>处理器 {{ host.cpuUsagePct.toFixed(1) }}% · 内存 {{ host.memoryUsagePct.toFixed(1) }}% · 告警 {{ host.openAlertCount }} 条</small>
            </article>
          </div>
        </section>
      </aside>

      <main class="screen-center-column ops-center">
        <div class="center-scene">
          <SceneBoardWidget
            title="资源关系总览"
            description="来源接入、主机聚类和异常联动形成统一主视觉。"
            :nodes="sceneData.nodes"
            :links="sceneData.links"
            :legend="['来源接入', '资源中枢', '主机集群', '异常联动']"
            :active-node-id="selectedNodeId"
            @select-node="handleSelectNode"
          />
        </div>
        <div class="center-assets">
          <AssetClusterWidget
            title="主机资产图标舱"
            description="主机数量增加时自动聚类。点击集群展开，点击主机进入详情。"
            :nodes="assetNodes"
            :selected-node-id="selectedNodeId"
            @select-node="handleSelectNode"
          />
        </div>
      </main>

      <aside class="screen-support-column">
        <section class="glass-card side-panel compact-panel">
          <header class="side-panel-header">
            <div>
              <h3>当前主机摘要</h3>
              <p>点击左侧或中央资产，可切换当前主机并查看明细。</p>
            </div>
            <button class="panel-link" type="button" @click="drawerOpen = true">打开详情</button>
          </header>
          <div v-if="detail" class="selected-summary">
            <strong>{{ detail.displayName || detail.hostname }}</strong>
            <span>{{ detail.primaryIp }} · {{ statusLabel(detail.status) }}</span>
            <div class="selected-summary-metrics">
              <span>处理器 {{ detail.latestSnapshot.cpuUsagePct.toFixed(1) }}%</span>
              <span>内存 {{ detail.latestSnapshot.memoryUsagePct.toFixed(1) }}%</span>
              <span>磁盘 {{ detail.latestSnapshot.diskUsagePct.toFixed(1) }}%</span>
              <span>连接 {{ detail.latestSnapshot.tcpEstablishedCount }}</span>
            </div>
            <small>{{ detailLoading ? '正在加载补充数据' : (detailErrorMessage || '详情数据已就绪') }}</small>
          </div>
          <div v-else class="selected-summary empty">
            <strong>请选择主机</strong>
            <span>点击主视觉节点或资产卡片后，在此查看摘要并下钻。</span>
          </div>
        </section>

        <section class="glass-card side-panel compact-panel clickable-panel" @click="openAlertDrawer">
          <header class="side-panel-header">
            <div>
              <h3>最新告警</h3>
              <p>优先展示当前主机及同类资源中的最新风险告警。</p>
            </div>
            <span class="tag">{{ alerts.length }} 条</span>
          </header>
          <AssetClusterWidget title="" :nodes="alertNodes" />
        </section>

        <section class="glass-card side-panel compact-panel clickable-panel" @click="openProcessDrawer">
          <header class="side-panel-header">
            <div>
              <h3>热点进程</h3>
              <p>按资源占用和白名单情况聚焦热点进程。</p>
            </div>
            <span class="tag">{{ processes.length }} 个</span>
          </header>
          <AssetClusterWidget title="" :nodes="processNodes" />
        </section>
      </aside>
    </section>

    <DetailDrawerShell
      :open="drawerOpen && Boolean(selectedHostId)"
      :title="drawerTitle"
      subtitle="主机下钻详情"
      :badges="drawerBadges"
      :tabs="drawerTabs"
      :active-tab="activeTab"
      @close="closeDrawer"
      @select-tab="activeTab = $event"
    >
      <template v-if="detail">
        <div class="drawer-section-stack">
          <article v-if="detailErrorMessage" class="drawer-intro-card">
            <strong>补充数据加载提示</strong>
            <p>{{ detailErrorMessage }}</p>
          </article>

          <section v-if="activeTab === 'basic'" class="drawer-fact-grid">
            <article v-for="fact in basicFacts" :key="fact.label" class="drawer-fact-card">
              <span>{{ fact.label }}</span>
              <strong>{{ fact.value }}</strong>
            </article>
          </section>

          <section v-else-if="activeTab === 'runtime'" class="drawer-section-stack">
            <div class="drawer-fact-grid">
              <article v-for="fact in runtimeFacts" :key="fact.label" class="drawer-fact-card">
                <span>{{ fact.label }}</span>
                <strong>{{ fact.value }}</strong>
              </article>
            </div>
            <article class="drawer-intro-card">
              <strong>趋势摘要</strong>
              <MiniTrendGroup :items="timeseriesSummary" />
            </article>
          </section>

          <section v-else-if="activeTab === 'alerts'" class="drawer-section-stack">
            <div v-if="alertNodes.length" class="drawer-related-list">
              <article v-for="node in alertNodes" :key="node.id" class="drawer-related-item static">
                <span>{{ node.name }}</span>
                <small>{{ node.description }}</small>
              </article>
            </div>
            <article v-else class="drawer-intro-card">
              <strong>当前主机暂无告警</strong>
              <p>若后续出现处理器、内存、磁盘或离线异常，将在此处展示。</p>
            </article>
          </section>

          <section v-else-if="activeTab === 'relations'" class="drawer-section-stack">
            <div v-if="relationFacts.length" class="drawer-related-list">
              <article v-for="relation in relationFacts" :key="relation.label + relation.value" class="drawer-related-item static">
                <span>{{ relation.label }}</span>
                <small>{{ relation.value }}</small>
              </article>
            </div>
            <article v-else class="drawer-intro-card">
              <strong>当前主机暂无外部绑定</strong>
              <p>后续接入外部资产系统或人工绑定后，会在这里展示来源关系。</p>
            </article>
          </section>

          <section v-else class="drawer-section-stack">
            <div v-if="processNodes.length" class="drawer-related-list">
              <article v-for="node in processNodes" :key="node.id" class="drawer-related-item static">
                <span>{{ node.name }}</span>
                <small>{{ node.description }}</small>
              </article>
            </div>
            <article v-else class="drawer-intro-card">
              <strong>当前主机暂无进程数据</strong>
              <p>探针或其他来源采集到进程信息后，会在这里展示热点进程。</p>
            </article>
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
  padding: 12px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.hero-eyebrow {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
  letter-spacing: 0.08em;
}

.hero-card h1 {
  margin: 6px 0 0;
  font-size: clamp(24px, 2vw, 30px);
}

.hero-card p {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
}

.hero-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
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
  min-width: 88px;
  padding: 8px 10px;
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

.ops-center,
.side-panel {
  min-height: 0;
}

.side-panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
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

.panel-link {
  align-self: flex-start;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.72);
  color: var(--sys-color-text-primary);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
}

.side-list,
.drawer-related-list {
  display: grid;
  gap: 8px;
}

.side-list-item,
.drawer-fact-card,
.drawer-intro-card,
.drawer-related-item,
.selected-summary {
  padding: 10px;
  border-radius: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.72);
}

.side-list-item {
  display: grid;
  gap: 4px;
}

.side-list-item span,
.side-list-item small,
.selected-summary span,
.selected-summary small,
.drawer-fact-card span,
.drawer-intro-card p,
.drawer-related-item small {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.side-list-item.clickable,
.clickable-panel {
  cursor: pointer;
}

.center-scene {
  flex: 0 0 42%;
  min-height: 220px;
}

.center-assets {
  flex: 1;
  min-height: 0;
}

.compact-panel {
  min-height: 0;
}

.selected-summary {
  display: grid;
  gap: 6px;
}

.selected-summary.empty {
  min-height: 112px;
  align-content: center;
}

.selected-summary-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
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

.drawer-fact-card {
  display: grid;
  gap: 6px;
}

.screen-hero-skeleton,
.screen-toolbar-skeleton,
.screen-skeleton-card {
  display: grid;
  gap: 12px;
}

:deep(.clickable-panel .asset-cluster) {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

:deep(.clickable-panel .asset-cluster-header) {
  display: none;
}

@media (max-width: 1480px) {
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
  .drawer-fact-grid,
  .selected-summary-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
