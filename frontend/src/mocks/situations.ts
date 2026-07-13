import type {
  SituationHighlight,
  SituationKpi,
  SituationPage,
  SituationPageCode,
  SituationSection,
  SituationSignalItem,
  SituationTone
} from '@/types/situation';
import type { MiniTrendItem, VisualAssetNode, VisualLink } from '@/types/visualization';

function kpi(label: string, value: string, description: string, tone: SituationTone, unit?: string, trend?: string): SituationKpi {
  return { label, value, description, tone, unit, trend };
}

function highlight(title: string, description: string, metric: string, meta: string, tone: SituationTone): SituationHighlight {
  return { title, description, metric, meta, tone };
}

function signal(label: string, title: string, description: string, meta: string, tone: SituationTone): SituationSignalItem {
  return { label, title, description, meta, tone };
}

function sceneNode(
  id: string,
  name: string,
  assetType: VisualAssetNode['assetType'],
  status: VisualAssetNode['status'],
  x: number,
  y: number,
  description: string,
  metricLabel?: string,
  metricValue?: string
): VisualAssetNode {
  return {
    id,
    name,
    assetType,
    status,
    x,
    y,
    description,
    metrics: metricLabel && metricValue ? [{ label: metricLabel, value: metricValue, tone: status }] : []
  };
}

function trend(key: string, label: string, value: string, percent: number, tone: MiniTrendItem['tone'], trendText: string): MiniTrendItem {
  return { key, label, value, percent, tone, trend: trendText };
}

function sectionScene(code: string, title: string, description: string, nodes: VisualAssetNode[], links: VisualLink[], tags: string[], minHeight = 520): SituationSection {
  return { kind: 'scene', code, title, description, tags, colSpan: 12, minHeight, nodes, links, legend: ['中枢节点', '风险链路', '处置闭环'] };
}

function sectionRelation(code: string, title: string, description: string, nodes: VisualAssetNode[], links: VisualLink[], tags: string[], minHeight = 520): SituationSection {
  return { kind: 'relationMap', code, title, description, tags, colSpan: 12, minHeight, nodes, links, legend: ['业务对象', '风险对象', '保障对象'] };
}

function chart(code: string, title: string, option: Record<string, unknown>, tags: string[], description?: string, minHeight = 340, footer?: string): SituationSection {
  return { kind: 'chart', code, title, description, tags, colSpan: 6, minHeight, option, footer };
}

const chartGrid = { left: 36, right: 24, top: 42, bottom: 30 };
const chartGridWide = { left: 92, right: 28, top: 32, bottom: 28 };
const days = ['7/3', '7/4', '7/5', '7/6', '7/7', '7/8', '7/9'];

function lineAreaOption(names: string[], series: Array<{ name: string; data: number[] }>) {
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0 },
    grid: chartGrid,
    xAxis: { type: 'category', boundaryGap: false, data: names },
    yAxis: { type: 'value' },
    series: series.map((item, index) => ({
      name: item.name,
      type: 'line',
      smooth: true,
      symbolSize: 6,
      areaStyle: { opacity: index === 0 ? 0.18 : 0.12 },
      data: item.data
    }))
  };
}

function ringOption(centerLabel: string, data: Array<{ name: string; value: number }>) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, left: 'center' },
    title: {
      text: String(total),
      subtext: centerLabel,
      left: 'center',
      top: '39%',
      textAlign: 'center',
      textStyle: { fontSize: 28, fontWeight: 700 },
      subtextStyle: { fontSize: 12 }
    },
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: { formatter: '{b}\n{c}' },
      data
    }]
  };
}

function horizontalBarOption(data: Array<{ name: string; value: number }>) {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: chartGridWide,
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: data.map((item) => item.name) },
    series: [{
      type: 'bar',
      barWidth: 14,
      label: { show: true, position: 'right', formatter: '{c}' },
      data: data.map((item) => item.value)
    }]
  };
}

function funnelOption(data: Array<{ name: string; value: number }>) {
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'funnel',
      left: '12%',
      top: 36,
      bottom: 18,
      width: '76%',
      minSize: '34%',
      maxSize: '92%',
      sort: 'descending',
      gap: 8,
      label: { show: true, position: 'inside', formatter: '{b}\n{c}' },
      data
    }]
  };
}

function stackedBarOption(categories: string[], series: Array<{ name: string; data: number[] }>) {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, right: 0 },
    grid: chartGrid,
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: series.map((item) => ({
      name: item.name,
      type: 'bar',
      stack: 'total',
      barWidth: 24,
      emphasis: { focus: 'series' },
      data: item.data
    }))
  };
}

function radarOption(indicators: Array<{ name: string; max: number }>, value: number[], name: string) {
  return {
    tooltip: { trigger: 'item' },
    radar: {
      radius: '64%',
      indicator: indicators,
      splitNumber: 4
    },
    series: [{
      type: 'radar',
      data: [{
        name,
        value,
        areaStyle: { opacity: 0.2 }
      }]
    }]
  };
}

function sankeyOption(nodes: string[], links: Array<{ source: string; target: string; value: number }>) {
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey',
      left: 24,
      right: 24,
      top: 20,
      bottom: 16,
      nodeWidth: 16,
      nodeGap: 12,
      emphasis: { focus: 'adjacency' },
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.42 },
      label: { color: '#dff8ff', fontSize: 11 },
      data: nodes.map((name) => ({ name })),
      links
    }]
  };
}

