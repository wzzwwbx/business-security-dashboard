<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import DetailDrawerShell from '@/components/common/DetailDrawerShell.vue';
import DemoWorldMap from '@/components/demo/DemoWorldMap.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import { demoSituationScenario, demoTotals } from '@/mocks/demoSituation';
import type { DemoActivity, DemoEquipmentType, DemoPerson, DemoRegion } from '@/types/demoSituation';
import type { BaseIconName } from '@/components/common/BaseIcon.vue';
import { compactDepartmentName, messageRankingOption, type RankingMode } from '@/utils/rankingChart';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const selectedCountryCode = ref('AE');
const selectedPerson = ref<DemoPerson | null>(null);
const drawerTab = ref('overview');
const securityEvents = demoSituationScenario.securityEvents;
const personSecurityEvents = computed(() => selectedPerson.value
  ? demoSituationScenario.securityEvents.filter((event) => event.personId === selectedPerson.value?.id)
  : []);
const topMetrics = computed(() => {
  const events = demoSituationScenario.securityEvents;
  return [
    { label: '在线用户 / 用户总数', value: `${demoTotals.onlinePeople}/${demoTotals.assignedPeople}`, unit: '人', note: `在线率 ${(demoTotals.onlinePeople / demoTotals.assignedPeople * 100).toFixed(0)}%`, tone: 'success' },
    { label: '今日密信消息收发', value: demoTotals.message.sentMessages + demoTotals.message.receivedMessages, unit: '条', note: `密信文件收发 ${demoTotals.message.sentFiles + demoTotals.message.receivedFiles} 份`, tone: 'info', drill: 'message' as const },
    { label: '今日安全事件', value: events.length, unit: '起', note: '安全、认证与链路事件滚动更新', tone: 'warning' },
    { label: '签阅收到 / 已处理', value: `${demoTotals.signing.received}/${demoTotals.signing.processed}`, unit: '份', note: `待处理 ${demoTotals.signing.pending} 份 · 异常退回 ${demoTotals.signing.exception} 份`, tone: 'info', drill: 'signing' as const }
  ];
});

const rankingModes: Array<{ key: RankingMode; label: string }> = [
  { key: 'total', label: '总量' },
  { key: 'sent', label: '发送' },
  { key: 'received', label: '接收' }
];
const userRankingMode = ref<RankingMode>('total');
const deptRankingMode = ref<RankingMode>('total');

const userRankingRows = computed(() => demoSituationScenario.people
  .map((person) => ({
    person,
    sent: person.message.sentMessages,
    received: person.message.receivedMessages,
    total: person.message.sentMessages + person.message.receivedMessages
  }))
  .sort((a, b) => b[userRankingMode.value] - a[userRankingMode.value])
  .slice(0, 6));

const deptRankingRows = computed(() => {
  const map = new Map<string, { department: string; sent: number; received: number; people: number }>();
  demoSituationScenario.people.forEach((person) => {
    const entry = map.get(person.department) ?? { department: person.department, sent: 0, received: 0, people: 0 };
    entry.sent += person.message.sentMessages;
    entry.received += person.message.receivedMessages;
    entry.people += 1;
    map.set(person.department, entry);
  });
  return [...map.values()]
    .map((entry) => ({ ...entry, total: entry.sent + entry.received }))
    .sort((a, b) => b[deptRankingMode.value] - a[deptRankingMode.value])
    .slice(0, 6);
});

const userRankingOption = computed(() => messageRankingOption(
  userRankingRows.value,
  userRankingMode.value,
  (item) => item.person.name,
  (item) => ({ personId: item.person.id, context: item.person.department })
));

const deptRankingOption = computed(() => messageRankingOption(
  deptRankingRows.value,
  deptRankingMode.value,
  (item) => compactDepartmentName(item.department),
  (item) => ({ department: item.department, context: `${item.people} 人` }),
  (item) => item.department
));

// 区域运行状态：以紧凑列表替代原先的人员明细列表。
// 区域运行状态：仅展示当前有在线人员或有流量的活跃区域。
const regionStatusRows = computed(() => demoSituationScenario.regions
  .filter((region) => region.people.some((person) => person.online) || region.trafficGb > 0)
  .map((region) => {
    const online = region.people.filter((person) => person.online).length;
    const toneClass = online === 0 ? 'offline' : online === region.people.length ? 'success' : 'warning';
    return {
      countryCode: region.countryCode,
      countryName: region.countryName,
      linkType: region.linkType,
      trafficGb: region.trafficGb,
      online,
      total: region.people.length,
      toneClass
    };
  }));

