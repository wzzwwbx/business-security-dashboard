<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import DetailDrawerShell from '@/components/common/DetailDrawerShell.vue';
import DemoWorldMap from '@/components/demo/DemoWorldMap.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import { demoSituationScenario, demoTotals } from '@/mocks/demoSituation';
import type { DemoEquipmentType, DemoPerson, DemoRegion } from '@/types/demoSituation';
import type { BaseIconName } from '@/components/common/BaseIcon.vue';
import { computed, ref } from 'vue';

const selectedCountryCode = ref('AE');
const selectedPerson = ref<DemoPerson | null>(null);
const drawerTab = ref('overview');

const selectedRegion = computed(() => demoSituationScenario.regions.find((region) => region.countryCode === selectedCountryCode.value) ?? demoSituationScenario.regions[0]);
const generatedTime = computed(() => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(demoSituationScenario.generatedAt)));

const topMetrics = computed(() => [
  { label: '配发装备人员', value: demoTotals.assignedPeople, unit: '人', note: '20 人均已建立装备套件', tone: 'info' },
  { label: '当前在线用户', value: demoTotals.onlinePeople, unit: '人', note: `在线率 ${(demoTotals.onlinePeople / demoTotals.assignedPeople * 100).toFixed(0)}%`, tone: 'success' },
  { label: '完整套件就绪', value: demoTotals.healthySuites, unit: '套', note: `${demoTotals.degradedSuites} 套降级 · ${demoTotals.offlineSuites} 套离线`, tone: 'success' },
  { label: '境外链路利用率', value: demoSituationScenario.link.utilization.toFixed(1), unit: '%', note: `共享带宽 ${demoSituationScenario.link.capacityMbps} Mbps`, tone: 'warning' }
]);

const equipmentMetrics = computed(() => [
  { label: 'PAD 在线', value: demoTotals.padOnline, tone: 'success' },
  { label: '密盒就绪', value: demoTotals.cryptoReady, tone: 'success' },
  { label: '卫星终端通联', value: demoTotals.satelliteConnected, tone: 'warning' },
  { label: '密信当前登录', value: demoTotals.messageLoggedIn, tone: 'info' },
  { label: '签阅软件可用', value: demoTotals.signingAvailable, tone: 'success' },
  { label: '完整套件就绪', value: demoTotals.healthySuites, tone: 'success' }
]);

const linkChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, right: 8, textStyle: { color: '#8f9cb2', fontSize: 10 } },
  grid: { left: 38, right: 16, top: 26, bottom: 22 },
  xAxis: { type: 'category', boundaryGap: false, data: demoSituationScenario.link.times, axisLabel: { color: '#748198', fontSize: 9 }, axisLine: { lineStyle: { color: '#2c3950' } } },
  yAxis: { type: 'value', min: 0, max: 50, axisLabel: { color: '#748198', fontSize: 9, formatter: '{value}' }, splitLine: { lineStyle: { color: 'rgba(100,120,150,.13)' } } },
  series: [
    { name: '上行 Mbps', type: 'line', smooth: true, symbol: 'none', data: demoSituationScenario.link.uplinkTrend, lineStyle: { width: 2, color: '#5a95ff' }, areaStyle: { color: 'rgba(90,149,255,.10)' } },
    { name: '下行 Mbps', type: 'line', smooth: true, symbol: 'none', data: demoSituationScenario.link.downlinkTrend, lineStyle: { width: 2, color: '#43d7a2' }, areaStyle: { color: 'rgba(67,215,162,.08)' }, markLine: { silent: true, symbol: 'none', label: { formatter: '80%', color: '#e9b949', fontSize: 9 }, lineStyle: { color: '#e9b949', type: 'dashed' }, data: [{ yAxis: 40 }] } }
  ]
}));

const recentActivities = computed(() => demoSituationScenario.people
  .flatMap((person) => person.activities.map((activity) => ({ ...activity, person })))
  .sort((a, b) => a.minutesAgo - b.minutesAgo)
  .slice(0, 5));

const equipmentIcon: Record<DemoEquipmentType, BaseIconName> = {
  pad: 'terminal',
  'crypto-box': 'security',
  'message-app': 'business',
  'signing-app': 'policy',
  satellite: 'gateway'
};

function selectRegion(region: DemoRegion | string) {
  selectedCountryCode.value = typeof region === 'string' ? region : region.countryCode;
}

function openPerson(person: DemoPerson) {
  selectedPerson.value = person;
  drawerTab.value = 'overview';
}

function relativeTime(minutes: number) {
  return minutes < 1 ? '刚刚' : `${minutes} 分钟前`;
}
</script>