function relationGraphOption() {
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'graph', layout: 'force', roam: true, force: { repulsion: 420, edgeLength: [80, 150] },
      label: { show: true, color: '#e8fbff', fontSize: 10 }, edgeSymbol: ['none', 'arrow'], edgeSymbolSize: 6,
      lineStyle: { color: '#35d8ff', opacity: 0.42, curveness: 0.1 },
      data: [
        { name: '高风险账号', symbolSize: 48, category: 0, itemStyle: { color: '#ff6178' } },
        { name: '异常终端', symbolSize: 44, category: 1, itemStyle: { color: '#ffc857' } },
        { name: '敏感文件导出', symbolSize: 52, category: 0, itemStyle: { color: '#ff6178' } },
        { name: '非工作时段访问', symbolSize: 40, category: 2, itemStyle: { color: '#35d8ff' } },
        { name: '零信任策略', symbolSize: 46, category: 2, itemStyle: { color: '#31e6a1' } },
        { name: '处置工单', symbolSize: 42, category: 2, itemStyle: { color: '#31e6a1' } }
      ],
      links: [
        { source: '高风险账号', target: '异常终端' }, { source: '异常终端', target: '敏感文件导出' },
        { source: '非工作时段访问', target: '高风险账号' }, { source: '零信任策略', target: '高风险账号' },
        { source: '敏感文件导出', target: '处置工单' }
      ]
    }]
  };
}

function terminalTopologyOption() {
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      force: { repulsion: 470, edgeLength: [80, 158] },
      label: { show: true, color: '#e8fbff', fontSize: 10 },
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: 6,
      lineStyle: { color: '#35d8ff', opacity: 0.4, curveness: 0.08 },
      data: [
        { name: '终端接入中枢', symbolSize: 54, itemStyle: { color: '#35d8ff' } },
        { name: '签批 PAD', symbolSize: 42, itemStyle: { color: '#ffc857' } },
        { name: '办公终端', symbolSize: 46, itemStyle: { color: '#31e6a1' } },
        { name: '境外终端聚合', symbolSize: 44, itemStyle: { color: '#ffc857' } },
        { name: 'USB Key 认证', symbolSize: 40, itemStyle: { color: '#ff6178' } },
        { name: '安全接入策略', symbolSize: 42, itemStyle: { color: '#31e6a1' } },
        { name: '终端处置工单', symbolSize: 40, itemStyle: { color: '#35d8ff' } }
      ],
      links: [
        { source: '签批 PAD', target: '终端接入中枢' }, { source: '办公终端', target: '终端接入中枢' },
        { source: '境外终端聚合', target: '终端接入中枢' }, { source: 'USB Key 认证', target: '签批 PAD' },
        { source: '终端接入中枢', target: '安全接入策略' }, { source: '安全接入策略', target: '终端处置工单' }
      ]
    }]
  };
}

