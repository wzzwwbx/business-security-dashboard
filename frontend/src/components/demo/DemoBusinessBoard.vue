<script setup lang="ts">
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import { demoSituationScenario, demoTotals } from '@/mocks/demoSituation';
import { computed, ref } from 'vue';

type Topic = 'message' | 'signing' | 'link';

const activeTopic = ref<Topic>('message');

const topics: Array<{ id: Topic; label: string; short: string }> = [
  { id: 'message', label: '密信态势', short: '消息与文件收发' },
  { id: 'signing', label: '签阅态势', short: '文件流转与处理' },
  { id: 'link', label: '境外通联', short: '50 Mbps 共享链路' }
];

const generatedTime = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(demoSituationScenario.generatedAt));
const countryNames = demoSituationScenario.regions.map((region) => region.countryCode === 'CN' ? '北京' : region.countryName);

const topMetrics = computed(() => {
  if (activeTopic.value === 'message') return [
    { label: '当前登录用户', value: demoTotals.messageLoggedIn, unit: '人', note: '配发人员 20 人', tone: 'success' },
    { label: '今日登录 / 登出', value: `${demoTotals.message.login} / ${demoTotals.message.logout}`, unit: '次', note: '当前会话口径闭合', tone: 'info' },
    { label: '消息发送 / 接收', value: `${demoTotals.message.sentMessages} / ${demoTotals.message.receivedMessages}`, unit: '条', note: '今日累计', tone: 'info' },
    { label: '文件发送 / 接收', value: `${demoTotals.message.sentFiles} / ${demoTotals.message.receivedFiles}`, unit: '份', note: '今日累计', tone: 'warning' }
  ];
  if (activeTopic.value === 'signing') return [
    { label: '收到文件', value: demoTotals.signing.received, unit: '份', note: '今日进入签阅流程', tone: 'info' },
    { label: '已处理', value: demoTotals.signing.processed, unit: '份', note: '完成率 79.4%', tone: 'success' },
    { label: '待处理', value: demoTotals.signing.pending, unit: '份', note: '分布于 5 个区域', tone: 'warning' },
    { label: '异常 / 退回', value: demoTotals.signing.exception, unit: '份', note: '需人工复核', tone: 'danger' }
  ];
  return [
    { label: '共享链路容量', value: demoSituationScenario.link.capacityMbps, unit: 'Mbps', note: '境外通信双向链路', tone: 'info' },
    { label: '当前上行 / 下行', value: `${demoSituationScenario.link.uplinkMbps} / ${demoSituationScenario.link.downlinkMbps}`, unit: 'Mbps', note: '当前采样值', tone: 'success' },
    { label: '当前利用率', value: demoSituationScenario.link.utilization.toFixed(1), unit: '%', note: '告警线 80%', tone: 'success' },
    { label: '今日累计流量', value: demoSituationScenario.link.trafficGb.toFixed(1), unit: 'GB', note: '峰值利用率 77.4%', tone: 'warning' }
  ];
});

const sideMetrics = computed(() => {
  if (activeTopic.value === 'message') return [
    ['密信软件可用', `${demoTotals.messageAvailable}/20`], ['当前登录', `${demoTotals.messageLoggedIn} 人`], ['登录事件', `${demoTotals.message.login} 次`], ['登出事件', `${demoTotals.message.logout} 次`], ['消息总量', `${demoTotals.message.sentMessages + demoTotals.message.receivedMessages} 条`], ['文件总量', `${demoTotals.message.sentFiles + demoTotals.message.receivedFiles} 份`]
  ];
  if (activeTopic.value === 'signing') return [
    ['签阅软件可用', `${demoTotals.signingAvailable}/20`], ['收到文件', `${demoTotals.signing.received} 份`], ['已处理', `${demoTotals.signing.processed} 份`], ['待处理', `${demoTotals.signing.pending} 份`], ['异常退回', `${demoTotals.signing.exception} 份`], ['处理完成率', '79.4%']
  ];
  return [
    ['链路容量', '50 Mbps'], ['当前上行', '12.8 Mbps'], ['当前下行', '18.6 Mbps'], ['当前利用率', '37.2%'], ['今日峰值', '38.7 Mbps'], ['今日累计', '11.5 GB']
  ];
});

