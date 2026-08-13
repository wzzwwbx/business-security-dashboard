<script setup lang="ts">
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import RouteTopologyPanel from '@/components/demo/RouteTopologyPanel.vue';
import { demoSituationScenario, demoTotals } from '@/mocks/demoSituation';
import { compactDepartmentName, messageRankingOption, topicRankingOption, type RankingMode } from '@/utils/rankingChart';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

type Topic = 'message' | 'signing' | 'traffic';

const route = useRoute();
const router = useRouter();

function resolveTopic(value: unknown): Topic {
  return value === 'signing' || value === 'traffic' ? value : 'message';
}

// 从综合态势下钻进入时，通过 query.topic 定位到对应专题。
const activeTopic = ref<Topic>(resolveTopic(route.query.topic));
watch(() => route.query.topic, (value) => { activeTopic.value = resolveTopic(value); });

const topics: Array<{ id: Topic; label: string; short: string }> = [
  { id: 'message', label: '密信态势', short: '消息与文件收发' },
  { id: 'signing', label: '签阅态势', short: '文件流转与处理' },
  { id: 'traffic', label: '系统流量', short: '各业务系统吞吐' }
];

const countryNames = demoSituationScenario.regions.map((region) => region.countryCode === 'CN' ? '北京' : region.countryName);

const systemTrafficSnapshot = computed(() => demoSituationScenario.systemTraffic.snapshot);
const totalThroughput = computed(() => systemTrafficSnapshot.value.reduce((sum, item) => sum + item.throughputMbps, 0));
const totalGb = computed(() => systemTrafficSnapshot.value.reduce((sum, item) => sum + item.trafficGb, 0));

const topMetrics = computed(() => {
  if (activeTopic.value === 'traffic') {
    const msg = systemTrafficSnapshot.value.find((item) => item.code === 'msg');
    const sign = systemTrafficSnapshot.value.find((item) => item.code === 'sign');
    return [
      { label: '系统总吞吐', value: totalThroughput.value.toFixed(1), unit: 'Mbps', note: `${systemTrafficSnapshot.value.length} 个业务系统合计`, tone: 'info' },
      { label: '今日总流量', value: totalGb.value.toFixed(1), unit: 'GB', note: '各业务系统今日累计', tone: 'success' },
      { label: '密信服务吞吐', value: (msg?.throughputMbps ?? 0).toFixed(1), unit: 'Mbps', note: `今日 ${(msg?.trafficGb ?? 0).toFixed(1)} GB`, tone: 'success' },
      { label: '签阅服务吞吐', value: (sign?.throughputMbps ?? 0).toFixed(1), unit: 'Mbps', note: `今日 ${(sign?.trafficGb ?? 0).toFixed(1)} GB`, tone: 'warning' }
    ];
  }
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
  if (activeTopic.value === 'traffic') return systemTrafficSnapshot.value.map((item) => [
    item.name, `${item.throughputMbps.toFixed(1)} Mbps`, item.tone
  ] as [string, string, string]);
  if (activeTopic.value === 'message') return [
    ['密信软件可用', `${demoTotals.messageAvailable}/${demoTotals.assignedPeople}`], ['当前登录', `${demoTotals.messageLoggedIn} 人`], ['登录事件', `${demoTotals.message.login} 次`], ['登出事件', `${demoTotals.message.logout} 次`], ['消息总量', `${demoTotals.message.sentMessages + demoTotals.message.receivedMessages} 条`], ['文件总量', `${demoTotals.message.sentFiles + demoTotals.message.receivedFiles} 份`]
  ];
  return [
    ['签阅软件可用', `${demoTotals.signingAvailable}/${demoTotals.assignedPeople}`], ['收到文件', `${demoTotals.signing.received} 份`], ['已处理', `${demoTotals.signing.processed} 份`], ['待处理', `${demoTotals.signing.pending} 份`], ['异常退回', `${demoTotals.signing.exception} 份`], ['处理完成率', '79.4%']
  ];
});