function buildOverviewSections(): SituationSection[] {
  const nodes = [
    sceneNode('overview-center', '综合分析中枢', 'domain', 'success', 46, 50, '安全、业务、终端、运维四域统一研判', '闭环率', '87%'),
    sceneNode('overview-security', '安全监管域', 'policy', 'warning', 22, 24, '风险事件、策略命中、账号行为', '高危', '4 起'),
    sceneNode('overview-business', '业务运行域', 'service', 'success', 74, 24, '核心链路、服务依赖、业务量', '成功率', '99.3%'),
    sceneNode('overview-terminal', '终端保障域', 'terminal', 'warning', 22, 76, '在线终端、人员归属、异常终端', '关注', '15 台'),
    sceneNode('overview-ops', '运维保障域', 'server', 'success', 74, 76, '主机、进程、资源容量', '在线', '168 台'),
    sceneNode('overview-source', '数据汇聚层', 'source', 'info', 10, 50, '安管、泄密、运维、人工核验', '来源', '11 类'),
    sceneNode('overview-workflow', '处置指挥台', 'alert', 'success', 90, 50, '研判、派单、处置、复盘', '平均', '24 分钟')
  ];

  const links: VisualLink[] = [
    { from: 'overview-source', to: 'overview-center', tone: 'info' },
    { from: 'overview-center', to: 'overview-security', tone: 'warning' },
    { from: 'overview-center', to: 'overview-business', tone: 'success' },
    { from: 'overview-center', to: 'overview-terminal', tone: 'warning' },
    { from: 'overview-center', to: 'overview-ops', tone: 'success' },
    { from: 'overview-center', to: 'overview-workflow', tone: 'success' }
  ];

  return [
    sectionScene('overview-scene', '综合态势联动图', '四域状态、风险链路与处置进展集中呈现。', nodes, links, ['主视觉', '中部']),
    chart('overview-asset-ring', '内网实体台账概览', ringOption('内网实体总数', [
      { name: '终端', value: 131 },
      { name: '服务器', value: 168 },
      { name: '账号', value: 286 },
      { name: '组织', value: 42 },
      { name: '安全设备', value: 24 }
    ]), ['左侧', '图表', '资产'], '按实体类型展示当前纳管规模。'),
    chart('overview-trend', '近七日告警处置趋势', lineAreaOption(days, [
      { name: '告警数', data: [40, 48, 55, 60, 56, 50, 44] },
      { name: '处置数', data: [12, 22, 33, 44, 44, 44, 42] }
    ]), ['中部', '图表', '趋势'], '告警与处置变化趋势。', 360),
    chart('overview-funnel', '异常告警处置情况', funnelOption([
      { name: '异常事件', value: 76 },
      { name: '研判中', value: 47 },
      { name: '已处置', value: 29 }
    ]), ['右侧', '图表', '处置'], '展示事件从发现到处置的流转规模。'),
    chart('overview-resource', '接入资源概览', stackedBarOption(['安全监管', '泄密监管', '运维监管'], [
      { name: '人员', data: [10, 6, 7] },
      { name: '设备', data: [30, 15, 25] },
      { name: '组织', data: [2, 1, 1] }
    ]), ['左侧', '图表', '资源'], '人员、设备、组织接入分布。'),
    chart('overview-behavior', '异常行为分类统计', horizontalBarOption([
      { name: '用户行为异常', value: 396 },
      { name: '边界行为异常', value: 353 },
      { name: '网络应用异常', value: 316 },
      { name: '运维管理员异常', value: 281 },
      { name: '入侵攻击检测', value: 204 },
      { name: '安全防护异常', value: 153 }
    ]), ['中部', '图表', '分类'], '按异常行为类型展示月度分布。', 380),
    {
      kind: 'signals',
      code: 'overview-events',
      title: '实时事件流',
      description: '当前重点事件滚动呈现。',
      tags: ['右侧', '事件'],
      colSpan: 4,
      minHeight: 380,
      items: [
        signal('安全', '王芳连续输错证书口令', '账号口令异常触发高危研判。', '15:44:00', 'danger'),
        signal('运维', '服务器资源使用率持续升高', '核心主机资源压力进入关注区间。', '15:43:52', 'warning'),
        signal('业务', '签批链路高峰时延抬升', '业务链路响应时间短时波动。', '15:42:18', 'warning'),
        signal('终端', '涉密终端长时间未使用', '终端保障组已纳入巡检清单。', '15:41:52', 'info'),
        signal('零信任', '境外账号触发二次认证', '风险因子叠加地理位置异常。', '15:40:36', 'warning'),
        signal('防火墙', '边界异常外联已阻断', '高风险目标地址命中阻断策略。', '15:39:14', 'success'),
        signal('数据库', '核心库连接数进入高位', '签阅高峰导致连接池压力升高。', '15:37:58', 'warning'),
        signal('USB Key', '连续三次 PIN 校验失败', '终端已进入高危认证告警队列。', '15:36:21', 'danger'),
        signal('密信', '离线消息积压开始回落', '消费节点扩容后积压持续下降。', '15:34:46', 'success'),
        signal('机房', '北京中心机房数据库连接进入高位', '已启动慢查询优化和连接池扩容预案。', '15:32:19', 'danger'),
        signal('终端', '新加坡区域终端版本待升级', '12 台设备进入补丁升级窗口。', '15:29:42', 'info'),
        signal('审计', '运维策略变更完成复核', '策略执行结果和审计记录已归档。', '15:27:05', 'success')
      ]
    },
    {
      kind: 'miniTrendGroup',
      code: 'overview-mini-trends',
      title: '全局指标摘要',
      description: '核心指标集中看板。',
      tags: ['底部', '指标'],
      colSpan: 4,
      minHeight: 250,
      items: [
        trend('health', '综合安全指数', '86%', 86, 'success', '较昨日 +3%'),
        trend('assets', '在线资产率', '71%', 71, 'warning', '总设备 38'),
        trend('events', '今日异常事件', '41 次', 58, 'warning', '高危 6 起'),
        trend('closure', '及时处置率', '75.9%', 76, 'success', '持续提升')
      ]
    }
  ];
}

