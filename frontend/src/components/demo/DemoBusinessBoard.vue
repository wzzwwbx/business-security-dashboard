<script setup lang="ts">
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import { demoSituationScenario, demoTotals } from '@/mocks/demoSituation';
import { computed, ref } from 'vue';

type Topic = 'message' | 'signing';

const activeTopic = ref<Topic>('message');

const topics: Array<{ id: Topic; label: string; short: string }> = [
  { id: 'message', label: '密信态势', short: '消息与文件收发' },
  { id: 'signing', label: '签阅态势', short: '文件流转与处理' }
];

const countryNames = demoSituationScenario.regions.map((region) => region.countryCode === 'CN' ? '北京' : region.countryName);

const topMetrics = computed(() => {
  if (activeTopic.value === 'message') return [
    { label: '当前登录用户', value: demoTotals.messageLoggedIn, unit: '人', note: `配发人员 ${demoTotals.assignedPeople} 人`, tone: 'success' },
    { label: '今日登录 / 登出', value: `${demoTotals.message.login} / ${demoTotals.message.logout}`, unit: '次', note: '当前会话口径闭合', tone: 'info' },
    { label: '消息发送 / 接收', value: `${demoTotals.message.sentMessages} / ${demoTotals.message.receivedMessages}`, unit: '条', note: '今日累计', tone: 'info' },
    { label: '文件发送 / 接收', value: `${demoTotals.message.sentFiles} / ${demoTotals.message.receivedFiles}`, unit: '份', note: '今日累计', tone: 'warning' }
  ];
  return [
    { label: '收到文件', value: demoTotals.signing.received, unit: '份', note: '今日进入签阅流程', tone: 'info' },
    { label: '已处理', value: demoTotals.signing.processed, unit: '份', note: '完成率 79.4%', tone: 'success' },
    { label: '待处理', value: demoTotals.signing.pending, unit: '份', note: '分布于 8 个区域', tone: 'warning' },
    { label: '异常 / 退回', value: demoTotals.signing.exception, unit: '份', note: '需人工复核', tone: 'danger' }
  ];
});

const sideMetrics = computed(() => {
  if (activeTopic.value === 'message') return [
    ['密信软件可用', `${demoTotals.messageAvailable}/${demoTotals.assignedPeople}`], ['当前登录', `${demoTotals.messageLoggedIn} 人`], ['登录事件', `${demoTotals.message.login} 次`], ['登出事件', `${demoTotals.message.logout} 次`], ['消息总量', `${demoTotals.message.sentMessages + demoTotals.message.receivedMessages} 条`], ['文件总量', `${demoTotals.message.sentFiles + demoTotals.message.receivedFiles} 份`]
  ];
  return [
    ['签阅软件可用', `${demoTotals.signingAvailable}/${demoTotals.assignedPeople}`], ['收到文件', `${demoTotals.signing.received} 份`], ['已处理', `${demoTotals.signing.processed} 份`], ['待处理', `${demoTotals.signing.pending} 份`], ['异常退回', `${demoTotals.signing.exception} 份`], ['处理完成率', '79.4%']
  ];
});

const statusOption = computed(() => {
  const data = activeTopic.value === 'message'
    ? [{ name: '当前登录', value: demoTotals.messageLoggedIn, itemStyle: { color: '#43d7a2' } }, { name: '未登录', value: demoTotals.assignedPeople - demoTotals.messageLoggedIn, itemStyle: { color: '#334158' } }]
    : [{ name: '已处理', value: 54, itemStyle: { color: '#43d7a2' } }, { name: '待处理', value: 11, itemStyle: { color: '#e9b949' } }, { name: '异常退回', value: 3, itemStyle: { color: '#ef6579' } }];
  return {
    tooltip: { trigger: 'item' },
    title: { text: activeTopic.value === 'message' ? `${demoTotals.messageLoggedIn}/${demoTotals.assignedPeople}` : '79.4%', subtext: activeTopic.value === 'message' ? '当前登录' : '处理完成率', left: 'center', top: '35%', textStyle: { color: '#e9eef7', fontSize: 24 }, subtextStyle: { color: '#748197', fontSize: 14 } },
    series: [{ type: 'pie', radius: ['61%', '80%'], center: ['50%', '46%'], label: { show: false }, itemStyle: { borderColor: '#111827', borderWidth: 3 }, data }]
  };
});