const statusOption = computed(() => {
  let data: Array<{ name: string; value: number; itemStyle: { color: string } }>;
  let centerText: string;
  let centerLabel: string;
  if (activeTopic.value === 'traffic') {
    const palette: Record<string, string> = { msg: '#5a95ff', sign: '#43d7a2', crypto: '#d3a84d' };
    data = systemTrafficSnapshot.value.map((item) => ({ name: item.name, value: Math.round(item.throughputMbps * 10) / 10, itemStyle: { color: palette[item.code] ?? '#5a95ff' } }));
    centerText = `${totalThroughput.value.toFixed(1)} Mbps`;
    centerLabel = '系统总吞吐';
  } else if (activeTopic.value === 'message') {
    data = [{ name: '当前登录', value: demoTotals.messageLoggedIn, itemStyle: { color: '#43d7a2' } }, { name: '未登录', value: demoTotals.assignedPeople - demoTotals.messageLoggedIn, itemStyle: { color: '#334158' } }];
    centerText = `${demoTotals.messageLoggedIn}/${demoTotals.assignedPeople}`;
    centerLabel = '当前登录';
  } else {
    data = [{ name: '已处理', value: 54, itemStyle: { color: '#43d7a2' } }, { name: '待处理', value: 11, itemStyle: { color: '#e9b949' } }, { name: '异常退回', value: 3, itemStyle: { color: '#ef6579' } }];
    centerText = '79.4%';
    centerLabel = '处理完成率';
  }
  return {
    tooltip: { trigger: 'item' },
    title: { text: centerText, subtext: centerLabel, left: 'center', top: '35%', textStyle: { color: '#e9eef7', fontSize: 24 }, subtextStyle: { color: '#748197', fontSize: 14 } },
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
  if (activeTopic.value === 'traffic') {
    const palette: Record<string, string> = { msg: '#5a95ff', sign: '#43d7a2', crypto: '#d3a84d' };
    const series = demoSituationScenario.systemTraffic.series.map((item) => ({
      name: item.name,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data: item.data,
      lineStyle: { width: 2, color: palette[item.code] ?? '#5a95ff' },
      itemStyle: { color: palette[item.code] ?? '#5a95ff' }
    }));
    return { ...common, xAxis: { ...common.xAxis, data: demoSituationScenario.systemTraffic.times }, series };
  }
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
  if (activeTopic.value === 'traffic') {
    series = [
      { name: '上行流量', data: demoSituationScenario.regions.map((region) => Math.round(region.uplinkMbps * 10) / 10), color: '#5a95ff' },
      { name: '下行流量', data: demoSituationScenario.regions.map((region) => Math.round(region.downlinkMbps * 10) / 10), color: '#43d7a2' }
    ];
  } else if (activeTopic.value === 'message') {
    series = [
      { name: '消息收发', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.message.sentMessages + person.message.receivedMessages, 0)), color: '#5a95ff' },
      { name: '文件收发', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.message.sentFiles + person.message.receivedFiles, 0)), color: '#43d7a2' }
    ];
  } else {
    series = [
      { name: '已处理', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.signing.processed, 0)), color: '#43d7a2' },
      { name: '待处理', data: demoSituationScenario.regions.map((region) => region.people.reduce((sum, person) => sum + person.signing.pending, 0)), color: '#e9b949' }
    ];
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 2, right: 8, textStyle: { color: '#8592a7', fontSize: 14 } },
    grid: { left: 44, right: 16, top: 40, bottom: 36 },
    xAxis: { type: 'category', data: countryNames, axisLabel: { color: '#748198', fontSize: 14, interval: 0 }, axisLine: { lineStyle: { color: '#303d53' } } },
    yAxis: { type: 'value', axisLabel: { color: '#748198', fontSize: 14 }, splitLine: { lineStyle: { color: 'rgba(110,130,160,.13)' } } },
    series: series.map((item) => ({ name: item.name, type: 'bar', barMaxWidth: 18, data: item.data, itemStyle: { color: item.color } }))
  };
});