function buildSecuritySections(): SituationSection[] {
  return [
    chart('security-risk-chain', '安全事件风险关联链', relationGraphOption(), ['中部', '图表', '风险链'], '账号、终端、敏感操作和零信任策略关联研判。', 420),
    chart('security-firewall-trend', '防火墙告警趋势', lineAreaOption(days, [
      { name: '拦截告警', data: [28, 35, 31, 42, 47, 49, 53] },
      { name: '高危来源', data: [6, 7, 8, 10, 12, 11, 13] }
    ]), ['左侧', '图表', '防火墙'], '边界防火墙拦截与告警走势。', 360),
    chart('security-vuln-ring', '漏洞风险等级分布', ringOption('漏洞总数', [
      { name: '高危', value: 8 },
      { name: '中危', value: 18 },
      { name: '低危', value: 27 },
      { name: '已修复', value: 14 }
    ]), ['左侧', '图表', '漏洞'], '按漏洞风险等级展示当前分布。'),
    chart('security-ids-trend', '入侵检测趋势', lineAreaOption(days, [
      { name: '入侵检测告警', data: [4, 6, 5, 7, 9, 8, 10] },
      { name: '已阻断', data: [2, 3, 3, 4, 5, 5, 6] }
    ]), ['左侧', '图表', '入侵检测'], '入侵检测与阻断趋势。', 360),
    chart('security-risk-trend', '高危事件趋势', lineAreaOption(days, [
      { name: '高危事件', data: [5, 6, 7, 8, 8, 7, 6] },
      { name: '已处置', data: [2, 3, 4, 5, 6, 6, 6] }
    ]), ['中部', '图表', '趋势'], '高危安全事件与处置变化。', 360),
    chart('security-defense-radar', '零信任风险因子雷达', radarOption([
      { name: '认证异常', max: 100 }, { name: '行为偏离', max: 100 }, { name: '地理异常', max: 100 },
      { name: '时间异常', max: 100 }, { name: '策略命中', max: 100 }, { name: '二次认证', max: 100 }
    ], [78, 86, 64, 72, 92, 81], '零信任风险'), ['中部', '图表', '零信任'], '用户风险等级、风险因子与策略命中情况。', 360),
    chart('security-funnel', '安全事件处置漏斗', funnelOption([
      { name: '发现告警', value: 82 },
      { name: '研判中', value: 46 },
      { name: '已阻断', value: 28 },
      { name: '已复盘', value: 17 }
    ]), ['右侧', '图表', '处置'], '从发现到复盘的安全事件闭环。'),
    chart('security-asset-bar', '受影响资产排行', horizontalBarOption([
      { name: '边界网关', value: 26 },
      { name: '办公终端', value: 21 },
      { name: '核心服务器', value: 17 },
      { name: '数据库节点', value: 12 },
      { name: '管理账号', value: 9 }
    ]), ['右侧', '图表', '资产'], '受影响资产数量排行。', 340),
    chart('security-zero-trust-policy', '零信任策略命中与执行时效', stackedBarOption(['身份认证', '终端校验', '敏感访问', '境外访问', '管理操作'], [
      { name: '正常放行', data: [1840, 1212, 526, 84, 196] },
      { name: '二次认证', data: [68, 57, 112, 36, 24] },
      { name: '拒绝访问', data: [12, 8, 31, 18, 7] }
    ]), ['中部', '零信任'], '展示策略命中后的放行、二次认证与拒绝结果。', 360),
    chart('security-behavior-model', '异常行为模型检出对比', horizontalBarOption([
      { name: '规则引擎检出', value: 128 },
      { name: 'KNN 行为离群', value: 74 },
      { name: 'LSTM 时序偏离', value: 51 },
      { name: '人工复核确认', value: 39 }
    ]), ['中部', '异常行为'], '规则、KNN 和 LSTM 模型检出结果及人工确认量。', 420),
    chart('security-behavior-baseline', '行为基线偏离趋势', lineAreaOption(days, [
      { name: '访问频率偏离', data: [18, 22, 25, 33, 29, 37, 34] },
      { name: '敏感操作偏离', data: [6, 8, 11, 15, 13, 18, 16] },
      { name: '模型确认事件', data: [4, 6, 8, 10, 9, 13, 12] }
    ]), ['中部', '异常行为'], '用户访问和敏感操作相对历史基线的偏离变化。', 360),
    {
      kind: 'signals',
      code: 'security-events',
      title: '安全事件流',
      description: '防火墙、入侵检测、漏洞和处置状态滚动呈现。',
      tags: ['右侧', '事件'],
      colSpan: 4,
      minHeight: 360,
      items: [
        signal('防火墙', '异常外联连续命中', '边界策略已记录高频外联行为。', '19:12:08', 'warning'),
        signal('入侵检测', '横向扫描特征持续出现', '入侵检测已触发多次扫描拦截。', '19:18:26', 'danger'),
        signal('漏洞', '高危漏洞进入修复队列', '受影响资产已同步到漏洞清单。', '19:24:41', 'warning'),
        signal('处置', '高危访问策略收敛完成', '相关源站点已下发阻断策略。', '19:31:05', 'success'),
        signal('零信任', '境外账号风险评分升高', '地理位置与访问时段同时偏离基线。', '19:34:16', 'danger'),
        signal('认证', '二次认证挑战校验通过', '高风险访问完成增强认证。', '19:36:42', 'success'),
        signal('审计', '非工作时段文件导出', '导出对象包含敏感业务文档。', '19:38:27', 'warning'),
        signal('终端', '未授权设备接入被拒绝', '设备指纹未命中可信终端清单。', '19:40:03', 'success'),
        signal('策略', '访问控制策略完成下发', '策略已同步至 24 个边界节点。', '19:42:11', 'success'),
        signal('行为分析', '应用访问频率异常离群', 'KNN 模型判定偏离常态区间。', '19:44:35', 'warning')
      ]
    }
  ];
}