<template>
  <div class="demo-overview">
    <header class="demo-heading">
      <div>
        <span class="eyebrow">GLOBAL OPERATIONS</span>
        <h1>全球业务与装备综合态势</h1>
      </div>
      <div class="heading-status"><i />模拟数据 <span>更新时间 {{ generatedTime }}</span></div>
    </header>

    <section class="metric-strip" aria-label="综合核心指标">
      <article v-for="metric in topMetrics" :key="metric.label" class="metric-block" :class="`tone-${metric.tone}`">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong>
        <p>{{ metric.note }}</p>
      </article>
    </section>

    <section class="overview-workspace">
      <aside class="workspace-column left-column">
        <article class="ops-panel equipment-panel">
          <header><div><span>装备套件状态</span><small>EQUIPMENT READINESS</small></div><b>{{ demoTotals.healthySuites }}/{{ demoTotals.assignedPeople }}</b></header>
          <div class="readiness-list">
            <div v-for="item in equipmentMetrics" :key="item.label" class="readiness-row">
              <div><span>{{ item.label }}</span><strong>{{ item.value }}/20</strong></div>
              <i><em :class="`tone-${item.tone}`" :style="{ width: `${item.value / 20 * 100}%` }" /></i>
            </div>
          </div>
        </article>

        <article class="ops-panel region-panel">
          <header><div><span>全球人员分布</span><small>COUNTRY DISTRIBUTION</small></div><b>6</b></header>
          <div class="region-list">
            <button v-for="region in demoSituationScenario.regions" :key="region.countryCode" type="button" :class="{ active: selectedCountryCode === region.countryCode }" @click="selectRegion(region)">
              <i :class="region.people.some((person) => person.suiteStatus === 'offline') ? 'danger' : region.people.some((person) => person.suiteStatus === 'degraded') ? 'warning' : 'success'" />
              <span>{{ region.countryCode === 'CN' ? '北京' : region.countryName }}</span>
              <strong>{{ region.people.filter((person) => person.online).length }}/{{ region.people.length }}</strong>
            </button>
          </div>
        </article>
      </aside>

      <main class="center-column">
        <article class="ops-panel map-panel">
          <header class="map-heading"><div><span>人员与境外通信分布</span><small>北京中心 · 5 个境外保障区域</small></div><div class="map-legend"><span><i class="success" />正常</span><span><i class="warning" />降级</span><span><i class="danger" />离线</span></div></header>
          <div class="map-body"><DemoWorldMap :regions="demoSituationScenario.regions" :selected-country-code="selectedCountryCode" @select-country="selectRegion" /></div>
        </article>

        <article class="ops-panel link-panel">
          <header><div><span>境外共享链路</span><small>50 Mbps BANDWIDTH</small></div><div class="link-values"><span>上行 <b>12.8</b> Mbps</span><span>下行 <b>18.6</b> Mbps</span><span>今日 <b>11.5</b> GB</span></div></header>
          <div class="link-chart"><EChartWidget :option="linkChartOption" /></div>
        </article>
      </main>

      <aside class="workspace-column right-column">
        <article class="ops-panel country-panel">
          <header><div><span>{{ selectedRegion?.countryCode === 'CN' ? '北京' : selectedRegion?.countryName }}装备人员</span><small>{{ selectedRegion?.city }} · {{ selectedRegion?.people.length }} 人</small></div><b>{{ selectedRegion?.people.filter((person) => person.online).length }} 在线</b></header>
          <div class="person-list">
            <button v-for="person in selectedRegion?.people" :key="person.id" type="button" @click="openPerson(person)">
              <span class="person-avatar">{{ person.name.slice(0, 1) }}</span>
              <span class="person-copy"><strong>{{ person.name }} <i :class="person.online ? 'online' : ''" /></strong><small>{{ person.code }} · {{ person.equipment[0].code }}</small></span>
              <b :class="`suite-${person.suiteStatus}`">{{ person.suiteStatusLabel }}</b>
            </button>
          </div>
        </article>

        <article class="ops-panel business-panel">
          <header><div><span>今日业务摘要</span><small>MESSAGE & SIGNING</small></div><b>{{ demoTotals.messageLoggedIn }} 登录</b></header>
          <div class="business-grid">
            <span><small>消息发送</small><strong>{{ demoTotals.message.sentMessages }}</strong></span>
            <span><small>消息接收</small><strong>{{ demoTotals.message.receivedMessages }}</strong></span>
            <span><small>文件发送</small><strong>{{ demoTotals.message.sentFiles }}</strong></span>
            <span><small>文件接收</small><strong>{{ demoTotals.message.receivedFiles }}</strong></span>
            <span><small>签阅收到</small><strong>{{ demoTotals.signing.received }}</strong></span>
            <span><small>签阅处理</small><strong>{{ demoTotals.signing.processed }}</strong></span>
          </div>
          <div class="activity-list">
            <div v-for="item in recentActivities.slice(0, 3)" :key="item.id"><i :class="`tone-${item.tone}`" /><span><strong>{{ item.person.name }} · {{ item.title }}</strong><small>{{ relativeTime(item.minutesAgo) }}</small></span></div>
          </div>
        </article>
      </aside>
    </section>

    <DetailDrawerShell
      :open="Boolean(selectedPerson)"
      :title="selectedPerson ? `${selectedPerson.name} · 装备套件` : '装备套件'"
      :subtitle="selectedPerson ? `${selectedPerson.code} · ${selectedPerson.countryName}` : ''"
      :badges="selectedPerson ? [{ label: selectedPerson.online ? '用户在线' : '用户离线', tone: selectedPerson.online ? 'success' : 'danger' }, { label: selectedPerson.suiteStatusLabel, tone: selectedPerson.suiteStatus === 'healthy' ? 'success' : selectedPerson.suiteStatus === 'degraded' ? 'warning' : 'danger' }] : []"
      :tabs="[{ key: 'overview', label: '人员概况' }, { key: 'equipment', label: '装备套件' }, { key: 'activity', label: '业务活动' }]"
      :active-tab="drawerTab"
      @close="selectedPerson = null"
      @select-tab="drawerTab = $event"
    >
      <template v-if="selectedPerson">
        <section v-if="drawerTab === 'overview'" class="drawer-stack">
          <div class="drawer-facts">
            <article><span>所属部门</span><strong>{{ selectedPerson.department }}</strong></article>
            <article><span>所在区域</span><strong>{{ selectedPerson.countryName }} · {{ selectedPerson.city }}</strong></article>
            <article><span>终端地址</span><strong>{{ selectedPerson.primaryIp }}</strong></article>
            <article><span>最后活动</span><strong>{{ relativeTime(selectedPerson.lastActiveMinutes) }}</strong></article>
          </div>
          <article class="drawer-summary"><span>今日密信</span><strong>{{ selectedPerson.message.sentMessages + selectedPerson.message.receivedMessages }} 条消息 · {{ selectedPerson.message.sentFiles + selectedPerson.message.receivedFiles }} 份文件</strong></article>
          <article class="drawer-summary"><span>今日签阅</span><strong>收到 {{ selectedPerson.signing.received }} 份 · 已处理 {{ selectedPerson.signing.processed }} 份</strong></article>
        </section>
        <section v-else-if="drawerTab === 'equipment'" class="equipment-cards">
          <article v-for="item in selectedPerson.equipment" :key="item.type" :class="`tone-${item.tone}`">
            <span class="equipment-icon"><BaseIcon :name="equipmentIcon[item.type]" /></span>
            <div><strong>{{ item.label }}</strong><small>{{ item.code }} · {{ item.version }}</small><p>{{ item.detail }}</p></div>
            <b>{{ item.statusLabel }}</b>
          </article>
        </section>
        <section v-else class="drawer-stack">
          <article v-for="activity in selectedPerson.activities" :key="activity.id" class="drawer-activity"><i :class="`tone-${activity.tone}`" /><div><strong>{{ activity.title }}</strong><p>{{ activity.detail }}</p><small>{{ relativeTime(activity.minutesAgo) }}</small></div></article>
        </section>
      </template>
    </DetailDrawerShell>
  </div>