const regionRows = computed(() => demoSituationScenario.regions
  .filter((region) => region.people.some((person) => person.online) || region.trafficGb > 0)
  .sort((a, b) => b.trafficGb - a.trafficGb)
  .slice(0, 5)
  .map((region) => {
    const hasTopology = demoSituationScenario.routes.some((route) => route.countryCode === region.countryCode);
    const name = region.countryCode === 'CN' ? '北京' : region.countryName;
    if (activeTopic.value === 'traffic') {
      const load = region.uplinkMbps + region.downlinkMbps;
      return { countryCode: region.countryCode, name, hasTopology, primary: `${load.toFixed(1)} Mbps`, secondary: `上行 ${region.uplinkMbps.toFixed(1)} / 下行 ${region.downlinkMbps.toFixed(1)} Mbps · ${region.trafficGb.toFixed(1)} GB`, tone: load >= 14 ? 'warning' : 'success' };
    }
    if (activeTopic.value === 'message') {
      return { countryCode: region.countryCode, name, hasTopology, primary: `${region.people.filter((person) => person.online).length}/${region.people.length} 登录`, secondary: `${region.people.reduce((sum, person) => sum + person.message.sentMessages + person.message.receivedMessages, 0)} 条消息`, tone: region.people.some((person) => person.suiteStatus === 'offline') ? 'danger' : 'success' };
    }
    return { countryCode: region.countryCode, name, hasTopology, primary: `${region.people.reduce((sum, person) => sum + person.signing.processed, 0)} 份已处理`, secondary: `${region.people.reduce((sum, person) => sum + person.signing.pending, 0)} 份待处理`, tone: region.people.reduce((sum, person) => sum + person.signing.exception, 0) > 0 ? 'warning' : 'success' };
  }));

// 区域运行状态行点击：复用多跳线路拓扑面板。
const topologyCountry = ref<string | null>(null);
function openTopology(countryCode: string) {
  if (demoSituationScenario.routes.some((route) => route.countryCode === countryCode)) {
    topologyCountry.value = countryCode;
  }
}

const eventRows = computed(() => demoSituationScenario.people.flatMap((person) => person.activities.map((activity) => ({ ...activity, person }))).sort((a, b) => a.minutesAgo - b.minutesAgo).filter((item) => {
  if (activeTopic.value === 'traffic') return item.type === 'security' || item.type === 'file';
  return activeTopic.value === 'message' ? ['login', 'logout', 'message', 'file'].includes(item.type) : item.type === 'signing';
}).slice(0, 3));

const messageRankingModes: Array<{ key: RankingMode; label: string }> = [
  { key: 'total', label: '总量' },
  { key: 'sent', label: '发送' },
  { key: 'received', label: '接收' }
];
const messageUserMode = ref<RankingMode>('total');
const messageDeptMode = ref<RankingMode>('total');
type MessageRankRow = { name: string; fullName: string; sent: number; received: number; total: number; context: string; personId?: string };

const messageUserRanking = computed<MessageRankRow[]>(() => demoSituationScenario.people
  .map((person) => ({ name: person.name, fullName: person.name, sent: person.message.sentMessages, received: person.message.receivedMessages, total: person.message.sentMessages + person.message.receivedMessages, context: person.department, personId: person.id }))
  .sort((a, b) => b[messageUserMode.value] - a[messageUserMode.value])
  .slice(0, 6));

const messageDeptRanking = computed<MessageRankRow[]>(() => {
  const map = new Map<string, MessageRankRow>();
  demoSituationScenario.people.forEach((person) => {
    const entry = map.get(person.department) ?? { name: compactDepartmentName(person.department), fullName: person.department, sent: 0, received: 0, total: 0, context: '' };
    entry.sent += person.message.sentMessages;
    entry.received += person.message.receivedMessages;
    entry.total = entry.sent + entry.received;
    entry.context = `${demoSituationScenario.people.filter((item) => item.department === person.department).length} 人`;
    map.set(person.department, entry);
  });
  return [...map.values()].sort((a, b) => b[messageDeptMode.value] - a[messageDeptMode.value]).slice(0, 6);
});

const messageUserOption = computed(() => messageRankingOption(
  messageUserRanking.value,
  messageUserMode.value,
  (item) => item.name,
  (item) => ({ personId: item.personId, context: item.context })
));
const messageDeptOption = computed(() => messageRankingOption(
  messageDeptRanking.value,
  messageDeptMode.value,
  (item) => item.name,
  (item) => ({ context: item.context }),
  (item) => item.fullName
));