function buildBusinessSections(): SituationSection[] {
  return [
    chart('business-flow', '密信、签阅与数字信封流转', sankeyOption(
      ['消息接收', '文件传输', '密信服务', '数字信封加密', '签阅待办', '已签', '归档', '离线积压'],
      [
        { source: '消息接收', target: '密信服务', value: 78 }, { source: '文件传输', target: '密信服务', value: 44 },
        { source: '密信服务', target: '数字信封加密', value: 102 }, { source: '数字信封加密', target: '签阅待办', value: 86 },
        { source: '签阅待办', target: '已签', value: 68 }, { source: '签阅待办', target: '离线积压', value: 18 },
        { source: '已签', target: '归档', value: 63 }
      ]
    ), ['中部', '图表', '流程'], '密信收发、数字信封加密和签阅归档全过程。', 420),
    chart('business-message-trend', '密信业务量趋势', lineAreaOption(days, [
      { name: '密信收发量', data: [96, 102, 108, 116, 121, 126, 132] },
      { name: '已签收', data: [88, 94, 99, 106, 110, 116, 121] }
    ]), ['左侧', '图表', '密信'], '密信业务量变化。', 360),
    chart('business-success-ring', '密信/签阅成功率', ringOption('业务成功率', [
      { name: '密信成功', value: 97 },
      { name: '签阅成功', value: 94 },
      { name: '待确认', value: 6 }
    ]), ['左侧', '图表', '成功率'], '密信和签阅成功率结构。'),
    chart('business-sign-trend', '签阅处理趋势', lineAreaOption(days, [
      { name: '签阅待办', data: [20, 24, 28, 30, 29, 31, 33] },
      { name: '已办结', data: [16, 18, 22, 23, 24, 26, 27] }
    ]), ['左侧', '图表', '签阅'], '签阅业务流转趋势。', 360),
    chart('business-volume', '业务处理总量趋势', lineAreaOption(days, [
      { name: '业务处理量', data: [118, 126, 132, 140, 136, 145, 152] },
      { name: '完成处理', data: [110, 118, 125, 133, 130, 137, 144] }
    ]), ['中部', '图表', '趋势'], '终端密信与签阅处理总量走势。', 360),
    chart('business-latency', '链路时延排行', horizontalBarOption([
      { name: '签阅服务', value: 420 },
      { name: '密信服务', value: 260 },
      { name: '统一网关', value: 148 },
      { name: '业务数据库', value: 95 },
      { name: '签收接口', value: 72 }
    ]), ['右侧', '图表', '时延'], '业务链路时延对比。', 340),
    chart('business-queue-funnel', '积压队列处置情况', funnelOption([
      { name: '待处理', value: 54 },
      { name: '处理中', value: 31 },
      { name: '已清理', value: 18 },
      { name: '已恢复', value: 12 }
    ]), ['右侧', '图表', '队列'], '业务积压队列处理进度。'),
    chart('business-stack', '终端密信与签阅分布', stackedBarOption(['密信终端', '签阅终端', '网关', '数据库'], [
      { name: '在线', data: [38, 24, 18, 20] },
      { name: '关注', data: [6, 5, 4, 7] },
      { name: '待处理', data: [2, 3, 1, 4] }
    ]), ['右侧', '图表', '分布'], '业务对象状态分布。', 340),
    chart('business-sign-flow', '签阅流程与状态分布', sankeyOption(
      ['文件发起', '待签收', '部门会签', '领导签批', '补正退回', '办结归档', '超时催办'],
      [
        { source: '文件发起', target: '待签收', value: 86 }, { source: '待签收', target: '部门会签', value: 74 },
        { source: '部门会签', target: '领导签批', value: 58 }, { source: '部门会签', target: '补正退回', value: 9 },
        { source: '领导签批', target: '办结归档', value: 49 }, { source: '领导签批', target: '超时催办', value: 7 }
      ]
    ), ['中部', '签阅'], '覆盖文件发起、会签、签批、补正和催办的签阅流程。', 420),
    chart('business-sign-stay', '签阅节点平均停留时长', horizontalBarOption([
      { name: '领导签批', value: 186 },
      { name: '部门会签', value: 142 },
      { name: '待签收', value: 68 },
      { name: '补正退回', value: 47 },
      { name: '办结归档', value: 23 }
    ]), ['中部', '签阅'], '单位：分钟，识别签阅流程中的积压与超时节点。', 360),
    chart('business-envelope-flow', '数字信封加解密链路', sankeyOption(
      ['业务文件', 'PIN 校验', '证书交换', '一次一密', '加密封装', '解密校验', '安全归档', '失败重试'],
      [
        { source: '业务文件', target: 'PIN 校验', value: 1286 }, { source: 'PIN 校验', target: '证书交换', value: 1268 },
        { source: '证书交换', target: '一次一密', value: 1259 }, { source: '一次一密', target: '加密封装', value: 1254 },
        { source: '加密封装', target: '解密校验', value: 1237 }, { source: '解密校验', target: '安全归档', value: 1229 },
        { source: 'PIN 校验', target: '失败重试', value: 18 }, { source: '解密校验', target: '失败重试', value: 8 }
      ]
    ), ['中部', '数字信封'], '展示 PIN 校验、证书交换、一次一密和加解密校验链路。', 420),
    chart('business-envelope-metrics', '加解密与证书状态', stackedBarOption(['加密次数', '解密次数', '一次一密', 'PIN 校验', '证书交换'], [
      { name: '成功', data: [1254, 1237, 1254, 1268, 1259] },
      { name: '失败', data: [7, 8, 0, 18, 4] },
      { name: '待复核', data: [2, 3, 0, 0, 1] }
    ]), ['中部', '数字信封'], '按关键加密环节展示成功、失败和待复核数据。', 360),
    {
      kind: 'signals',
      code: 'business-events',
      title: '业务事件流',
      description: '密信、签阅、网关和数据库事件滚动呈现。',
      tags: ['右侧', '事件'],
      colSpan: 4,
      minHeight: 340,
      items: [
        signal('密信', '密信发送量保持高位', '夜间批量发送带来短时上升。', '21:05:24', 'success'),
        signal('签阅', '签阅待办在高峰段集中', '签阅处理量进入集中流转阶段。', '21:02:17', 'warning'),
        signal('网关', '统一网关入口成功率稳定', '流转路径保持顺畅。', '20:58:44', 'success'),
        signal('数据库', '写入队列短时升高', '写入压力仍在可控范围。', '20:55:32', 'warning'),
        signal('数字信封', '批量加密任务执行完成', '共处理 1,286 个业务文件。', '20:52:18', 'success'),
        signal('证书', '加密证书进入轮换窗口', '3 张业务证书将在 7 日内到期。', '20:49:36', 'warning'),
        signal('签阅', '重点文件完成四级流转', '文件已完成签批并进入归档。', '20:46:12', 'success'),
        signal('密信', '离线消息积压持续下降', '扩容节点已接管 35% 消费流量。', '20:43:27', 'success'),
        signal('文件', 'OFD 文件传输量明显上升', '当前增幅符合批量下发计划。', '20:40:08', 'info'),
        signal('通联', '迪拜保障组收发量进入峰值', '当前链路时延 186 毫秒。', '20:37:45', 'warning')
      ]
    }
  ];
}