const mainChartOption = computed(() => {
  const common = {
    tooltip: { trigger: 'axis' },
    legend: { top: 4, right: 12, textStyle: { color: '#8592a7', fontSize: 14 } },
    grid: { left: 46, right: 20, top: 44, bottom: 34 },
    xAxis: { type: 'category', boundaryGap: false, data: demoSituationScenario.businessTrend.times, axisLabel: { color: '#748198', fontSize: 14 }, axisLine: { lineStyle: { color: '#303d53' } } },
    yAxis: { type: 'value', axisLabel: { color: '#748198', fontSize: 14 }, splitLine: { lineStyle: { color: 'rgba(110,130,160,.13)' } } }
  };
  const trend = demoSituationScenario.businessTrend;
  if (activeTopic.value === 'message') return { ...common, series: [
    { name: '发送消息', type: 'line', smooth: true, data: trend.messageSent, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#5a95ff' }, areaStyle: { color: 'rgba(90,149,255,.11)' } },
    { name: '接收消息', type: 'line', smooth: true, data: trend.messageReceived, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#43d7a2' }, areaStyle: { color: 'rgba(67,215,162,.08)' } },
    { name: '收发文件', type: 'bar', barMaxWidth: 13, data: trend.fileCount, itemStyle: { color: '#d3a84d' } }
  ] };
  return { ...common, series: [
    { name: '收到文件', type: 'bar', stack: 'sign', barMaxWidth: 17, data: trend.signingReceived, itemStyle: { color: '#5a95ff' } },
    { name: '已处理', type: 'bar', stack: 'done', barMaxWidth: 17, data: trend.signingProcessed, itemStyle: { color: '#43d7a2' } },
    { name: '待处理', type: 'line', smooth: true, data: trend.signingPending, lineStyle: { width: 2, color: '#e9b949' }, symbolSize: 5 }
  ] };
});

const regionChartOption = computed(() => {
  let series: Array<{ name: string; data: number[]; color: string }>;
  if (activeTopic.value === 'message') series = [
    { name: '消息收发', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.message.sentMessages + person.message.receivedMessages, 0)), color: '#5a95ff' },
    { name: '文件收发', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.message.sentFiles + person.message.receivedFiles, 0)), color: '#43d7a2' }
  ];
  else series = [
    { name: '已处理', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.signing.processed, 0)), color: '#43d7a2' },
    { name: '待处理', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.signing.pending, 0)), color: '#e9b949' }
  ];
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 2, right: 8, textStyle: { color: '#8592a7', fontSize: 14 } },
    grid: { left: 44, right: 16, top: 40, bottom: 36 },
    xAxis: { type: 'category', data: countryNames, axisLabel: { color: '#748198', fontSize: 14, interval: 0 }, axisLine: { lineStyle: { color: '#303d53' } } },
    yAxis: { type: 'value', axisLabel: { color: '#748198', fontSize: 14 }, splitLine: { lineStyle: { color: 'rgba(110,130,160,.13)' } } },
    series: series.map((item) => ({ name: item.name, type: 'bar', barMaxWidth: 18, data: item.data, itemStyle: { color: item.color } }))
  };
});

const regionRows = computed(() => demoSituationScenario.regions.map((region) => {
  if (activeTopic.value === 'message') return { name: region.countryCode === 'CN' ? '北京' : region.countryName, primary: `${region.people.filter((person) => person.online).length}/${region.people.length} 登录`, secondary: `${region.people.reduce((sum, person) => sum + person.message.sentMessages + person.message.receivedMessages, 0)} 条消息`, tone: region.people.some((person) => person.suiteStatus === 'offline') ? 'danger' : 'success' };
  return { name: region.countryCode === 'CN' ? '北京' : region.countryName, primary: `${region.people.reduce((sum, person) => sum + person.signing.processed, 0)} 份已处理`, secondary: `${region.people.reduce((sum, person) => sum + person.signing.pending, 0)} 份待处理`, tone: region.people.reduce((sum, person) => sum + person.signing.exception, 0) > 0 ? 'warning' : 'success' };
}));

const eventRows = computed(() => demoSituationScenario.people.flatMap((person) => person.activities.map((activity) => ({ ...activity, person }))).sort((a, b) => a.minutesAgo - b.minutesAgo).filter((item) => activeTopic.value === 'message' ? ['login', 'logout', 'message', 'file'].includes(item.type) : item.type === 'signing').slice(0, 5));

const topicTitle = computed(() => activeTopic.value === 'message' ? '密信分时业务趋势' : '签阅文件处理趋势');
const regionTitle = computed(() => activeTopic.value === 'message' ? '各区域密信业务量' : '各区域签阅处理量');
const statusTitle = computed(() => activeTopic.value === 'message' ? '当前登录状态' : '签阅处理状态');

function relativeTime(minutes: number) {
  const value = Math.round(minutes);
  return value < 1 ? '最新' : `${value} 分钟前`;
}
</script>