const signingRankings = computed(() => {
  const people = demoSituationScenario.people
    .map((person) => ({ name: person.name, value: person.signing.processed, detail: `已处理 ${person.signing.processed} 份 · 待处理 ${person.signing.pending} 份` }))
    .sort((a, b) => b.value - a.value).slice(0, 8);
  const departments = new Map<string, { value: number; pending: number; people: number }>();
  demoSituationScenario.people.forEach((person) => {
    const item = departments.get(person.department) ?? { value: 0, pending: 0, people: 0 };
    item.value += person.signing.processed;
    item.pending += person.signing.pending;
    item.people += 1;
    departments.set(person.department, item);
  });
  return {
    people,
    departments: [...departments.entries()].map(([name, item]) => ({ name: compactDepartmentName(name), value: item.value, detail: `${name} · 已处理 ${item.value} 份 · 待处理 ${item.pending} 份 · ${item.people} 人` })).sort((a, b) => b.value - a.value).slice(0, 6)
  };
});

const trafficRankings = computed(() => ({
  systems: systemTrafficSnapshot.value.map((item) => ({ name: item.name, value: item.throughputMbps, detail: `今日累计 ${item.trafficGb.toFixed(1)} GB` })).sort((a, b) => b.value - a.value),
  regions: demoSituationScenario.regions.map((region) => ({ name: region.countryCode === 'CN' ? '北京' : region.countryName, value: region.uplinkMbps + region.downlinkMbps, detail: `上行 ${region.uplinkMbps.toFixed(1)} / 下行 ${region.downlinkMbps.toFixed(1)} Mbps` })).sort((a, b) => b.value - a.value).slice(0, 6)
}));

const signingPeopleOption = computed(() => topicRankingOption(signingRankings.value.people, '#43d7a2', '份', 0));
const signingDepartmentsOption = computed(() => topicRankingOption(signingRankings.value.departments, '#5a95ff', '份', 0));
const trafficSystemsOption = computed(() => topicRankingOption(trafficRankings.value.systems, '#5a95ff', 'Mbps', 1));
const trafficRegionsOption = computed(() => topicRankingOption(trafficRankings.value.regions, '#43d7a2', 'Mbps', 1));

const topicTitle = computed(() => activeTopic.value === 'traffic' ? '各业务系统吞吐趋势' : activeTopic.value === 'message' ? '密信分时业务趋势' : '签阅文件处理趋势');
const regionTitle = computed(() => activeTopic.value === 'traffic' ? '各区域链路流量' : activeTopic.value === 'message' ? '各区域密信业务量' : '各区域签阅处理量');
const statusTitle = computed(() => activeTopic.value === 'traffic' ? '业务系统流量分布' : activeTopic.value === 'message' ? '当前登录状态' : '签阅处理状态');

function relativeTime(minutes: number) {
  const value = Math.round(minutes);
  return value < 1 ? '最新' : `${value} 分钟前`;
}
</script>