const statusOption = computed(() => {
  if (activeTopic.value === 'link') return {
    series: [{ type: 'gauge', min: 0, max: 100, startAngle: 210, endAngle: -30, radius: '88%', center: ['50%', '58%'], progress: { show: true, width: 12, itemStyle: { color: '#5a95ff' } }, axisLine: { lineStyle: { width: 12, color: [[.8, '#26344b'], [1, '#66404a']] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { distance: -34, color: '#6f7d92', fontSize: 9 }, pointer: { width: 3, length: '54%' }, anchor: { show: true, size: 7 }, detail: { formatter: '{value}%', color: '#e9eef7', fontSize: 22, offsetCenter: [0, '65%'] }, title: { offsetCenter: [0, '88%'], color: '#77859a', fontSize: 10 }, data: [{ value: demoSituationScenario.link.utilization, name: '当前利用率' }] }]
  };
  const data = activeTopic.value === 'message'
    ? [{ name: '当前登录', value: 15, itemStyle: { color: '#43d7a2' } }, { name: '未登录', value: 5, itemStyle: { color: '#334158' } }]
    : [{ name: '已处理', value: 54, itemStyle: { color: '#43d7a2' } }, { name: '待处理', value: 11, itemStyle: { color: '#e9b949' } }, { name: '异常退回', value: 3, itemStyle: { color: '#ef6579' } }];
  return {
    tooltip: { trigger: 'item' },
    title: { text: activeTopic.value === 'message' ? '15/20' : '79.4%', subtext: activeTopic.value === 'message' ? '当前登录' : '处理完成率', left: 'center', top: '35%', textStyle: { color: '#e9eef7', fontSize: 21 }, subtextStyle: { color: '#748197', fontSize: 10 } },
    series: [{ type: 'pie', radius: ['61%', '80%'], center: ['50%', '46%'], label: { show: false }, itemStyle: { borderColor: '#111827', borderWidth: 3 }, data }]
  };
});

const mainChartOption = computed(() => {
  const common = {
    tooltip: { trigger: 'axis' },
    legend: { top: 4, right: 12, textStyle: { color: '#8592a7', fontSize: 10 } },
    grid: { left: 42, right: 20, top: 38, bottom: 28 },
    xAxis: { type: 'category', boundaryGap: false, data: activeTopic.value === 'link' ? demoSituationScenario.link.times : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '当前'], axisLabel: { color: '#748198', fontSize: 9 }, axisLine: { lineStyle: { color: '#303d53' } } },
    yAxis: { type: 'value', axisLabel: { color: '#748198', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(110,130,160,.13)' } } }
  };
  if (activeTopic.value === 'message') return { ...common, series: [
    { name: '发送消息', type: 'line', smooth: true, data: [6, 9, 17, 24, 31, 26, 13], symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#5a95ff' }, areaStyle: { color: 'rgba(90,149,255,.11)' } },
    { name: '接收消息', type: 'line', smooth: true, data: [8, 11, 19, 27, 34, 29, 14], symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#43d7a2' }, areaStyle: { color: 'rgba(67,215,162,.08)' } },
    { name: '收发文件', type: 'bar', barMaxWidth: 13, data: [3, 5, 9, 14, 20, 18, 13], itemStyle: { color: '#d3a84d' } }
  ] };
  if (activeTopic.value === 'signing') return { ...common, series: [
    { name: '收到文件', type: 'bar', stack: 'sign', barMaxWidth: 17, data: [3, 5, 8, 13, 16, 14, 9], itemStyle: { color: '#5a95ff' } },
    { name: '已处理', type: 'bar', stack: 'done', barMaxWidth: 17, data: [2, 4, 7, 10, 13, 11, 7], itemStyle: { color: '#43d7a2' } },
    { name: '待处理', type: 'line', smooth: true, data: [1, 2, 4, 6, 9, 12, 11], lineStyle: { width: 2, color: '#e9b949' }, symbolSize: 5 }
  ] };
  return { ...common, yAxis: { ...common.yAxis, min: 0, max: 50 }, series: [
    { name: '上行 Mbps', type: 'line', smooth: true, data: demoSituationScenario.link.uplinkTrend, lineStyle: { width: 2, color: '#5a95ff' }, areaStyle: { color: 'rgba(90,149,255,.12)' }, symbolSize: 5 },
    { name: '下行 Mbps', type: 'line', smooth: true, data: demoSituationScenario.link.downlinkTrend, lineStyle: { width: 2, color: '#43d7a2' }, areaStyle: { color: 'rgba(67,215,162,.10)' }, symbolSize: 5, markLine: { symbol: 'none', label: { formatter: '80% 告警线', color: '#e9b949', fontSize: 9 }, lineStyle: { color: '#e9b949', type: 'dashed' }, data: [{ yAxis: 40 }] } }
  ] };
});

const regionChartOption = computed(() => {
  let series: Array<{ name: string; data: number[]; color: string }>;
  if (activeTopic.value === 'message') series = [
    { name: '消息收发', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.message.sentMessages + person.message.receivedMessages, 0)), color: '#5a95ff' },
    { name: '文件收发', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.message.sentFiles + person.message.receivedFiles, 0)), color: '#43d7a2' }
  ];
  else if (activeTopic.value === 'signing') series = [
    { name: '已处理', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.signing.processed, 0)), color: '#43d7a2' },
    { name: '待处理', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.signing.pending, 0)), color: '#e9b949' }
  ];
  else series = [
    { name: '今日流量 GB', data: demoSituationScenario.regions.map((region) => region.trafficGb), color: '#5a95ff' }
  ];
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 2, right: 8, textStyle: { color: '#8592a7', fontSize: 9 } },
    grid: { left: 38, right: 16, top: 30, bottom: 25 },
    xAxis: { type: 'category', data: countryNames, axisLabel: { color: '#748198', fontSize: 9 }, axisLine: { lineStyle: { color: '#303d53' } } },
    yAxis: { type: 'value', axisLabel: { color: '#748198', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(110,130,160,.13)' } } },
    series: series.map((item) => ({ name: item.name, type: 'bar', barMaxWidth: 18, data: item.data, itemStyle: { color: item.color } }))
  };
});