// 各业务系统流量：密信、签阅、密盒三大核心业务直接呈现。
const systemTrafficOption = computed(() => {
  const palette = ['#5a95ff', '#43d7a2', '#d3a84d'];
  const fills = ['rgba(90,149,255,.14)', 'rgba(67,215,162,.11)', 'rgba(211,168,77,.09)'];
  const main = ['msg', 'sign', 'crypto'];
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: '#60789e', type: 'dashed' } }, valueFormatter: (value: number) => `${value.toFixed(1)} Mbps` },
    legend: { top: 0, right: 8, itemWidth: 12, itemHeight: 8, itemGap: 10, textStyle: { color: '#8592a7', fontSize: 12 } },
    grid: { left: 40, right: 16, top: 28, bottom: 22 },
    xAxis: { type: 'category', boundaryGap: false, data: demoSituationScenario.systemTraffic.times, axisLabel: { color: '#748198', fontSize: 11 }, axisLine: { lineStyle: { color: '#303d53' } } },
    yAxis: { type: 'value', axisLabel: { color: '#748198', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(110,130,160,.13)' } } },
    series: demoSituationScenario.systemTraffic.series
      .filter((item) => main.includes(item.code))
      .map((item, index) => ({
        name: item.name,
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        symbolSize: 6,
        data: item.data,
        itemStyle: { color: palette[index] },
        lineStyle: { width: 2, color: palette[index] },
        areaStyle: { color: fills[index] },
        emphasis: { focus: 'series', lineStyle: { width: 3 } }
      }))
  };
});

const systemTrafficTotal = computed(() =>
  demoSituationScenario.systemTraffic.snapshot.reduce((sum, item) => sum + item.throughputMbps, 0)
);

const signingCompletionRate = computed(() => demoTotals.signing.received
  ? demoTotals.signing.processed / demoTotals.signing.received * 100
  : 0);

const securityEventSummary = computed(() => ({
  high: securityEvents.filter((event) => event.securityLevel === 'high').length,
  medium: securityEvents.filter((event) => event.securityLevel === 'medium').length
}));

const recentActivities = computed(() => demoSituationScenario.people
  .flatMap((person) => person.activities.map((activity) => ({ ...activity, person })))
  .sort((a, b) => a.minutesAgo - b.minutesAgo || String(b.id).localeCompare(String(a.id)))
  .slice(0, 6));

const equipmentIcon: Record<DemoEquipmentType, BaseIconName> = {
  pad: 'terminal',
  'crypto-box': 'security',
  key: 'security',
  'message-app': 'business',
  'signing-app': 'policy',
  satellite: 'gateway'
};

function selectRegion(region: DemoRegion | string) {
  selectedCountryCode.value = typeof region === 'string' ? region : region.countryCode;
}

// 业务态势下钻：首页相关图表/面板点击后进入业务态势对应专题。
function drillBusiness(topic: 'message' | 'signing' | 'traffic' = 'message') {
  void router.push({ path: '/business', query: { topic } });
}

function openPerson(person: DemoPerson) {
  selectedPerson.value = person;
  drawerTab.value = 'overview';
}

function handleUserRankingClick(payload: Record<string, any>) {
  const personId = payload.data?.personId;
  const person = demoSituationScenario.people.find((item) => item.id === personId);
  if (person) openPerson(person);
}

function handleDeptRankingClick() {
  drillBusiness('message');
}

function openSecurityEvent(event: DemoActivity) {
  const person = demoSituationScenario.people.find((item) => item.id === event.personId);
  if (!person) return;
  selectedPerson.value = person;
  drawerTab.value = 'security';
}

function personName(personId: string) {
  return demoSituationScenario.people.find((item) => item.id === personId)?.name ?? '—';
}

// 用户抽屉中的最近收发对象（A 发送给 B / B 发送给 A 的关系）。
const personRelations = computed(() => {
  if (!selectedPerson.value) return null;
  const recipients = selectedPerson.value.message.topRecipients
    .map((item) => `${personName(item.personId)} ${item.count} 条`)
    .join('、');
  const senders = selectedPerson.value.message.topSenders
    .map((item) => `${personName(item.personId)} ${item.count} 条`)
    .join('、');
  return { recipients, senders };
});

function relativeTime(minutes: number) {
  const value = Math.round(minutes);
  return value < 1 ? '最新' : `${value} 分钟前`;
}

