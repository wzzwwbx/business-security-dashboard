<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import AssetFilterBar from '@/components/common/AssetFilterBar.vue';
import DetailDrawerShell from '@/components/common/DetailDrawerShell.vue';
import AssetClusterWidget from '@/components/widgets/AssetClusterWidget.vue';
import MiniTrendGroup from '@/components/widgets/MiniTrendGroup.vue';
import SceneBoardWidget from '@/components/widgets/SceneBoardWidget.vue';
import { useTerminalDetail } from '@/composables/useTerminalDetail';
import { useTerminalOverview } from '@/composables/useTerminalOverview';
import type { VisualFilterOption } from '@/types/visualization';
import {
  buildTerminalAssetCluster,
  buildTerminalBasicFacts,
  buildTerminalDrawerBadges,
  buildTerminalEventNodes,
  buildTerminalOverviewMetrics,
  buildTerminalPeripheralNodes,
  buildTerminalPersonFacts,
  buildTerminalScene,
  buildTerminalSecurityFacts,
  buildTerminalSoftwareNodes,
  buildTerminalTimeseriesSummary
} from '@/utils/terminalVisuals';
import { sourceStatusLabel, sourceSystemLabel, sourceTypeLabel } from '@/utils/terminalFormatters';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
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
    { key: 'changed', label: '指纹变化', count: items.filter((item) => item.fingerprintChanged).length }
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
const sceneData = computed(() => buildTerminalScene(sources.value, filteredDevices.value));
const assetNodes = computed(() => buildTerminalAssetCluster(filteredDevices.value));
const eventNodes = computed(() => buildTerminalEventNodes(events.value));
const softwareNodes = computed(() => buildTerminalSoftwareNodes(softwareChanges.value));
const peripheralNodes = computed(() => buildTerminalPeripheralNodes(peripheralEvents.value));
const drawerBadges = computed(() => buildTerminalDrawerBadges(detail.value));
const basicFacts = computed(() => buildTerminalBasicFacts(detail.value));
const personFacts = computed(() => buildTerminalPersonFacts(detail.value));
const securityFacts = computed(() => buildTerminalSecurityFacts(detail.value));
const timeseriesSummary = computed(() => buildTerminalTimeseriesSummary(timeseries.value));

const selectedNodeId = computed(() => detail.value ? `device-${detail.value.id}` : undefined);

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
              <h3>终端接入状态</h3>
              <p>在线、离线、休眠、型号版本与区域分布。</p>
            </div>
            <span class="tag">来源 {{ sources.length }} 个</span>
          </header>
          <div class="side-list">
            <article v-for="source in sources" :key="`${source.sourceType}-${source.sourceSystem}`" class="side-list-item">
              <strong>{{ sourceSystemLabel(source.sourceSystem) }}</strong>
              <span>{{ sourceTypeLabel(source.sourceType) }} · {{ sourceStatusLabel(source.status) }}</span>
              <small>终端 {{ source.deviceCount }} 台</small>
            </article>
          </div>
        </section>

        <section class="glass-card side-panel">
          <header class="side-panel-header">
            <div>
              <h3>签批 PAD 健康</h3>
              <p>重点关注资源、电量、系统版本和补丁状态。</p>
            </div>
          </header>
          <div class="side-list">
            <article v-for="device in filteredDevices.slice(0, 6)" :key="device.id" class="side-list-item clickable" @click="handleSelectNode({ drilldownKey: String(device.id) })">
              <strong>{{ device.displayName }}</strong>
              <span>{{ device.personName || '未关联人员' }}</span>
              <small>{{ device.phoneNumberMasked || '未上报手机号' }}</small>
            </article>
          </div>
        </section>
      </aside>

      <main class="screen-center-column terminal-center">
        <div class="center-scene">
          <SceneBoardWidget
            :title="`${activeRegionName}终端接入与通联拓扑`"
            description="来源、终端聚类、人员归属和通讯关系形成统一主视觉。"
            :nodes="sceneData.nodes"
            :links="sceneData.links"
            :legend="['来源接入', '终端聚类', '人员关联', '通联关系']"
            @select-node="handleSelectNode"
          />
        </div>
        <div class="center-assets">
          <AssetClusterWidget
            title="终端与签批 PAD 设备舱"
            description="按城市、机构、状态和风险聚类。点击单体终端进入设备详情。"
            :nodes="assetNodes"
            :selected-node-id="selectedNodeId"
            @select-node="handleSelectNode"
          />
        </div>
      </main>

      <aside class="screen-support-column">
        <AssetClusterWidget
          title="USB Key 认证事件"
          description="插拔、PIN 错误、连续认证失败和成功率变化。"
          :nodes="eventNodes"
        />
        <AssetClusterWidget
          title="版本与补丁状态"
          description="系统版本、补丁与软件安装变更集中浏览。"
          :nodes="softwareNodes"
        />
        <AssetClusterWidget
          title="通联与外设状态"
          description="通讯关系变化、链路健康和外设接入事件。"
          :nodes="peripheralNodes"
        />
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