const regionRows = computed(() => demoSituationScenario.regions.map((region) => {
  if (activeTopic.value === 'message') return { name: region.countryCode === 'CN' ? '北京' : region.countryName, primary: `${region.people.filter((person) => person.online).length}/${region.people.length} 登录`, secondary: `${region.people.reduce((sum, person) => sum + person.message.sentMessages + person.message.receivedMessages, 0)} 条消息`, tone: region.people.some((person) => person.suiteStatus === 'offline') ? 'danger' : 'success' };
  if (activeTopic.value === 'signing') return { name: region.countryCode === 'CN' ? '北京' : region.countryName, primary: `${region.people.reduce((sum, person) => sum + person.signing.processed, 0)} 份已处理`, secondary: `${region.people.reduce((sum, person) => sum + person.signing.pending, 0)} 份待处理`, tone: region.people.reduce((sum, person) => sum + person.signing.exception, 0) > 0 ? 'warning' : 'success' };
  return { name: region.countryCode === 'CN' ? '北京中心' : region.countryName, primary: region.countryCode === 'CN' ? '汇聚节点' : `${region.trafficGb.toFixed(1)} GB`, secondary: region.countryCode === 'CN' ? '共享链路出口' : `↓ ${region.downlinkMbps.toFixed(1)} / ↑ ${region.uplinkMbps.toFixed(1)} Mbps`, tone: region.downlinkMbps >= 5 ? 'warning' : 'success' };
}));

const eventRows = computed(() => demoSituationScenario.people.flatMap((person) => person.activities.map((activity) => ({ ...activity, person }))).sort((a, b) => a.minutesAgo - b.minutesAgo).filter((item) => activeTopic.value === 'message' ? ['login', 'logout', 'message', 'file'].includes(item.type) : activeTopic.value === 'signing' ? item.type === 'signing' : true).slice(0, 5));

const topicTitle = computed(() => activeTopic.value === 'message' ? '密信分时业务趋势' : activeTopic.value === 'signing' ? '签阅文件处理趋势' : '境外链路速率趋势');
const regionTitle = computed(() => activeTopic.value === 'message' ? '各区域密信业务量' : activeTopic.value === 'signing' ? '各区域签阅处理量' : '各区域今日通信流量');
</script>