<template>
  <div class="demo-business">
    <nav class="topic-switch" aria-label="业务专题">
      <button v-for="topic in topics" :key="topic.id" type="button" :class="{ active: activeTopic === topic.id }" @click="activeTopic = topic.id"><strong>{{ topic.label }}</strong><span>{{ topic.short }}</span></button>
      <button class="topic-back" type="button" @click="router.push('/overview')">‹ 返回综合态势</button>
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
        <article class="ops-panel region-status-panel"><header><span>区域运行状态</span></header><div class="region-rows"><button v-for="row in regionRows" :key="row.name" type="button" class="region-row" :class="{ clickable: row.hasTopology }" :title="row.hasTopology ? '点击查看多跳线路拓扑' : ''" @click="row.hasTopology && openTopology(row.countryCode)"><i :class="`tone-${row.tone}`" /><span><strong>{{ row.name }}</strong><small>{{ row.secondary }}</small></span><b>{{ row.primary }}</b></button></div></article>
        <article class="ops-panel event-panel"><header><span>最近业务活动</span></header><div class="event-rows"><div v-for="event in eventRows" :key="event.id"><time>{{ relativeTime(event.minutesAgo) }}</time><span><strong>{{ event.person.name }} · {{ event.title }}</strong><small>{{ event.detail }}</small></span></div><div v-if="!eventRows.length" class="empty-events">当前专题无新增异常事件</div></div></article>
      </aside>
    </section>

    <section v-if="activeTopic === 'message'" class="ranking-strip" aria-label="密信收发排行">
      <article class="ops-panel ranking-panel">
        <header class="ranking-header"><span>用户收发排名</span><div class="rank-mode-switch" role="group" aria-label="用户排名统计方式"><button v-for="mode in messageRankingModes" :key="mode.key" type="button" :class="{ active: messageUserMode === mode.key }" :aria-pressed="messageUserMode === mode.key" @click="messageUserMode = mode.key">{{ mode.label }}</button></div></header>
        <div class="ranking-chart"><EChartWidget :option="messageUserOption" /></div>
      </article>
      <article class="ops-panel ranking-panel">
        <header class="ranking-header"><span>部门收发排名</span><div class="rank-mode-switch" role="group" aria-label="部门排名统计方式"><button v-for="mode in messageRankingModes" :key="mode.key" type="button" :class="{ active: messageDeptMode === mode.key }" :aria-pressed="messageDeptMode === mode.key" @click="messageDeptMode = mode.key">{{ mode.label }}</button></div></header>
        <div class="ranking-chart"><EChartWidget :option="messageDeptOption" /></div>
      </article>
    </section>

    <section v-else-if="activeTopic === 'signing'" class="ranking-strip" aria-label="签阅处置排行">
      <article class="ops-panel topic-rank-panel"><header><span>人员签阅处理排名</span><b>按已处理份数</b></header><div class="topic-ranking-chart"><EChartWidget :option="signingPeopleOption" /></div></article>
      <article class="ops-panel topic-rank-panel"><header><span>部门签阅处理排名</span><b>按已处理份数</b></header><div class="topic-ranking-chart"><EChartWidget :option="signingDepartmentsOption" /></div></article>
    </section>

    <section v-else class="ranking-strip" aria-label="系统流量排行">
      <article class="ops-panel topic-rank-panel"><header><span>业务系统吞吐排名</span><b>当前 Mbps</b></header><div class="topic-ranking-chart"><EChartWidget :option="trafficSystemsOption" /></div></article>
      <article class="ops-panel topic-rank-panel"><header><span>区域链路流量排名</span><b>上行 + 下行</b></header><div class="topic-ranking-chart"><EChartWidget :option="trafficRegionsOption" /></div></article>
    </section>

    <Transition name="route-panel">
      <RouteTopologyPanel v-if="topologyCountry" :country-code="topologyCountry" @close="topologyCountry = null" />
    </Transition>
  </div>
</template>