function securityLevelLabel(event: DemoActivity) {
  if (event.securityLevel === 'high') return '高危';
  if (event.securityLevel === 'medium') return '中危';
  return '提示';
}

function eventClock(event: DemoActivity) {
  const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date(Date.now() - event.minutesAgo * 60000);
  return occurredAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
</script>

<template>
  <div class="demo-overview">
    <section class="metric-strip" aria-label="综合核心指标">
      <article v-for="metric in topMetrics" :key="metric.label" class="metric-block" :class="[`tone-${metric.tone}`, { drillable: metric.drill }]" @click="metric.drill && drillBusiness(metric.drill)">
        <span>{{ metric.label }}<i v-if="metric.drill" class="drill-hint">点击下钻</i></span>
        <strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong>
        <p>{{ metric.note }}</p>
      </article>
    </section>

    <section class="overview-workspace">
      <aside class="workspace-column left-column">
        <article class="ops-panel ranking-panel">
          <header class="ranking-header">
            <span>用户收发排名</span>
            <div class="rank-mode-switch" role="group" aria-label="用户排名统计方式">
              <button v-for="mode in rankingModes" :key="mode.key" type="button" :class="{ active: userRankingMode === mode.key }" :aria-pressed="userRankingMode === mode.key" @click="userRankingMode = mode.key">{{ mode.label }}</button>
            </div>
          </header>
          <div class="ranking-chart"><EChartWidget :option="userRankingOption" @chart-click="handleUserRankingClick" /></div>
        </article>

        <article class="ops-panel ranking-panel">
          <header class="ranking-header">
            <span>部门收发排名</span>
            <div class="rank-mode-switch" role="group" aria-label="部门排名统计方式">
              <button v-for="mode in rankingModes" :key="mode.key" type="button" :class="{ active: deptRankingMode === mode.key }" :aria-pressed="deptRankingMode === mode.key" @click="deptRankingMode = mode.key">{{ mode.label }}</button>
            </div>
          </header>
          <div class="ranking-chart"><EChartWidget :option="deptRankingOption" @chart-click="handleDeptRankingClick" /></div>
        </article>
      </aside>

      <main class="center-column">
        <article class="ops-panel map-panel">
          <div class="map-body"><DemoWorldMap :regions="demoSituationScenario.regions" :selected-country-code="selectedCountryCode" @select-country="selectRegion" /></div>
        </article>
      </main>

      <aside class="workspace-column right-column">
        <article class="ops-panel business-panel drill-panel" @click="drillBusiness('message')">
          <header><span>今日业务摘要</span><b>查看明细 ›</b></header>
          <div class="business-grid">
            <span><small>消息发送</small><strong>{{ demoTotals.message.sentMessages }}</strong></span>
            <span><small>消息接收</small><strong>{{ demoTotals.message.receivedMessages }}</strong></span>
            <span><small>文件发送</small><strong>{{ demoTotals.message.sentFiles }}</strong></span>
            <span><small>文件接收</small><strong>{{ demoTotals.message.receivedFiles }}</strong></span>
            <span><small>签阅收到</small><strong>{{ demoTotals.signing.received }}</strong></span>
            <span><small>签阅处理</small><strong>{{ demoTotals.signing.processed }}</strong></span>
          </div>
          <div class="activity-list">
            <div v-for="item in recentActivities.slice(0, 4)" :key="item.id"><i :class="`tone-${item.tone}`" /><span><strong>{{ item.person.name }} · {{ item.title }}</strong><small>{{ relativeTime(item.minutesAgo) }}</small></span></div>
          </div>
        </article>

        <article class="ops-panel region-status-panel drill-panel" @click="drillBusiness('traffic')">
          <header><span>区域运行状态</span><b>链路明细 ›</b></header>
          <div class="region-status-list">
            <div v-for="region in regionStatusRows" :key="region.countryCode" class="region-status-row">
              <i :class="`tone-${region.toneClass}`" />
              <span class="region-status-copy"><strong>{{ region.countryCode === 'CN' ? '北京' : region.countryName }}</strong><small>{{ region.linkType === 'satellite' ? '卫星信道' : '地面信道' }} · 今日 {{ region.trafficGb.toFixed(1) }} GB</small></span>
              <b>{{ region.online }}/{{ region.total }}</b>
            </div>
          </div>
        </article>
      </aside>
    </section>

    <section class="bottom-strip">
      <article class="ops-panel system-traffic-panel drill-panel" @click="drillBusiness('traffic')">
        <header><span>业务系统流量</span><b>{{ systemTrafficTotal.toFixed(1) }} Mbps · 明细 ›</b></header>
        <div class="system-traffic-chart"><EChartWidget :option="systemTrafficOption" /></div>
      </article>

      <article class="ops-panel security-panel">
        <header><span>安全事件</span><b>高危 {{ securityEventSummary.high }} · 中危 {{ securityEventSummary.medium }}</b></header>
        <div class="security-list">
          <button v-for="event in securityEvents.slice(0, 3)" :key="event.id" type="button" class="security-item" :title="event.detail" @click="openSecurityEvent(event)">
            <i :class="`tone-${event.tone}`" />
            <span class="security-level" :class="`level-${event.securityLevel ?? 'notice'}`">{{ securityLevelLabel(event) }}</span>
            <time>{{ eventClock(event) }}</time>
            <span class="security-copy"><strong>{{ event.title }}</strong><small>{{ event.detail }}</small></span>
          </button>
        </div>
      </article>

      <article class="ops-panel signing-panel drill-panel" @click="drillBusiness('signing')">
        <header><span>签阅处置</span><b>处理率 {{ signingCompletionRate.toFixed(1) }}% · 明细 ›</b></header>
        <div class="signing-content">
          <div class="signing-progress" aria-label="签阅处理进度"><i><em :style="{ width: `${signingCompletionRate}%` }" /></i><span>{{ demoTotals.signing.processed }}/{{ demoTotals.signing.received }}</span></div>
          <div class="signing-stats">
            <span><small>签阅收到</small><strong>{{ demoTotals.signing.received }}</strong></span>
            <span><small>已处理</small><strong>{{ demoTotals.signing.processed }}</strong></span>
            <span class="warning"><small>待处理</small><strong>{{ demoTotals.signing.pending }}</strong></span>
            <span class="danger"><small>异常退回</small><strong>{{ demoTotals.signing.exception }}</strong></span>
          </div>
        </div>
      </article>
    </section>

    <DetailDrawerShell
      centered
      :open="Boolean(selectedPerson)"
      :title="selectedPerson ? `${selectedPerson.name} · 人员详情` : '人员详情'"
      :subtitle="selectedPerson ? `${selectedPerson.code} · ${selectedPerson.countryName} ${selectedPerson.city}` : ''"
      :badges="selectedPerson ? [{ label: selectedPerson.online ? '用户在线' : '用户离线', tone: selectedPerson.online ? 'success' : 'danger' }, { label: selectedPerson.suiteStatusLabel, tone: selectedPerson.suiteStatus === 'healthy' ? 'success' : selectedPerson.suiteStatus === 'degraded' ? 'warning' : 'danger' }, ...(personSecurityEvents.length ? [{ label: `${personSecurityEvents.length} 起安全事件`, tone: 'danger' as const }] : [])] : []"
      :tabs="[{ key: 'overview', label: '人员概况' }, { key: 'equipment', label: '装备套件' }, { key: 'security', label: '安全事件' }, { key: 'activity', label: '业务活动' }]"
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
          <div class="drawer-summaries">
            <article class="drawer-summary">
              <span>今日密信</span>
              <strong>收发 {{ selectedPerson.message.sentMessages + selectedPerson.message.receivedMessages }} 条消息 · {{ selectedPerson.message.sentFiles + selectedPerson.message.receivedFiles }} 份文件</strong>
              <small>发送 {{ selectedPerson.message.sentMessages }} 条 · 接收 {{ selectedPerson.message.receivedMessages }} 条 · 收发文件 {{ selectedPerson.message.sentFiles + selectedPerson.message.receivedFiles }} 份</small>
            </article>
            <article class="drawer-summary">
              <span>今日签阅</span>
              <strong>收到 {{ selectedPerson.signing.received }} 份 · 已处理 {{ selectedPerson.signing.processed }} 份</strong>
              <small>待处理 {{ selectedPerson.signing.pending }} 份 · 异常退回 {{ selectedPerson.signing.exception }} 份</small>
            </article>
          </div>
          <div v-if="personRelations" class="drawer-summary">
            <span>最近收发对象</span>
            <strong v-if="personRelations.recipients">发送给：{{ personRelations.recipients }}</strong>
            <strong v-if="personRelations.senders">来自：{{ personRelations.senders }}</strong>
            <small>点击人员排名可继续下钻收发关系</small>
          </div>
          <div class="drawer-facts">
            <article><span>在线状态</span><strong>{{ selectedPerson.online ? '在线' : '离线' }}</strong></article>
            <article><span>套件状态</span><strong>{{ selectedPerson.suiteStatusLabel }}</strong></article>
            <article><span>密信会话</span><strong>{{ selectedPerson.equipment.find((item) => item.type === 'message-app')?.statusLabel ?? '—' }}</strong></article>
            <article><span>卫星链路</span><strong>{{ selectedPerson.equipment.find((item) => item.type === 'satellite')?.statusLabel ?? '—' }}</strong></article>
          </div>
        </section>
        <section v-else-if="drawerTab === 'equipment'" class="equipment-cards">
          <article v-for="item in selectedPerson.equipment" :key="item.type" :class="`tone-${item.tone}`">
            <span class="equipment-icon"><BaseIcon :name="equipmentIcon[item.type]" /></span>
            <div><strong>{{ item.label }}</strong><small>{{ item.code }} · {{ item.version }}</small><p>{{ item.detail }}</p></div>
            <b>{{ item.statusLabel }}</b>
          </article>
        </section>
        <section v-else-if="drawerTab === 'security'" class="drawer-stack">
          <article v-for="event in personSecurityEvents" :key="event.id" class="drawer-activity"><i :class="`tone-${event.tone}`" /><div><strong>{{ securityLevelLabel(event) }} · {{ event.title }}</strong><p>{{ event.detail }}</p><small>{{ eventClock(event) }} · {{ relativeTime(event.minutesAgo) }}</small></div></article>
          <div v-if="!personSecurityEvents.length" class="drawer-empty">该人员暂无关联安全事件</div>
        </section>
        <section v-else class="drawer-stack">
          <article v-for="activity in selectedPerson.activities" :key="activity.id" class="drawer-activity"><i :class="`tone-${activity.tone}`" /><div><strong>{{ activity.title }}</strong><p>{{ activity.detail }}</p><small>{{ relativeTime(activity.minutesAgo) }}</small></div></article>
        </section>
      </template>
    </DetailDrawerShell>
  </div>
</template>

<style scoped>
.demo-overview { height: calc(100vh - var(--topbar-height) - 22px); min-height: 640px; display: grid; grid-template-rows: minmax(96px, auto) minmax(0, 1fr) 172px; gap: 10px; color: #e7ebf5; }
.metric-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid #28344a; background: #111827; }
.metric-block { min-height: 96px; padding: 14px 18px 16px; border-right: 1px solid #28344a; }
.metric-block:last-child { border-right: 0; }
.metric-block > span { display: block; color: #aab5c7; font-size: 18px; line-height: 1.1; }
.metric-block strong { display: block; margin-top: 5px; color: #f2f5fb; font: 600 32px var(--font-family-mono, monospace); line-height: 1.05; }
.metric-block strong small { margin-left: 4px; color: #aab5c7; font-size: 16px; font-weight: 500; }
.metric-block p { margin: 5px 0 0; color: #8492a8; font-size: 14px; line-height: 1.2; }
.metric-block.tone-success strong { color: #72deb9; }.metric-block.tone-info strong { color: #85aefd; }.metric-block.tone-warning strong { color: #edc66b; }
.metric-block.drillable { cursor: pointer; transition: background .18s ease, border-color .18s ease; }.metric-block.drillable:hover { background: #16213a; box-shadow: inset 3px 0 #85aefd; }.drill-hint { margin-left: 8px; padding: 2px 6px; border: 1px solid #3d5374; border-radius: 999px; color: #7fb0ff; font-size: 12px; font-weight: 400; white-space: nowrap; }.metric-block.drillable:hover .drill-hint { color: #cfe2ff; border-color: #7fb0ff; }
.overview-workspace { min-height: 0; display: grid; grid-template-columns: minmax(250px, 270px) minmax(0, 1fr) minmax(250px, 270px); gap: 10px; }
.workspace-column,.center-column { min-height: 0; display: grid; gap: 10px; }.left-column { grid-template-rows: 1.08fr .92fr; }.right-column { grid-template-rows: 1fr 1.12fr; }.center-column { grid-template-rows: minmax(0, 1fr); }
.bottom-strip { min-height: 0; display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.2fr) minmax(0, .85fr); gap: 10px; }
.ops-panel { min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #28344a; background: #111827; }
.ops-panel > header { height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 12px; border-bottom: 1px solid #263147; }
.ops-panel header span { display: block; overflow: hidden; color: #eef4ff; font-size: 17px; font-weight: 700; white-space: nowrap; text-overflow: ellipsis; flex-shrink: 0; }.ops-panel header > b { overflow: hidden; color: #c9dbfb; font: 600 14px var(--font-family-base); white-space: nowrap; text-overflow: ellipsis; }
.ranking-panel { display: grid; grid-template-rows: 52px minmax(0,1fr); }.ranking-header { min-width: 0; }.rank-mode-switch { flex: 0 0 auto; display: inline-grid; grid-template-columns: repeat(3, 36px); height: 26px; border: 1px solid #35445d; background: #0d1524; }.rank-mode-switch button { width: 36px; height: 24px; padding: 0; border: 0; border-right: 1px solid #35445d; color: #8594aa; background: transparent; font: 12px var(--font-family-base); cursor: pointer; }.rank-mode-switch button:last-child { border-right: 0; }.rank-mode-switch button:hover { color: #dbe8fb; background: #182740; }.rank-mode-switch button.active { color: #eef5ff; background: #284b7c; box-shadow: inset 0 -2px #6aa4ff; }.ranking-chart { min-height: 0; cursor: pointer; }
.map-panel { display: block; }.map-body { min-height: 0; height: 100%; background: #0c1321; }
.bottom-strip .ops-panel > header { height: 42px; }.system-traffic-panel,.security-panel,.signing-panel { display: grid; grid-template-rows: 42px minmax(0, 1fr); }.system-traffic-chart { min-height: 0; }.security-list { min-height: 0; overflow: hidden; padding: 1px 10px; }.security-list > .security-item { width: 100%; min-height: 36px; display: grid; grid-template-columns: 7px 34px 62px minmax(0, 1fr); gap: 7px; align-items: center; padding: 2px 4px; border: 0; border-bottom: 1px solid #222d41; color: inherit; background: transparent; text-align: left; cursor: pointer; }.security-list > .security-item:hover { background: #16213a; }.security-list i { width: 7px; height: 7px; border-radius: 50%; background: #5a95ff; }.security-list i.tone-danger { background: #ef6579; }.security-list i.tone-warning { background: #e9b949; }.security-list i.tone-success { background: #43d7a2; }.security-level { display: inline-flex; align-items: center; justify-content: center; height: 20px; border: 1px solid #3c4b62; color: #9ca9ba; font-size: 11px; white-space: nowrap; }.security-level.level-high { border-color: rgba(239,101,121,.48); color: #ff8798; background: rgba(239,101,121,.09); }.security-level.level-medium { border-color: rgba(233,185,73,.46); color: #edc66b; background: rgba(233,185,73,.08); }.security-level.level-notice { border-color: rgba(90,149,255,.44); color: #85aefd; background: rgba(90,149,255,.08); }.security-copy { min-width: 0; }.security-list strong,.security-list small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.security-list strong { color: #dbe3ef; font-size: 12px; line-height: 14px; }.security-list small { margin-top: 1px; color: #77869d; font-size: 10px; line-height: 12px; }.security-list time { color: #92a0b5; font: 12px var(--font-family-mono, monospace); white-space: nowrap; }.signing-content { min-height: 0; display: grid; grid-template-rows: 32px minmax(0,1fr); padding: 7px 12px 8px; }.signing-progress { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 9px; align-items: center; }.signing-progress > i { height: 5px; overflow: hidden; background: #253149; }.signing-progress em { display: block; height: 100%; background: #43d7a2; }.signing-progress span { color: #aebbd0; font: 600 12px var(--font-family-mono, monospace); white-space: nowrap; }.signing-stats { min-height: 0; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); border-top: 1px solid #253047; }.signing-stats > span { min-width: 0; padding: 8px 7px 2px; border-right: 1px solid #253047; }.signing-stats > span:last-child { border-right: 0; }.signing-stats small,.signing-stats strong { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }.signing-stats small { color: #8492a8; font-size: 11px; }.signing-stats strong { margin-top: 4px; color: #dce5f2; font: 600 17px var(--font-family-mono, monospace); }.signing-stats .warning strong { color: #edc66b; }.signing-stats .danger strong { color: #ef7182; }
.region-status-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; }.region-status-row { width: 100%; min-height: 48px; display: grid; grid-template-columns: 7px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 6px 12px; border: 0; border-bottom: 1px solid #222d41; color: inherit; background: transparent; cursor: pointer; text-align: left; }.region-status-row:hover { background: #182338; }.region-status-row > i { width: 7px; height: 7px; border-radius: 50%; background: #778397; }.region-status-row > i.tone-success { background: #43d7a2; }.region-status-row > i.tone-warning { background: #e9b949; }.region-status-row > i.tone-offline { background: #778397; }.region-status-copy { min-width: 0; }.region-status-copy strong, .region-status-copy small { display: block; }.region-status-copy strong { color: #cfd7e3; font-size: 12px; }.region-status-copy small { margin-top: 3px; color: #8492a8; font: 11px var(--font-family-base); }.region-status-row > b { color: #b4c0d2; font: 600 12px var(--font-family-base); white-space: nowrap; }
.business-grid { flex: 0 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); padding: 10px 12px; border-bottom: 1px solid #253047; }.business-grid > span { min-width: 0; padding: 6px 8px; border-right: 1px solid #253047; }.business-grid > span:nth-child(3n) { border-right: 0; }.business-grid small,.business-grid strong { display: block; }.business-grid small { overflow: hidden; color: #8492a8; font-size: 13px; white-space: nowrap; text-overflow: ellipsis; }.business-grid strong { margin-top: 3px; color: #dce5f2; font: 600 15px var(--font-family-base); white-space: nowrap; }.activity-list { flex: 1 1 auto; min-height: 0; overflow: hidden; padding: 2px 12px; }.activity-list > div { display: grid; grid-template-columns: 6px 1fr; gap: 8px; align-items: start; padding: 3px 0; border-bottom: 1px solid #222d41; }.activity-list i,.drawer-activity > i { width: 6px; height: 6px; margin-top: 5px; border-radius: 50%; background: #5a95ff; }.activity-list i.tone-success,.drawer-activity > i.tone-success { background: #43d7a2; }.activity-list i.tone-warning,.drawer-activity > i.tone-warning { background: #e9b949; }.activity-list strong,.activity-list small { display: block; }.activity-list strong { overflow: hidden; color: #bfc9d8; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }.activity-list small { margin-top: 1px; color: #8492a8; font-size: 12px; }
.drawer-stack { display: grid; gap: 12px; }.drawer-facts { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; }.drawer-facts article,.drawer-summary,.equipment-cards article,.drawer-activity { border: 1px solid #31405a; background: #121c2e; border-radius: 6px; }.drawer-facts article { min-height: 72px; padding: 12px; }.drawer-facts span,.drawer-summary span { display: block; color: #93a1b8; font-size: 16px; }.drawer-facts strong,.drawer-summary strong { display: block; margin-top: 6px; color: #e8eef9; font-size: 18px; line-height: 1.3; }.drawer-summaries { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }.drawer-summary { padding: 14px; }.drawer-summary small { display: block; margin-top: 6px; color: #8d9bb0; font-size: 16px; }.equipment-cards { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }.equipment-cards article { min-height: 80px; display: grid; grid-template-columns: 38px 1fr auto; gap: 12px; align-items: center; padding: 12px; }.equipment-icon { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #3a4b67; color: #91a9cf; }.equipment-icon :deep(svg) { width: 20px; }.equipment-cards strong,.equipment-cards small,.equipment-cards p { display: block; }.equipment-cards strong { font-size: 18px; }.equipment-cards small { margin-top: 3px; color: #7f8ea6; font-size: 16px; }.equipment-cards p { margin: 6px 0 0; color: #9aa8bd; font-size: 16px; }.equipment-cards article > b { color: #72d9b4; font-size: 16px; }.equipment-cards article.tone-warning > b { color: #e8bc59; }.equipment-cards article.tone-danger > b { color: #ef7182; }.drawer-activity { display: grid; grid-template-columns: 8px 1fr; gap: 12px; padding: 14px; }.drawer-activity strong { font-size: 18px; }.drawer-empty { padding: 22px 0; color: #8492a8; font-size: 18px; text-align: center; }.drawer-activity p { margin: 6px 0; color: #9aa8bd; font-size: 16px; }.drawer-activity small { color: #7f8ea6; font-size: 16px; }
@media (max-width: 1450px) { .overview-workspace { grid-template-columns: 240px minmax(430px,1fr) 240px; } }
/* 自适应：中等尺寸屏压缩边栏、指标与底条。 */
@media (max-width: 1640px) and (min-width: 1500px) {
  .overview-workspace { grid-template-columns: 250px minmax(0,1fr) 250px; }
  .metric-block { padding: 12px 14px 14px; }
  .metric-block > span { font-size: 16px; }
  .metric-block strong { font-size: 28px; }
  .metric-block p { font-size: 13px; }
  .demo-overview { grid-template-rows: minmax(86px, auto) minmax(0,1fr) 160px; }
}
/* 自适应：中等尺寸屏（≥1280 宽）压缩字号/间距满屏显示，不出现滚动条；仅窄屏或极矮屏才整页滚动。 */
@media (min-width: 1280px) and (max-height: 819px) {
  .demo-overview { grid-template-rows: 58px minmax(0, 1fr) 138px; gap: 8px; }
  .metric-block { min-height: 58px; padding: 8px 12px; }
  .metric-block > span { font-size: 14px; line-height: 1.1; }
  .metric-block strong { font-size: 22px; margin-top: 3px; line-height: 1; }
  .metric-block strong small { font-size: 13px; }
  .metric-block p { font-size: 12px; margin-top: 2px; line-height: 1.1; }
  .overview-workspace { grid-template-columns: 240px minmax(0, 1fr) 240px; gap: 8px; }
  .ops-panel > header { height: 40px; }
  .ranking-panel { grid-template-rows: 40px minmax(0, 1fr); }
  .bottom-strip { gap: 8px; }
  .bottom-strip .ops-panel > header { height: 34px; }
  .security-list > .security-item { min-height: 30px; padding: 1px 4px; gap: 5px; }
  .security-list strong { font-size: 11px; }
  .security-list small { font-size: 9px; }
  .security-list time { font-size: 11px; }
  .signing-content { padding: 4px 10px 6px; grid-template-rows: 26px minmax(0, 1fr); }
  .signing-stats > span { padding: 5px 6px 1px; }
  .signing-stats strong { font-size: 14px; }
  .business-grid { padding: 5px 10px; }
  .business-grid small { font-size: 12px; }
  .business-grid strong { font-size: 14px; }
  .activity-list > div { padding: 3px 0; }
  .activity-list strong { font-size: 13px; }
  .activity-list small { font-size: 11px; }
  .region-status-row { min-height: 40px; padding: 4px 12px; }
}
@media (max-width: 1279px), (max-height: 719px) {
  .demo-overview {
    height: auto;
    min-height: 0;
    grid-template-rows: auto minmax(540px, auto) auto;
    overflow: visible;
  }
  .overview-workspace { min-height: 540px; }
  .bottom-strip { height: 186px; }
}
@media (max-width: 1100px) { .demo-overview { height: auto; grid-template-rows: auto auto auto; }.overview-workspace { grid-template-columns: 1fr 1.7fr; }.right-column { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; grid-template-rows: 320px; }.metric-strip { grid-template-columns: repeat(2,1fr); }.metric-block:nth-child(2) { border-right: 0; }.bottom-strip { height: auto; grid-template-columns: repeat(2,minmax(0,1fr)); grid-auto-rows: 186px; }.signing-panel { grid-column: 1 / -1; } }
@media (max-width: 760px) { .demo-heading { align-items: flex-start; }.heading-status span { display: none; }.metric-strip,.overview-workspace { grid-template-columns: 1fr; }.metric-block { border-right: 0; border-bottom: 1px solid #28344a; }.left-column,.right-column { grid-column: auto; grid-template-columns: 1fr; grid-template-rows: auto; }.center-column { grid-template-rows: 440px; }.bottom-strip { grid-template-columns: 1fr; }.signing-panel { grid-column: auto; }.map-legend,.link-values { display: none; } }

/* 可下钻面板：悬停提示可进入业务态势明细。 */
.drill-panel { cursor: pointer; transition: border-color .18s ease, box-shadow .18s ease; }.drill-panel:hover { border-color: #3d5d8a; box-shadow: inset 0 0 24px rgba(90,149,255,.08); }.drill-panel header > b { color: #7fb0ff; }

/* Charts shrink with their panel instead of forcing 240px min-height. */
.map-body :deep(.chart-shell), .map-body :deep(.chart-box), .system-traffic-chart :deep(.chart-shell), .system-traffic-chart :deep(.chart-box), .ranking-chart :deep(.chart-shell), .ranking-chart :deep(.chart-box) { min-height: 0; height: 100%; }

/* Dashboard body text follows one readable baseline across all panels. */
.ops-panel > header { height: 52px; }.map-panel { grid-template-rows: 52px minmax(0, 1fr); }
.activity-list strong, .activity-list small { font-size: 14px; }
.region-status-row { min-height: 48px; }
</style>