<template>
  <div class="demo-business">
    <header class="demo-heading">
      <div><span>BUSINESS OPERATIONS</span><h1>密信、签阅与境外通联态势</h1></div>
      <div class="heading-status"><i />模拟数据 <span>更新时间 {{ generatedTime }}</span></div>
    </header>

    <nav class="topic-switch" aria-label="业务专题">
      <button v-for="topic in topics" :key="topic.id" type="button" :class="{ active: activeTopic === topic.id }" @click="activeTopic = topic.id"><strong>{{ topic.label }}</strong><span>{{ topic.short }}</span></button>
    </nav>

    <section class="metric-strip">
      <article v-for="metric in topMetrics" :key="metric.label" :class="`tone-${metric.tone}`"><span>{{ metric.label }}</span><strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong><p>{{ metric.note }}</p></article>
    </section>

    <section class="business-workspace">
      <aside class="business-column left-column">
        <article class="ops-panel status-panel"><header><div><span>专题状态</span><small>{{ topics.find((item) => item.id === activeTopic)?.short }}</small></div></header><div class="status-chart"><EChartWidget :option="statusOption" /></div></article>
        <article class="ops-panel facts-panel"><header><div><span>关键运行指标</span><small>今日累计口径</small></div></header><div class="fact-list"><div v-for="item in sideMetrics" :key="item[0]"><span>{{ item[0] }}</span><strong>{{ item[1] }}</strong></div></div></article>
      </aside>

      <main class="business-column center-column">
        <article class="ops-panel chart-panel"><header><div><span>{{ topicTitle }}</span><small>00:00 至当前</small></div><b v-if="activeTopic === 'link'">告警线 40 Mbps</b></header><div><EChartWidget :option="mainChartOption" /></div></article>
        <article class="ops-panel chart-panel region-chart-panel"><header><div><span>{{ regionTitle }}</span><small>北京及 5 个境外保障区域</small></div></header><div><EChartWidget :option="regionChartOption" /></div></article>
      </main>

      <aside class="business-column right-column">
        <article class="ops-panel region-status-panel"><header><div><span>区域运行状态</span><small>COUNTRY STATUS</small></div></header><div class="region-rows"><div v-for="row in regionRows" :key="row.name"><i :class="`tone-${row.tone}`" /><span><strong>{{ row.name }}</strong><small>{{ row.secondary }}</small></span><b>{{ row.primary }}</b></div></div></article>
        <article class="ops-panel event-panel"><header><div><span>最近业务活动</span><small>ACTIVITY FEED</small></div></header><div class="event-rows"><div v-for="event in eventRows" :key="event.id"><time>{{ event.minutesAgo }} 分钟前</time><span><strong>{{ event.person.name }} · {{ event.title }}</strong><small>{{ event.detail }}</small></span></div><div v-if="!eventRows.length" class="empty-events">当前专题无新增异常事件</div></div></article>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.demo-business { height: calc(100vh - 106px); min-height: 620px; display: grid; grid-template-rows: auto auto auto minmax(0,1fr); gap: 10px; color: #e7ebf5; }
.demo-heading { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }.demo-heading > div:first-child > span { color: #6e8db5; font: 10px var(--font-family-mono, monospace); }.demo-heading h1 { margin: 3px 0 0; font-size: 22px; letter-spacing: 0; }.heading-status { display: flex; align-items: center; gap: 7px; color: #7edbb7; font-size: 11px; }.heading-status i { width: 7px; height: 7px; border-radius: 50%; background: #43d7a2; box-shadow: 0 0 9px rgba(67,215,162,.6); }.heading-status span { margin-left: 8px; color: #7f8ba0; }
.topic-switch { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); border: 1px solid #28344a; background: #111827; }.topic-switch button { min-height: 48px; display: flex; align-items: baseline; justify-content: center; gap: 9px; border: 0; border-right: 1px solid #28344a; color: #7e8a9e; background: transparent; cursor: pointer; }.topic-switch button:last-child { border-right: 0; }.topic-switch button.active { color: #dce6f5; background: #19243a; box-shadow: inset 0 -2px #6d9bea; }.topic-switch strong { font-size: 12px; }.topic-switch span { font-size: 9px; }
.metric-strip { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); border: 1px solid #28344a; background: #111827; }.metric-strip article { min-height: 78px; padding: 11px 15px; border-right: 1px solid #28344a; }.metric-strip article:last-child { border-right: 0; }.metric-strip span { color: #8e99aa; font-size: 10px; }.metric-strip strong { display: block; margin-top: 3px; color: #e8edf6; font: 600 22px var(--font-family-mono, monospace); }.metric-strip small { margin-left: 4px; color: #7d899c; font-size: 10px; }.metric-strip p { margin: 2px 0 0; color: #647188; font-size: 9px; }.metric-strip .tone-success strong { color: #72deb9; }.metric-strip .tone-info strong { color: #85aefd; }.metric-strip .tone-warning strong { color: #edc66b; }.metric-strip .tone-danger strong { color: #f17a89; }
.business-workspace { min-height: 0; display: grid; grid-template-columns: minmax(220px,250px) minmax(500px,1fr) minmax(270px,300px); gap: 10px; }.business-column { min-height: 0; display: grid; gap: 10px; }.left-column { grid-template-rows: 1fr 1fr; }.center-column { grid-template-rows: 1.55fr 1fr; }.right-column { grid-template-rows: 1.08fr .92fr; }
.ops-panel { min-width: 0; min-height: 0; overflow: hidden; border: 1px solid #28344a; background: #111827; }.ops-panel > header { height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 0 13px; border-bottom: 1px solid #263147; }.ops-panel header span { display: block; color: #dfe5ef; font-size: 11px; font-weight: 600; }.ops-panel header small { display: block; margin-top: 2px; color: #64728a; font-size: 9px; }.ops-panel header > b { color: #d6ad51; font-size: 9px; }.status-panel,.chart-panel { display: grid; grid-template-rows: 46px minmax(0,1fr); }.status-chart { min-height: 0; }
.fact-list { display: grid; grid-template-columns: repeat(2,1fr); }.fact-list div { min-height: 64px; padding: 11px 12px; border-right: 1px solid #243047; border-bottom: 1px solid #243047; }.fact-list div:nth-child(2n) { border-right: 0; }.fact-list span,.fact-list strong { display: block; }.fact-list span { color: #708097; font-size: 9px; }.fact-list strong { margin-top: 6px; color: #d8e0eb; font: 600 13px var(--font-family-mono, monospace); }
.region-rows > div { min-height: 52px; display: grid; grid-template-columns: 6px 1fr auto; align-items: center; gap: 8px; padding: 7px 12px; border-bottom: 1px solid #222d41; }.region-rows i { width: 6px; height: 6px; border-radius: 50%; background: #43d7a2; }.region-rows i.tone-warning { background: #e9b949; }.region-rows i.tone-danger { background: #ef6579; }.region-rows strong,.region-rows small { display: block; }.region-rows strong { color: #cfd7e3; font-size: 10px; }.region-rows small { margin-top: 3px; color: #68768c; font-size: 8px; }.region-rows b { color: #9cabc0; font: 600 9px var(--font-family-mono, monospace); white-space: nowrap; }
.event-rows { padding: 2px 12px; }.event-rows > div:not(.empty-events) { display: grid; grid-template-columns: 58px 1fr; gap: 8px; padding: 9px 0; border-bottom: 1px solid #222d41; }.event-rows time { color: #627087; font: 8px var(--font-family-mono, monospace); }.event-rows strong,.event-rows small { display: block; }.event-rows strong { overflow: hidden; color: #bbc6d5; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.event-rows small { overflow: hidden; margin-top: 3px; color: #6d7a90; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }.empty-events { padding: 18px 0; color: #718097; font-size: 10px; text-align: center; }
@media (max-width: 1300px) { .business-workspace { grid-template-columns: 220px minmax(430px,1fr) 260px; } }
@media (max-height: 820px) and (min-width: 1051px) { .demo-heading { min-height: 38px; }.demo-heading h1 { font-size: 19px; }.topic-switch button { min-height: 40px; }.metric-strip article { min-height: 68px; padding: 8px 15px; }.metric-strip strong { font-size: 19px; }.left-column { grid-template-rows: .92fr 1.08fr; }.center-column { grid-template-rows: 1.35fr 1fr; }.right-column { grid-template-rows: 1.35fr .65fr; }.ops-panel > header { height: 38px; }.status-panel,.chart-panel { grid-template-rows: 38px minmax(0,1fr); }.fact-list div { min-height: 48px; padding: 7px 10px; }.region-rows > div { min-height: 42px; padding: 5px 10px; }.event-rows > div:not(.empty-events) { padding: 6px 0; } }
@media (max-width: 1050px) { .demo-business { height: auto; grid-template-rows: auto auto auto auto; }.business-workspace { grid-template-columns: 1fr 1.8fr; }.right-column { grid-column: 1/-1; grid-template-columns: 1fr 1fr; grid-template-rows: 330px; }.metric-strip { grid-template-columns: repeat(2,1fr); }.metric-strip article:nth-child(2) { border-right: 0; } }
@media (max-width: 720px) { .heading-status span,.topic-switch span { display: none; }.topic-switch button { min-height: 42px; }.metric-strip,.business-workspace { grid-template-columns: 1fr; }.metric-strip article { border-right: 0; border-bottom: 1px solid #28344a; }.left-column,.right-column { grid-column: auto; grid-template-columns: 1fr; grid-template-rows: auto; }.center-column { grid-template-rows: 360px 280px; } }
</style>