function buildTerminalSections(): SituationSection[] {
  const nodes = [
    sceneNode('terminal-center', '终端保障中枢', 'domain', 'success', 46, 50, '终端资产、人员归属、异常事件统一呈现', '在线', '131 台'),
    sceneNode('terminal-online', '在线终端', 'terminal', 'success', 18, 24, '当前在线并持续上报状态', '在线率', '91%'),
    sceneNode('terminal-risk', '高风险终端', 'alert', 'warning', 18, 76, '策略异常、模块异常、行为异常', '关注', '6 台'),
    sceneNode('terminal-owner', '人员归属', 'person', 'warning', 72, 24, '终端与责任人员关联情况', '确认率', '93%'),
    sceneNode('terminal-mobile', '移动终端', 'mobile', 'success', 72, 76, '移动侧接入与使用状态', '活跃', '48 台'),
    sceneNode('terminal-policy', '终端策略', 'policy', 'success', 88, 50, '终端侧策略命中与处置执行', '命中率', '96%')
  ];

  const links: VisualLink[] = [
    { from: 'terminal-online', to: 'terminal-center', tone: 'success' },
    { from: 'terminal-risk', to: 'terminal-center', tone: 'warning' },
    { from: 'terminal-center', to: 'terminal-owner', tone: 'warning' },
    { from: 'terminal-center', to: 'terminal-mobile', tone: 'success' },
    { from: 'terminal-center', to: 'terminal-policy', tone: 'success' }
  ];

  return [
    chart('terminal-scene', '终端接入与保障拓扑', terminalTopologyOption(), ['主视觉', '中部', '终端接入'], '终端、人员、USB Key、策略与异常事件关系。', 420),
    chart('terminal-online-trend', '近七日终端在线趋势', lineAreaOption(days, [
      { name: '在线终端', data: [122, 126, 128, 131, 130, 132, 131] },
      { name: '活跃终端', data: [108, 112, 115, 119, 121, 120, 122] }
    ]), ['中部', '图表', '趋势'], '终端在线与活跃走势。', 360),
    chart('terminal-risk-ring', '终端风险分布', ringOption('关注终端', [
      { name: '策略异常', value: 6 },
      { name: '模块异常', value: 4 },
      { name: '软件变更', value: 11 },
      { name: '长期离线', value: 5 }
    ]), ['左侧', '图表', '风险'], '终端风险类型分布。'),
    chart('terminal-owner-stack', '终端归属分布', stackedBarOption(['研发', '运维', '业务', '管理'], [
      { name: '固定终端', data: [32, 24, 28, 12] },
      { name: '移动终端', data: [16, 10, 15, 7] },
      { name: '共享终端', data: [4, 6, 5, 2] }
    ]), ['左侧', '图表', '归属'], '按组织角色展示终端归属。'),
    chart('terminal-alert-funnel', '终端异常处置漏斗', funnelOption([
      { name: '异常事件', value: 18 },
      { name: '研判确认', value: 12 },
      { name: '策略处置', value: 9 },
      { name: '完成闭环', value: 7 }
    ]), ['右侧', '图表', '处置'], '终端异常事件处置进度。'),
    chart('terminal-category', '终端异常分类统计', horizontalBarOption([
      { name: '软件变更', value: 11 },
      { name: '策略异常', value: 6 },
      { name: '模块异常', value: 4 },
      { name: '离线超时', value: 5 },
      { name: '外设接入', value: 3 }
    ]), ['中部', '图表', '分类'], '终端异常类型排行。', 360),
    chart('terminal-pad-health', '签批 PAD 设备健康', radarOption([
      { name: 'CPU 余量', max: 100 }, { name: '内存余量', max: 100 }, { name: '存储余量', max: 100 },
      { name: '电量健康', max: 100 }, { name: '补丁合规', max: 100 }, { name: '版本一致', max: 100 }
    ], [74, 68, 71, 89, 82, 91], '签批 PAD 健康度'), ['中部', '签批 PAD'], '签批 PAD 的资源、电量、补丁和版本综合健康评分。', 420),
    chart('terminal-pad-version', '签批 PAD 版本与补丁覆盖', stackedBarOption(['Android 13', 'Android 12', 'HarmonyOS', '待升级'], [
      { name: '已安装最新补丁', data: [42, 18, 9, 0] },
      { name: '补丁滞后', data: [3, 7, 2, 6] },
      { name: '版本受限', data: [0, 2, 1, 4] }
    ]), ['中部', '签批 PAD'], '统计签批 PAD 的版本、补丁和待升级设备情况。', 360),
    chart('terminal-usb-auth', 'USB Key 认证与插拔状态', lineAreaOption(days, [
      { name: '认证成功', data: [418, 432, 447, 463, 451, 479, 486] },
      { name: 'PIN 失败', data: [6, 8, 5, 12, 9, 18, 11] },
      { name: '异常拔出', data: [2, 3, 2, 4, 3, 5, 3] }
    ]), ['中部', 'USB Key'], 'USB Key 的认证成功、PIN 错误和异常插拔变化。', 420),
    chart('terminal-usb-reason', 'USB Key 失败原因排行', horizontalBarOption([
      { name: '连续 PIN 错误', value: 18 },
      { name: '证书已过期', value: 9 },
      { name: 'Key 未识别', value: 6 },
      { name: '策略校验拒绝', value: 4 },
      { name: '异常拔出', value: 3 }
    ]), ['中部', 'USB Key'], '按认证失败原因汇总风险 USB Key 事件。', 360),
    chart('terminal-communication', '终端通联关系', sankeyOption(
      ['签批 PAD', '办公终端', '境外终端', '安全接入网关', '密信服务', '签阅服务', '数字信封服务', '审计节点'],
      [
        { source: '签批 PAD', target: '安全接入网关', value: 76 }, { source: '办公终端', target: '安全接入网关', value: 118 },
        { source: '境外终端', target: '安全接入网关', value: 64 }, { source: '安全接入网关', target: '密信服务', value: 148 },
        { source: '安全接入网关', target: '签阅服务', value: 82 }, { source: '安全接入网关', target: '数字信封服务', value: 54 },
        { source: '密信服务', target: '审计节点', value: 148 }, { source: '签阅服务', target: '审计节点', value: 82 }
      ]
    ), ['中部', '通联'], '展示终端接入、业务服务和审计节点之间的活跃通联。', 420),
    chart('terminal-network-quality', '通联链路质量趋势', lineAreaOption(days, [
      { name: '平均时延(ms)', data: [82, 76, 88, 94, 86, 112, 91] },
      { name: '丢包率(‰)', data: [2, 1, 2, 3, 2, 5, 2] },
      { name: '关系变更告警', data: [3, 2, 4, 5, 3, 7, 4] }
    ]), ['中部', '通联'], '以时延、丢包率和关系变更告警衡量链路质量。', 360),
    {
      kind: 'signals',
      code: 'terminal-events',
      title: '终端事件流',
      description: '重点终端事件滚动呈现。',
      tags: ['右侧', '事件'],
      colSpan: 4,
      minHeight: 340,
      items: [
        signal('签批 PAD', '签批 PAD 电量低于保障阈值', '2 台设备已通知责任人接入充电和巡检。', '20:24:51', 'warning'),
        signal('USB Key', '连续三次 PIN 校验失败', '已触发风险认证告警并限制后续尝试。', '20:22:36', 'danger'),
        signal('终端接入', '境外终端完成二次认证', '迪拜区域 6 台终端已恢复受控业务访问。', '20:20:12', 'success'),
        signal('通联', '签阅服务链路时延短时抬升', '当前平均时延 112ms，已进入关注阈值。', '20:18:43', 'warning'),
        signal('变更', '终端软件版本发生变化', '软件变更数量高于常态区间，待人工确认。', '20:16:24', 'warning'),
        signal('策略', '外设接入控制策略完成下发', '策略已同步至 131 台纳管终端。', '20:14:08', 'success'),
        signal('签批 PAD', '补丁覆盖率达到 92%', '本轮补丁窗口还剩 6 台待升级设备。', '20:12:03', 'info'),
        signal('USB Key', '证书有效期进入 7 日预警', '9 个 USB Key 证书已纳入轮换清单。', '20:10:16', 'warning'),
        signal('终端接入', '长期未使用终端进入巡检队列', '4 台设备已超过 30 天无业务会话。', '20:08:11', 'warning'),
        signal('稳定', '移动终端活跃率保持稳定', '移动侧接入状态正常，在线率维持 94.8%。', '20:05:42', 'success')
      ]
    },
    {
      kind: 'miniTrendGroup',
      code: 'terminal-mini-trends',
      title: '终端保障摘要',
      description: '关键终端指标。',
      tags: ['底部', '指标'],
      colSpan: 4,
      minHeight: 250,
      items: [
        trend('online', '在线终端', '131 台', 91, 'success', '较昨日 +2'),
        trend('risk', '高风险终端', '6 台', 42, 'warning', '持续处置'),
        trend('owner', '归属确认率', '93%', 93, 'success', '稳步提升'),
        trend('events', '异常事件', '18 条', 58, 'warning', '处置中 5 条')
      ]
    }
  ];
}