<style scoped>
.demo-business { position: relative; height: calc(100vh - var(--topbar-height) - 22px); min-height: 640px; display: grid; grid-template-rows: auto auto minmax(0,1fr) 168px; gap: 10px; color: #e7ebf5; }
.topic-switch { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)) 170px; border: 1px solid #28344a; background: #111827; }.topic-switch button { min-height: 52px; display: flex; align-items: center; justify-content: center; gap: 9px; border: 0; border-right: 1px solid #28344a; color: #7e8a9e; background: transparent; cursor: pointer; }.topic-switch button:last-child { border-right: 0; }.topic-switch button.active { color: #dce6f5; background: #19243a; box-shadow: inset 0 -2px #6d9bea; }.topic-switch strong { font-size: 20px; white-space: nowrap; }.topic-switch span { font-size: 16px; white-space: nowrap; }.topic-switch .topic-back { flex: 0 0 170px; color: #7fb0ff; font-size: 16px; gap: 6px; white-space: nowrap; }.topic-switch .topic-back:hover { color: #cfe2ff; background: #182338; }
.metric-strip { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); border: 1px solid #28344a; background: #111827; }.metric-strip article { min-height: 96px; padding: 14px 18px 16px; border-right: 1px solid #28344a; }.metric-strip article:last-child { border-right: 0; }.metric-strip span { display: block; color: #aab5c7; font-size: 18px; line-height: 1.1; }.metric-strip strong { display: block; margin-top: 5px; color: #e8edf6; font: 600 32px var(--font-family-mono, monospace); line-height: 1.05; }.metric-strip small { margin-left: 4px; color: #aab5c7; font-size: 16px; font-weight: 500; }.metric-strip p { margin: 5px 0 0; color: #8492a8; font-size: 14px; line-height: 1.2; }.metric-strip .tone-success strong { color: #72deb9; }.metric-strip .tone-info strong { color: #85aefd; }.metric-strip .tone-warning strong { color: #edc66b; }.metric-strip .tone-danger strong { color: #f17a89; }
.business-workspace { min-height: 0; display: grid; grid-template-columns: minmax(220px,250px) minmax(500px,1fr) minmax(270px,300px); gap: 10px; }.business-column { min-height: 0; display: grid; gap: 10px; }.left-column { grid-template-rows: 1fr 1fr; }.center-column { grid-template-rows: 1.55fr 1fr; }.right-column { grid-template-rows: 1.08fr .92fr; }
.ops-panel { min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #28344a; background: #111827; }.ops-panel > header { flex: 0 0 auto; height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 12px; border-bottom: 1px solid #263147; }.ops-panel header span { display: block; overflow: hidden; color: #eef4ff; font-size: 16px; font-weight: 700; white-space: nowrap; text-overflow: ellipsis; flex-shrink: 0; }.ops-panel header small { display: block; margin-top: 3px; color: #8493aa; font-size: 12px; }.ops-panel header > b { overflow: hidden; color: #ead07c; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }.status-panel,.chart-panel { display: grid; grid-template-rows: 52px minmax(0,1fr); }.status-chart { min-height: 0; }.chart-panel > div { min-height: 0; }
.fact-list { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); overflow-y: auto; overflow-x: hidden; }.fact-list div { min-height: 64px; padding: 11px 12px; border-right: 1px solid #243047; border-bottom: 1px solid #243047; }.fact-list div:nth-child(2n) { border-right: 0; }.fact-list span,.fact-list strong { display: block; }.fact-list span { overflow: hidden; color: #8492a8; font-size: 14px; white-space: nowrap; text-overflow: ellipsis; }.fact-list strong { overflow: hidden; margin-top: 6px; color: #d8e0eb; font: 600 14px var(--font-family-base); white-space: nowrap; text-overflow: ellipsis; }
.region-rows { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; }.region-row { width: 100%; min-height: 52px; display: grid; grid-template-columns: 7px minmax(0,1fr) auto; align-items: center; gap: 8px; padding: 7px 12px; border: 0; border-bottom: 1px solid #222d41; color: inherit; background: transparent; text-align: left; cursor: default; }.region-row.clickable { cursor: pointer; }.region-row.clickable:hover { background: #182338; }.region-row i { width: 7px; height: 7px; border-radius: 50%; background: #43d7a2; }.region-row i.tone-warning { background: #e9b949; }.region-row i.tone-danger { background: #ef6579; }.region-row strong,.region-row small { display: block; }.region-row strong { color: #cfd7e3; font-size: 12px; }.region-row small { margin-top: 3px; color: #8492a8; font-size: 11px; }.region-row b { color: #b4c0d2; font: 600 12px var(--font-family-base); white-space: nowrap; }
/* 业务态势内复用多跳拓扑面板：相对业务面板定位，避开顶部专题切换条。 */
:deep(.topology-panel) { top: 68px; }
.event-rows { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 2px 12px; }.event-rows > div:not(.empty-events) { display: grid; grid-template-columns: 84px minmax(0,1fr); gap: 8px; padding: 9px 0; border-bottom: 1px solid #222d41; }.event-rows time { color: #8492a8; font: 11px var(--font-family-base); white-space: nowrap; }.event-rows strong,.event-rows small { display: block; }.event-rows strong { overflow: hidden; color: #cfd7e3; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }.event-rows small { overflow: hidden; margin-top: 3px; color: #8492a8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.empty-events { padding: 18px 0; color: #8492a8; font-size: 12px; text-align: center; }
.ranking-strip { min-height: 0; display: grid; grid-template-columns: 1.1fr 1fr; gap: 10px; }.ranking-panel, .topic-rank-panel { display: grid; grid-template-rows: 52px minmax(0,1fr); }.ranking-header { min-width: 0; }.rank-mode-switch { flex: 0 0 auto; display: inline-grid; grid-template-columns: repeat(3, 36px); height: 26px; border: 1px solid #35445d; background: #0d1524; }.rank-mode-switch button { width: 36px; height: 24px; padding: 0; border: 0; border-right: 1px solid #35445d; color: #8594aa; background: transparent; font: 12px var(--font-family-base); cursor: pointer; }.rank-mode-switch button:last-child { border-right: 0; }.rank-mode-switch button:hover { color: #dbe8fb; background: #182740; }.rank-mode-switch button.active { color: #eef5ff; background: #284b7c; box-shadow: inset 0 -2px #6aa4ff; }.topic-ranking-chart, .ranking-chart { min-height: 0; }.topic-ranking-chart :deep(.chart-shell), .topic-ranking-chart :deep(.chart-box), .ranking-chart :deep(.chart-shell), .ranking-chart :deep(.chart-box) { min-height: 0; height: 100%; }
@media (max-width: 1300px) { .business-workspace { grid-template-columns: 205px minmax(430px,1fr) 250px; } }
/* 自适应：中等尺寸屏压缩边栏与专题行。 */
@media (max-width: 1640px) and (min-width: 1500px) {
  .business-workspace { grid-template-columns: 215px minmax(0,1fr) 235px; }
  .metric-strip article { min-height: 86px; padding: 12px 14px 14px; }
  .metric-strip strong { font-size: 28px; }
  .demo-business { grid-template-rows: auto auto minmax(0,1fr) 158px; }
}
/* 自适应：高度不足或宽度偏窄时切换为可滚动整页，保证内容完整不被裁切。 */
@media (max-width: 1499px), (max-height: 819px) {
  .demo-business {
    height: auto;
    min-height: 0;
    grid-template-rows: auto auto minmax(500px, auto) 168px;
    overflow: visible;
  }
  .business-workspace { min-height: 500px; }
}
@media (max-height: 820px) and (min-width: 1051px) and (min-width: 1500px) { .demo-heading { min-height: 38px; }.demo-heading h1 { font-size: 19px; }.topic-switch button { min-height: 40px; }.metric-strip article { min-height: 80px; padding: 10px 14px 12px; }.metric-strip strong { font-size: 26px; }.left-column { grid-template-rows: .92fr 1.08fr; }.center-column { grid-template-rows: 1.35fr 1fr; }.right-column { grid-template-rows: 1.35fr .65fr; }.ops-panel > header { height: 38px; }.status-panel,.chart-panel { grid-template-rows: 38px minmax(0,1fr); }.fact-list div { min-height: 48px; padding: 7px 10px; }.region-row { min-height: 42px; padding: 5px 10px; }.event-rows > div:not(.empty-events) { padding: 6px 0; } }
@media (max-width: 1050px) { .demo-business { height: auto; grid-template-rows: auto auto auto auto; }.business-workspace { grid-template-columns: 1fr 1.8fr; }.right-column { grid-column: 1/-1; grid-template-columns: 1fr 1fr; grid-template-rows: 330px; }.metric-strip { grid-template-columns: repeat(2,1fr); }.metric-strip article:nth-child(2) { border-right: 0; } }
@media (max-width: 720px) { .heading-status span,.topic-switch span { display: none; }.topic-switch button { min-height: 42px; }.metric-strip,.business-workspace { grid-template-columns: 1fr; }.metric-strip article { border-right: 0; border-bottom: 1px solid #28344a; }.left-column,.right-column { grid-column: auto; grid-template-columns: 1fr; grid-template-rows: auto; }.center-column { grid-template-rows: 360px 280px; }.ranking-strip { grid-template-columns: 1fr; } }

/* Charts shrink with their panel instead of forcing 240px min-height. */
.status-chart :deep(.chart-shell), .status-chart :deep(.chart-box), .chart-panel :deep(.chart-shell), .chart-panel :deep(.chart-box) { min-height: 0; height: 100%; }

/* Dashboard body text follows one readable baseline across all panels. */
.ops-panel > header { height: 52px; }.status-panel,.chart-panel { grid-template-rows: 52px minmax(0, 1fr); }
.ops-panel header span { font-size: 17px; }.ops-panel header > b,.region-rows strong,.region-rows small,.region-rows b,.event-rows time,.event-rows strong,.event-rows small,.empty-events { font-size: 18px; }
.fact-list div { min-height: 82px; }.region-row { min-height: 44px; padding: 5px 12px; }.event-rows > div:not(.empty-events) { grid-template-columns: 84px minmax(0,1fr); padding: 7px 0; }
.region-rows strong { font-size: 15px; }.region-rows small { font-size: 13px; }.region-rows b { font-size: 14px; }
.ranking-panel > header, .topic-rank-panel > header { height: 52px; }.ranking-panel header span, .topic-rank-panel header span { font-size: 17px; }.topic-rank-panel header > b { font-size: 15px; }
</style>