<template>
  <div class="demo-business">
    <nav class="topic-switch" aria-label="业务专题">
      <button v-for="topic in topics" :key="topic.id" type="button" :class="{ active: activeTopic === topic.id }" @click="activeTopic = topic.id"><strong>{{ topic.label }}</strong><span>{{ topic.short }}</span></button>
    </nav>

    <section class="metric-strip">
      <article v-for="metric in topMetrics" :key="metric.label" :class="`tone-${metric.tone}`"><span>{{ metric.label }}</span><strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong><p>{{ metric.note }}</p></article>
    </section>

    <section class="business-workspace">
      <aside class="business-column left-column">
        <article class="ops-panel status-panel"><header><span>{{ statusTitle }}</span></header><div class="status-chart"><EChartWidget :option="statusOption" /></div></article>
        <article class="ops-panel facts-panel"><header><span>关键运行指标</span></header><div class="fact-list"><div v-for="item in sideMetrics" :key="item[0]"><span>{{ item[0] }}</span><strong>{{ item[1] }}</strong></div></div></article>
      </aside>

      <main class="business-column center-column">
        <article class="ops-panel chart-panel"><header><span>{{ topicTitle }}</span></header><div><EChartWidget :option="mainChartOption" /></div></article>
        <article class="ops-panel chart-panel region-chart-panel"><header><span>{{ regionTitle }}</span></header><div><EChartWidget :option="regionChartOption" /></div></article>
      </main>

      <aside class="business-column right-column">
        <article class="ops-panel region-status-panel"><header><span>区域运行状态</span></header><div class="region-rows"><div v-for="row in regionRows" :key="row.name"><i :class="`tone-${row.tone}`" /><span><strong>{{ row.name }}</strong><small>{{ row.secondary }}</small></span><b>{{ row.primary }}</b></div></div></article>
        <article class="ops-panel event-panel"><header><span>最近业务活动</span></header><div class="event-rows"><div v-for="event in eventRows" :key="event.id"><time>{{ relativeTime(event.minutesAgo) }}</time><span><strong>{{ event.person.name }} · {{ event.title }}</strong><small>{{ event.detail }}</small></span></div><div v-if="!eventRows.length" class="empty-events">当前专题无新增异常事件</div></div></article>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.demo-business { height: calc(100vh - 106px); min-height: 620px; display: grid; grid-template-rows: auto auto minmax(0,1fr); gap: 10px; color: #e7ebf5; }
.topic-switch { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); border: 1px solid #28344a; background: #111827; }.topic-switch button { min-height: 52px; display: flex; align-items: center; justify-content: center; gap: 9px; border: 0; border-right: 1px solid #28344a; color: #7e8a9e; background: transparent; cursor: pointer; }.topic-switch button:last-child { border-right: 0; }.topic-switch button.active { color: #dce6f5; background: #19243a; box-shadow: inset 0 -2px #6d9bea; }.topic-switch strong { font-size: 20px; }.topic-switch span { font-size: 16px; }
.metric-strip { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); border: 1px solid #28344a; background: #111827; }.metric-strip article { min-height: 104px; padding: 14px 18px; border-right: 1px solid #28344a; }.metric-strip article:last-child { border-right: 0; }.metric-strip span { color: #aab5c7; font-size: 20px; }.metric-strip strong { display: block; margin-top: 4px; color: #e8edf6; font: 600 36px var(--font-family-mono, monospace); }.metric-strip small { margin-left: 4px; color: #aab5c7; font-size: 18px; }.metric-strip p { margin: 4px 0 0; color: #8492a8; font-size: 16px; }.metric-strip .tone-success strong { color: #72deb9; }.metric-strip .tone-info strong { color: #85aefd; }.metric-strip .tone-warning strong { color: #edc66b; }.metric-strip .tone-danger strong { color: #f17a89; }
.business-workspace { min-height: 0; display: grid; grid-template-columns: minmax(220px,250px) minmax(500px,1fr) minmax(270px,300px); gap: 10px; }.business-column { min-height: 0; display: grid; gap: 10px; }.left-column { grid-template-rows: 1fr 1fr; }.center-column { grid-template-rows: 1.55fr 1fr; }.right-column { grid-template-rows: 1.08fr .92fr; }
.ops-panel { min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #28344a; background: #111827; }.ops-panel > header { flex: 0 0 auto; height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 13px; border-bottom: 1px solid #263147; }.ops-panel header span { display: block; color: #eef4ff; font-size: 16px; font-weight: 700; }.ops-panel header small { display: block; margin-top: 3px; color: #8493aa; font-size: 12px; }.ops-panel header > b { color: #ead07c; font-size: 12px; }.status-panel,.chart-panel { display: grid; grid-template-rows: 52px minmax(0,1fr); }.status-chart { min-height: 0; }.chart-panel > div { min-height: 0; }
.fact-list { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); overflow-y: auto; overflow-x: hidden; }.fact-list div { min-height: 64px; padding: 11px 12px; border-right: 1px solid #243047; border-bottom: 1px solid #243047; }.fact-list div:nth-child(2n) { border-right: 0; }.fact-list span,.fact-list strong { display: block; }.fact-list span { color: #8492a8; font-size: 12px; }.fact-list strong { margin-top: 6px; color: #d8e0eb; font: 600 14px var(--font-family-base); }
.region-rows { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; }.region-rows > div { min-height: 52px; display: grid; grid-template-columns: 7px minmax(0,1fr) auto; align-items: center; gap: 8px; padding: 7px 12px; border-bottom: 1px solid #222d41; }.region-rows i { width: 7px; height: 7px; border-radius: 50%; background: #43d7a2; }.region-rows i.tone-warning { background: #e9b949; }.region-rows i.tone-danger { background: #ef6579; }.region-rows strong,.region-rows small { display: block; }.region-rows strong { color: #cfd7e3; font-size: 12px; }.region-rows small { margin-top: 3px; color: #8492a8; font-size: 11px; }.region-rows b { color: #b4c0d2; font: 600 12px var(--font-family-base); white-space: nowrap; }
.event-rows { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 2px 12px; }.event-rows > div:not(.empty-events) { display: grid; grid-template-columns: 84px minmax(0,1fr); gap: 8px; padding: 9px 0; border-bottom: 1px solid #222d41; }.event-rows time { color: #8492a8; font: 11px var(--font-family-base); white-space: nowrap; }.event-rows strong,.event-rows small { display: block; }.event-rows strong { overflow: hidden; color: #cfd7e3; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }.event-rows small { overflow: hidden; margin-top: 3px; color: #8492a8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.empty-events { padding: 18px 0; color: #8492a8; font-size: 12px; text-align: center; }
@media (max-width: 1300px) { .business-workspace { grid-template-columns: 220px minmax(430px,1fr) 260px; } }
@media (max-height: 820px) and (min-width: 1051px) { .demo-heading { min-height: 38px; }.demo-heading h1 { font-size: 19px; }.topic-switch button { min-height: 40px; }.metric-strip article { min-height: 68px; padding: 8px 15px; }.metric-strip strong { font-size: 19px; }.left-column { grid-template-rows: .92fr 1.08fr; }.center-column { grid-template-rows: 1.35fr 1fr; }.right-column { grid-template-rows: 1.35fr .65fr; }.ops-panel > header { height: 38px; }.status-panel,.chart-panel { grid-template-rows: 38px minmax(0,1fr); }.fact-list div { min-height: 48px; padding: 7px 10px; }.region-rows > div { min-height: 42px; padding: 5px 10px; }.event-rows > div:not(.empty-events) { padding: 6px 0; } }
@media (max-width: 1050px) { .demo-business { height: auto; grid-template-rows: auto auto auto auto; }.business-workspace { grid-template-columns: 1fr 1.8fr; }.right-column { grid-column: 1/-1; grid-template-columns: 1fr 1fr; grid-template-rows: 330px; }.metric-strip { grid-template-columns: repeat(2,1fr); }.metric-strip article:nth-child(2) { border-right: 0; } }
@media (max-width: 720px) { .heading-status span,.topic-switch span { display: none; }.topic-switch button { min-height: 42px; }.metric-strip,.business-workspace { grid-template-columns: 1fr; }.metric-strip article { border-right: 0; border-bottom: 1px solid #28344a; }.left-column,.right-column { grid-column: auto; grid-template-columns: 1fr; grid-template-rows: auto; }.center-column { grid-template-rows: 360px 280px; } }

/* Charts shrink with their panel instead of forcing 240px min-height. */
.status-chart :deep(.chart-shell), .status-chart :deep(.chart-box), .chart-panel :deep(.chart-shell), .chart-panel :deep(.chart-box) { min-height: 0; height: 100%; }

/* Dashboard body text follows one readable baseline across all panels. */
.ops-panel > header { height: 52px; }.status-panel,.chart-panel { grid-template-rows: 52px minmax(0, 1fr); }
.ops-panel header span { font-size: 20px; }.ops-panel header > b,.fact-list span,.fact-list strong,.region-rows strong,.region-rows small,.region-rows b,.event-rows time,.event-rows strong,.event-rows small,.empty-events { font-size: 18px; }
.fact-list div { min-height: 82px; }.region-rows > div { min-height: 68px; }.event-rows > div:not(.empty-events) { grid-template-columns: 84px minmax(0,1fr); padding: 12px 0; }
</style>