const PAGES: Record<SituationPageCode, SituationPage> = {
  overview: {
    code: 'overview',
    name: '综合态势',
    title: '综合态势',
    subtitle: '全局态势、风险链路与处置闭环',
    location: '综合态势中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '首屏集中展示整体状态、重点风险和跨主题联动情况。',
    heroTags: [
      { label: '三域汇聚数据', value: '76 条', tone: 'info' },
      { label: '内网实体数', value: '651 个', tone: 'success' },
      { label: '综合安全指数', value: '86%', tone: 'success' },
      { label: '在线资产率', value: '71%', tone: 'warning' }
    ],
    actions: [
      { label: '重点', detail: '优先关注跨域复合风险和高峰时段业务链路。', tone: 'warning' },
      { label: '处置', detail: '围绕终端、账号、业务链路推进闭环。', tone: 'info' }
    ],
    kpis: [
      kpi('四域汇聚事件', '128', '安全、业务、终端、运维数据汇聚量', 'info', '万', '+8%'),
      kpi('内网实体数', '651', '当前纳管组织、账号、终端与设备', 'success', '个', '+12'),
      kpi('综合安全指数', '86', '全局安全态势评分', 'success', '%', '+3'),
      kpi('在线资产率', '71', '在线资产占总资产比例', 'warning', '%', '持平'),
      kpi('待处置告警', '47', '进入研判队列的事件', 'warning', '件', '-2'),
      kpi('今日新增运维告警', '21', '运维侧新增告警数量', 'info', '件', '+4'),
      kpi('业务流转成功率', '99.6', '密信、签阅和数字信封综合成功率', 'success', '%', '+0.3'),
      kpi('终端在线率', '94.8', '全球纳管终端在线比例', 'success', '%', '+1.2')
    ],
    highlights: [
      highlight('复合风险', '终端、账号、导出行为形成清晰风险链。', '高危', '建议从综合中枢下钻研判', 'danger'),
      highlight('资源态势稳定', '在线主机数量和来源健康度整体稳定。', '168 台在线', '保障能力维持高位', 'success'),
      highlight('关键服务', '密信、签阅、认证和审计服务总体稳定。', '99.6%', '核心业务成功率', 'success'),
      highlight('区域终端', '境外终端按国家聚合，德国区域需重点关注。', '260 台', '点击地图进入区域终端态势', 'warning')
    ],
    sections: buildOverviewSections()
  },
  security: {
    code: 'security',
    name: '安全态势',
    title: '安全态势',
    subtitle: '攻击面、风险链路与处置闭环',
    location: '安全保密中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '通过拓扑、趋势和漏斗展示风险发现、研判和处置全过程。',
    heroTags: [
      { label: '高危告警', value: '4 起', tone: 'danger' },
      { label: '策略命中率', value: '96.8%', tone: 'success' },
      { label: '异常账号', value: '6 个', tone: 'warning' },
      { label: '闭环率', value: '85%', tone: 'success' }
    ],
    actions: [
      { label: '重点', detail: '优先关注敏感数据导出与异常账号交叉信号。', tone: 'danger' },
      { label: '处置', detail: '从账号复核、终端隔离、审批链路审计推进。', tone: 'warning' }
    ],
    kpis: [
      kpi('高危告警', '4', '高危安全事件数量', 'danger', '起', '+1'),
      kpi('策略命中率', '96.8', '边界与终端策略命中', 'success', '%', '+0.4'),
      kpi('异常账号', '6', '需复核账号数量', 'warning', '个', '持平'),
      kpi('高风险终端', '6', '需联动处置设备', 'warning', '台', '+2'),
      kpi('敏感导出', '2', '异常导出次数', 'danger', '次', '持平'),
      kpi('闭环率', '85', '安全处置闭环率', 'success', '%', '+3'),
      kpi('高风险用户', '12', '零信任高风险用户数量', 'warning', '人', '-2'),
      kpi('行为模型检出率', '94.6', '规则、KNN、LSTM 综合检出率', 'success', '%', '+1.4')
    ],
    highlights: [
      highlight('敏感导出行为', '异常导出叠加账号与终端风险，是当前优先处置链路。', '优先级高', '建议下钻数据对象节点', 'danger')
    ],
    sections: buildSecuritySections()
  },
  business: {
    code: 'business',
    name: '业务态势',
    title: '业务态势',
    subtitle: '服务依赖、链路健康与恢复保障',
    location: '业务运行中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '围绕核心业务拓扑、服务等级与依赖关系组织首屏。',
    heroTags: [
      { label: '业务量', value: '132 万', tone: 'success' },
      { label: '成功率', value: '99.3%', tone: 'success' },
      { label: '高峰时延', value: '420 毫秒', tone: 'warning' },
      { label: '积压队列', value: '12 个', tone: 'warning' }
    ],
    actions: [
      { label: '重点', detail: '签批服务与数据库写入是当前排查重点。', tone: 'warning' },
      { label: '保障', detail: '从链路依赖、资源容量和恢复能力联动观察。', tone: 'info' }
    ],
    kpis: [
      kpi('业务量', '132', '核心业务处理总量', 'success', '万', '+6%'),
      kpi('成功率', '99.3', '核心业务成功率', 'success', '%', '+0.2'),
      kpi('高峰时延', '420', '签批链路高峰响应时间', 'warning', '毫秒', '+35'),
      kpi('积压队列', '12', '数据库写入积压', 'warning', '个', '+2'),
      kpi('链路告警', '5', '当前业务相关告警', 'warning', '条', '-1'),
      kpi('保障建议', '3', '系统生成处置建议', 'info', '项', '新增'),
      kpi('文件传输量', '8.6', '当日 OFD、图片、文档和压缩包传输量', 'info', 'TB', '+12%'),
      kpi('加解密成功率', '99.8', '数字信封加解密综合成功率', 'success', '%', '+0.1')
    ],
    highlights: [
      highlight('签批链路', '签批链路在高峰期的压力最值得重点观察。', '420 毫秒', '建议下钻服务拓扑', 'warning')
    ],
    sections: buildBusinessSections()
  },
  terminal: {
    code: 'terminal',
    name: '终端态势',
    title: '终端态势',
    subtitle: '终端资产、人员关联与保障状态',
    location: '终端保障中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '集中呈现终端在线、风险分布、人员归属和异常处置进展。',
    heroTags: [
      { label: '在线终端', value: '131 台', tone: 'success' },
      { label: '高风险终端', value: '6 台', tone: 'warning' },
      { label: '归属确认率', value: '93%', tone: 'success' },
      { label: '异常事件', value: '18 条', tone: 'warning' }
    ],
    actions: [
      { label: '重点', detail: '关注高风险终端、模块异常和软件变更。', tone: 'warning' },
      { label: '保障', detail: '围绕人员归属、策略命中和异常闭环持续治理。', tone: 'info' }
    ],
    kpis: [
      kpi('在线终端', '131', '终端在线数量', 'success', '台', '+2'),
      kpi('高风险终端', '6', '重点处置终端', 'warning', '台', '持平'),
      kpi('归属确认率', '93', '终端与责任人员确认比例', 'success', '%', '+1'),
      kpi('移动终端', '48', '移动侧活跃终端', 'success', '台', '+3'),
      kpi('异常事件', '18', '终端相关异常事件', 'warning', '条', '-2'),
      kpi('策略命中率', '96', '终端策略命中比例', 'success', '%', '+2')
    ],
    highlights: [
      highlight('终端风险分布', '策略异常、模块异常和软件变更是当前主要关注项。', '26 项', '建议结合终端拓扑下钻查看', 'warning')
    ],
    sections: buildTerminalSections()
  }
};

export async function getMockSituationPage(pageCode: SituationPageCode) {
  const page = PAGES[pageCode];
  if (!page) {
    throw new Error(`未找到 ${pageCode} 的态势页面数据。`);
  }

  return structuredClone(page);
}