</template>

<style scoped>
.demo-overview { height: calc(100vh - 106px); min-height: 620px; display: grid; grid-template-rows: auto auto minmax(0, 1fr); gap: 10px; color: #e7ebf5; }
.demo-heading { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.eyebrow { color: #6e8db5; font: 10px var(--font-family-mono, monospace); }
.demo-heading h1 { margin: 3px 0 0; font-size: 22px; letter-spacing: 0; }
.heading-status { display: flex; align-items: center; gap: 7px; color: #7edbb7; font-size: 11px; }
.heading-status i { width: 7px; height: 7px; border-radius: 50%; background: #43d7a2; box-shadow: 0 0 9px rgba(67,215,162,.6); }
.heading-status span { margin-left: 8px; color: #7f8ba0; }
.metric-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid #28344a; background: #111827; }
.metric-block { min-height: 82px; padding: 12px 16px; border-right: 1px solid #28344a; }
.metric-block:last-child { border-right: 0; }
.metric-block > span { color: #8e99aa; font-size: 11px; }
.metric-block strong { display: block; margin-top: 3px; color: #f2f5fb; font: 600 25px var(--font-family-mono, monospace); }
.metric-block strong small { margin-left: 4px; color: #8995a8; font-size: 11px; font-weight: 500; }
.metric-block p { margin: 2px 0 0; color: #657389; font-size: 10px; }
.metric-block.tone-success strong { color: #72deb9; }.metric-block.tone-info strong { color: #85aefd; }.metric-block.tone-warning strong { color: #edc66b; }
.overview-workspace { min-height: 0; display: grid; grid-template-columns: minmax(220px, 250px) minmax(500px, 1fr) minmax(270px, 310px); gap: 10px; }
.workspace-column,.center-column { min-height: 0; display: grid; gap: 10px; }.left-column { grid-template-rows: 1.05fr .95fr; }.right-column { grid-template-rows: 1fr 1.12fr; }.center-column { grid-template-rows: minmax(400px, 1fr) 180px; }
.ops-panel { min-width: 0; min-height: 0; overflow: hidden; border: 1px solid #28344a; background: #111827; }
.ops-panel > header { height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 13px; border-bottom: 1px solid #263147; }
.ops-panel header div { min-width: 0; }.ops-panel header span { display: block; color: #dfe5ef; font-size: 12px; font-weight: 600; }.ops-panel header small { display: block; margin-top: 2px; color: #64728a; font-size: 9px; }.ops-panel header > b { color: #8fb1ed; font: 600 11px var(--font-family-mono, monospace); white-space: nowrap; }
.readiness-list { display: grid; gap: 13px; padding: 14px; }.readiness-row > div { display: flex; justify-content: space-between; color: #8995a9; font-size: 10px; }.readiness-row strong { color: #cfd7e4; font-family: var(--font-family-mono, monospace); }.readiness-row > i { display: block; height: 4px; margin-top: 6px; background: #232e42; }.readiness-row em { display: block; height: 100%; background: #7488a7; }.readiness-row em.tone-success { background: #43d7a2; }.readiness-row em.tone-warning { background: #e8b94f; }.readiness-row em.tone-info { background: #5a95ff; }
.region-list { display: grid; }.region-list button { height: 38px; display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 8px; padding: 0 13px; border: 0; border-bottom: 1px solid #202b3e; color: #8f9aac; background: transparent; cursor: pointer; text-align: left; }.region-list button:hover,.region-list button.active { color: #e8edf6; background: #19243a; }.region-list i,.map-legend i { width: 6px; height: 6px; border-radius: 50%; }.region-list i.success,.map-legend i.success { background: #43d7a2; }.region-list i.warning,.map-legend i.warning { background: #e9b949; }.region-list i.danger,.map-legend i.danger { background: #f26478; }.region-list strong { font: 600 10px var(--font-family-mono, monospace); }
.map-panel { display: grid; grid-template-rows: 48px minmax(0, 1fr); }.map-heading { height: auto !important; }.map-legend { display: flex; align-items: center; gap: 12px; }.map-legend span { display: flex !important; align-items: center; gap: 5px; color: #7e8a9e !important; font-size: 9px !important; font-weight: 400 !important; }.map-body { min-height: 0; background: #0c1321; }
.link-panel { display: grid; grid-template-rows: 48px minmax(0, 1fr); }.link-values { display: flex; gap: 14px; }.link-values span { color: #758298 !important; font-size: 9px !important; font-weight: 400 !important; }.link-values b { color: #cbd5e4; }.link-chart { min-height: 0; }
.person-list { overflow: auto; }.person-list button { width: 100%; min-height: 54px; display: grid; grid-template-columns: 30px 1fr auto; align-items: center; gap: 8px; padding: 7px 12px; border: 0; border-bottom: 1px solid #222d41; color: #dce3ee; background: transparent; cursor: pointer; text-align: left; }.person-list button:hover { background: #182338; }.person-avatar { width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid #3d5374; background: #1c2a41; color: #a9bee2; font-size: 11px; }.person-copy { min-width: 0; }.person-copy strong,.person-copy small { display: block; }.person-copy strong { font-size: 11px; }.person-copy small { margin-top: 3px; color: #69778e; font: 9px var(--font-family-mono, monospace); }.person-copy i { display: inline-block; width: 5px; height: 5px; margin-left: 4px; border-radius: 50%; background: #5f6a7d; }.person-copy i.online { background: #43d7a2; }.person-list button > b { font-size: 9px; font-weight: 500; white-space: nowrap; }.suite-healthy { color: #64d5aa; }.suite-degraded { color: #e5b84f; }.suite-offline { color: #ef697b; }
.business-grid { display: grid; grid-template-columns: repeat(3, 1fr); padding: 10px 12px; border-bottom: 1px solid #253047; }.business-grid > span { padding: 6px 8px; border-right: 1px solid #253047; }.business-grid > span:nth-child(3n) { border-right: 0; }.business-grid small,.business-grid strong { display: block; }.business-grid small { color: #6f7d93; font-size: 9px; }.business-grid strong { margin-top: 3px; color: #dce5f2; font: 600 15px var(--font-family-mono, monospace); }.activity-list { padding: 5px 12px; }.activity-list > div { display: grid; grid-template-columns: 5px 1fr; gap: 8px; align-items: start; padding: 7px 0; border-bottom: 1px solid #222d41; }.activity-list i,.drawer-activity > i { width: 5px; height: 5px; margin-top: 5px; border-radius: 50%; background: #5a95ff; }.activity-list i.tone-success,.drawer-activity > i.tone-success { background: #43d7a2; }.activity-list i.tone-warning,.drawer-activity > i.tone-warning { background: #e9b949; }.activity-list strong,.activity-list small { display: block; }.activity-list strong { overflow: hidden; color: #bfc9d8; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.activity-list small { margin-top: 2px; color: #637188; font-size: 8px; }
.drawer-stack { display: grid; gap: 12px; }.drawer-facts { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }.drawer-facts article,.drawer-summary,.equipment-cards article,.drawer-activity { border: 1px solid #29364d; background: #111a2a; }.drawer-facts article { min-height: 74px; padding: 12px; }.drawer-facts span,.drawer-summary span { display: block; color: #75839a; font-size: 10px; }.drawer-facts strong,.drawer-summary strong { display: block; margin-top: 7px; color: #e0e6ef; font-size: 12px; }.drawer-summary { padding: 14px; }.equipment-cards { display: grid; gap: 8px; }.equipment-cards article { min-height: 84px; display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; align-items: center; padding: 12px; }.equipment-icon { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid #3a4b67; color: #91a9cf; }.equipment-icon :deep(svg) { width: 18px; }.equipment-cards strong,.equipment-cards small,.equipment-cards p { display: block; }.equipment-cards strong { font-size: 12px; }.equipment-cards small { margin-top: 3px; color: #6f7e96; font: 9px var(--font-family-mono, monospace); }.equipment-cards p { margin: 6px 0 0; color: #8d9aae; font-size: 10px; }.equipment-cards article > b { color: #72d9b4; font-size: 10px; }.equipment-cards article.tone-warning > b { color: #e8bc59; }.equipment-cards article.tone-danger > b { color: #ef7182; }.drawer-activity { display: grid; grid-template-columns: 7px 1fr; gap: 10px; padding: 12px; }.drawer-activity strong { font-size: 12px; }.drawer-activity p { margin: 5px 0; color: #8b98aa; font-size: 10px; }.drawer-activity small { color: #637188; font-size: 9px; }
@media (max-width: 1450px) { .overview-workspace { grid-template-columns: 220px minmax(430px,1fr) 270px; }.link-values span:last-child { display: none !important; } }
@media (max-height: 820px) and (min-width: 1101px) { .center-column { grid-template-rows: minmax(280px, 1fr) 140px; }.ops-panel > header { height: 42px; }.map-panel,.link-panel { grid-template-rows: 42px minmax(0,1fr); }.readiness-list { gap: 8px; padding: 10px 14px; }.readiness-row > i { margin-top: 4px; }.region-list button { height: 32px; }.person-list button { min-height: 47px; }.business-grid { padding: 6px 12px; }.activity-list > div { padding: 5px 0; } }
@media (max-width: 1100px) { .demo-overview { height: auto; grid-template-rows: auto auto auto; }.overview-workspace { grid-template-columns: 1fr 1.7fr; }.right-column { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; grid-template-rows: 320px; }.metric-strip { grid-template-columns: repeat(2,1fr); }.metric-block:nth-child(2) { border-right: 0; } }
@media (max-width: 760px) { .demo-heading { align-items: flex-start; }.heading-status span { display: none; }.metric-strip,.overview-workspace { grid-template-columns: 1fr; }.metric-block { border-right: 0; border-bottom: 1px solid #28344a; }.left-column,.right-column { grid-column: auto; grid-template-columns: 1fr; grid-template-rows: auto; }.center-column { grid-template-rows: 440px 190px; }.map-legend,.link-values { display: none; } }
</style>
