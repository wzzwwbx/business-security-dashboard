import type {
  SituationCardItem,
  SituationHighlight,
  SituationMatrixItem,
  SituationPage,
  SituationPageCode,
  SituationSignalItem,
  SituationSourceItem,
  SituationTableRow,
  SituationTimelineItem,
  SituationTone
} from '@/types/situation';

const colors = {
  cyan: '#2de2e6',
  blue: '#1e88ff',
  green: '#3ddc97',
  orange: '#ffb547',
  red: '#ff6b7d'
};

const textStyle = { color: '#d9e8ff' };
const axisLine = { lineStyle: { color: 'rgba(91,151,255,0.18)' } };
const splitLine = { lineStyle: { color: 'rgba(91,151,255,0.12)' } };

const lineOption = (
  legend: string[],
  xAxis: string[],
  series: Array<{ name: string; color: string; data: number[] }>
) => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 8, textStyle },
  grid: { left: 18, right: 18, top: 48, bottom: 20, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, axisLine, axisLabel: textStyle, data: xAxis },
  yAxis: { type: 'value', axisLine, axisLabel: textStyle, splitLine },
  series: series.map((item) => ({
    name: item.name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 3, color: item.color },
    areaStyle: { color: `${item.color}22` },
    data: item.data
  }))
});

const barOption = (
  legend: string[],
  xAxis: string[],
  series: Array<{ name: string; color: string; data: number[] }>
) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { top: 8, textStyle },
  grid: { left: 18, right: 18, top: 48, bottom: 20, containLabel: true },
  xAxis: { type: 'category', axisLine, axisLabel: textStyle, data: xAxis },
  yAxis: { type: 'value', axisLine, axisLabel: textStyle, splitLine },
  series: series.map((item) => ({
    name: item.name,
    type: 'bar',
    barMaxWidth: 18,
    itemStyle: { color: item.color, borderRadius: [8, 8, 0, 0] },
    data: item.data
  }))
});

const donutOption = (items: Array<{ name: string; value: number; color: string }>) => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle },
  series: [
    {
      type: 'pie',
      radius: ['56%', '76%'],
      center: ['50%', '44%'],
      label: { color: '#d9e8ff', formatter: '{b}\n{d}%' },
      itemStyle: { borderColor: '#091425', borderWidth: 4 },
      data: items.map((item) => ({ ...item, itemStyle: { color: item.color } }))
    }
  ]
});

const radarOption = (indicators: Array<{ name: string; max: number }>, values: number[]) => ({
  tooltip: {},
  radar: {
    indicator: indicators,
    radius: '66%',
    splitArea: { show: true, areaStyle: { color: ['rgba(14,29,49,0.68)', 'rgba(18,40,66,0.38)'] } }
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: values,
          name: '当前态势',
          areaStyle: { color: 'rgba(45,226,230,0.16)' },
          lineStyle: { color: colors.cyan },
          itemStyle: { color: colors.cyan }
        }
      ]
    }
  ]
});

const highlight = (
  title: string,
  description: string,
  metric: string,
  meta: string,
  tone: SituationTone
): SituationHighlight => ({ title, description, metric, meta, tone });

const matrixItem = (
  name: string,
  owner: string,
  score: string,
  status: string,
  trend: string,
  source: string,
  description: string,
  tone: SituationTone
): SituationMatrixItem => ({ name, owner, score, status, trend, source, description, tone });

const signal = (
  label: string,
  title: string,
  description: string,
  meta: string,
  tone: SituationTone
): SituationSignalItem => ({ label, title, description, meta, tone });

const source = (
  name: string,
  status: string,
  latency: string,
  coverage: string,
  note: string,
  tone: SituationTone
): SituationSourceItem => ({ source: name, status, latency, coverage, note, tone });

const card = (
  name: string,
  summary: string,
  metric: string,
  detail: string,
  tone: SituationTone,
  progress?: number
): SituationCardItem => ({ name, summary, metric, detail, tone, progress });

const row = (cells: Record<string, string>, tones?: Record<string, SituationTone>): SituationTableRow => ({ cells, tones });

const timeline = (
  time: string,
  title: string,
  description: string,
  actor: string,
  tone: SituationTone
): SituationTimelineItem => ({ time, title, description, actor, tone });

const pages: Record<SituationPageCode, SituationPage> = {
  overview: {
    code: 'overview',
    name: '态势总览',
    title: '综合态势总览',
    subtitle: 'cross-domain command view',
    location: '后台服务中心机房 · 综合态势驾驶舱',
    lastUpdated: '2026-07-07 19:18',
    dataMode: 'mock',
    summary:
      '在真实运维态势已联调的基础上，综合态势先按多源规划模型组织前端页面，聚合终端、安全、业务与运维四大主题，为后续接入外部系统保留明确的卡位与交互骨架。',
    heroTags: [
      { label: '综合健康度', value: '89/100', tone: 'success' },
      { label: '高优先级事项', value: '7 项', tone: 'warning' },
      { label: '已接入来源', value: '6 / 9', tone: 'info' },
      { label: '联动闭环率', value: '91.6%', tone: 'success' }
    ],
    actions: [
      { label: '本轮重点', detail: '保持业务链路稳定，同时将高危终端与高风险账号的联动处置压缩到 15 分钟内。', tone: 'warning' },
      { label: '数据提示', detail: '综合、安全、业务、终端页当前使用经验数据模型；运维页继续走真实 /api/ops 接口。', tone: 'info' },
      { label: '建设建议', detail: '优先确认 CMDB、终端管理、零信任与业务日志中心的接入契约，逐步替换 mock 数据源。', tone: 'success' }
    ],
    kpis: [
      { label: '在线终端', value: '131', unit: '台', trend: '+3', description: '终端在线率 93.6%', tone: 'success' },
      { label: '关键业务成功率', value: '99.24', unit: '%', trend: '+0.3%', description: '密信 / 电报 / 签批核心链路', tone: 'success' },
      { label: '高危安全事件', value: '4', unit: '件', trend: '-1', description: '高危处置窗口控制在 30 分钟内', tone: 'warning' },
      { label: '综合风险评分', value: '62', unit: '/100', trend: '-5', description: '零信任与数据泄露风险略有回落', tone: 'warning' },
      { label: '运维告警', value: '5', unit: '条', trend: '+2', description: '以资源水位和链路抖动为主', tone: 'info' },
      { label: '来源就绪度', value: '66', unit: '%', trend: '+9%', description: 'Probe 已实装，其余系统等待接口确认', tone: 'info' }
    ],
    highlights: [
      highlight('终端态势', '在线终端总体平稳，但 9 台离线设备中有 3 台位于境外保障链路。', '93.6%', '资产在线率', 'success'),
      highlight('业务态势', '高峰期签批与密信流量抬升，消息积压仍保持在阈值内。', '12.8 万', '日电文 / 消息量', 'info'),
      highlight('安全态势', '异常登录与深夜导出仍是主要告警类型，需要强化账户与行为联动。', '18 件', '24h 安全事件', 'warning'),
      highlight('运维态势', '采集与分析节点整体稳定，但采集服务器 CPU 在晚高峰接近扩容阈值。', '78%', '采集节点峰值 CPU', 'warning')
    ],
    sections: [
      {
        kind: 'matrix',
        code: 'overview-domain-matrix',
        title: '主题域健康矩阵',
        description: '同一驾驶舱下的四类主题态势与当前来源可信度。',
        tags: ['综合', '域健康'],
        colSpan: 7,
        items: [
          matrixItem('终端域', '终端运维组', '93/100', '在线稳定', '在线率 +1.2%', 'MDM / USB Key / 位置服务', '关注离线境外终端与补丁滞后设备。', 'success'),
          matrixItem('业务域', '业务运行组', '90/100', '业务平稳', '成功率 +0.3%', '业务日志 / 网关 / 应用指标', '核心业务链路可用，但签批晚高峰时延仍需优化。', 'info'),
          matrixItem('安全域', '安全保密组', '76/100', '持续关注', '高危告警 -1', '零信任 / 行为分析 / 审计日志', '异常行为告警仍需缩短人工研判耗时。', 'warning'),
          matrixItem('运维域', '平台运维组', '88/100', '可控', '资源告警 +2', 'Java Probe / Manual / External', '真实接入已建立，建议继续扩展来源绑定。', 'info')
        ]
      },
      {
        kind: 'sources',
        code: 'overview-sources',
        title: '来源接入概览',
        description: '明确哪些域已经进入真实接口，哪些仍处于设计占位阶段。',
        tags: ['多源', '接入'],
        colSpan: 5,
        items: [
          source('Probe / Ops', '真实联调', '< 60 秒', '主机 / 网卡 / TopN 进程', '已接到 /api/ops/ingest/probe，并在运维态势页呈现。', 'success'),
          source('CMDB / 资产系统', '待确认协议', 'N/A', '主机 / 终端 / 组织映射', '建议优先提供 externalAssetId 与组织树映射。', 'warning'),
          source('零信任平台', '接口待定', 'N/A', '策略命中 / 身份风险 / 自主处置', '可先统一归一为安全态势的告警与行为信号。', 'warning'),
          source('业务日志中心', '可通过 manual 占位', '5 分钟内', '消息量 / 成功率 / 时延 / 积压', '当前前端已预留业务域趋势与 SLA 版块。', 'info')
        ]
      },
      {
        kind: 'chart',
        code: 'overview-trend',
        title: '跨域关键指标趋势',
        description: '展示终端在线、业务吞吐与安全告警在同一观察窗口下的关系。',
        tags: ['趋势', '联动'],
        colSpan: 7,
        option: lineOption(
          ['在线终端', '业务吞吐指数', '安全告警'],
          ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
          [
            { name: '在线终端', color: colors.green, data: [126, 127, 129, 130, 131, 130, 132, 131] },
            { name: '业务吞吐指数', color: colors.blue, data: [72, 76, 81, 79, 85, 88, 90, 87] },
            { name: '安全告警', color: colors.orange, data: [3, 4, 6, 5, 7, 6, 5, 4] }
          ]
        ),
        footer: '业务吞吐指数采用归一化展示，后续可替换为真实消息量 / 请求数 / 成功率多轴联动图。'
      },
      {
        kind: 'signals',
        code: 'overview-signals',
        title: '跨域重点信号',
        description: '把当前真正值得指挥席关注的事项集中列出。',
        tags: ['重点事项'],
        colSpan: 5,
        items: [
          signal('高优先级', '终端 T-089 与账号 U-0812 形成复合风险', '终端发生 PIN 错误锁定后，同账号在业务系统出现异常访问路径，应联动账户与终端处置。', '零信任 + 终端联动 · 置信度高', 'danger'),
          signal('容量关注', '采集节点晚高峰 CPU 峰值达到 78%', '运维态势已发出扩容建议，若业务与安全来源同步扩大，需提前准备水平扩展。', 'Ops 实时数据', 'warning'),
          signal('建设缺口', 'CMDB 与业务日志中心尚未明确契约', '建议先完成 externalAssetId 与 serviceCode 的数据标准化，减少后续页面重构。', '工程规划', 'info')
        ]
      },
      {
        kind: 'table',
        code: 'overview-watchlist',
        title: '联动观察清单',
        description: '面向综合驾驶舱的一张任务清单，而非纯告警流水。',
        tags: ['观察清单'],
        colSpan: 7,
        columns: [
          { key: 'domain', label: '主题域' },
          { key: 'object', label: '对象' },
          { key: 'signal', label: '观测信号' },
          { key: 'owner', label: '责任团队' },
          { key: 'status', label: '状态', tone: true }
        ],
        rows: [
          row({ domain: '终端', object: 'T-089 / U-0812', signal: '终端锁定 + 异常访问', owner: '终端运维 / 安全', status: '联动处置中' }, { status: 'danger' }),
          row({ domain: '业务', object: '签批服务', signal: '高峰时延抬升至 420ms', owner: '业务运行组', status: '持续观察' }, { status: 'warning' }),
          row({ domain: '运维', object: '采集节点', signal: 'CPU 峰值 78%', owner: '平台运维组', status: '已出扩容建议' }, { status: 'info' }),
          row({ domain: '安全', object: '数据导出行为', signal: '深夜高频导出模式', owner: '安全保密组', status: '规则已升级' }, { status: 'success' })
        ]
      },
      {
        kind: 'timeline',
        code: 'overview-timeline',
        title: '近 2 小时协同闭环时间线',
        description: '综合态势需要看“事件如何流转”，而不仅是事件本身。',
        tags: ['闭环'],
        colSpan: 5,
        items: [
          timeline('19:12', '更新综合风险评分', '结合业务链路、终端在线与高危告警重新计算综合态势评分 62。', '综合分析引擎', 'info'),
          timeline('18:56', '生成终端与账户复合告警', '终端 T-089 与账号 U-0812 的多维风险信号被统一聚合。', '安全保密组', 'danger'),
          timeline('18:34', '运维域生成资源扩容建议', '采集节点 CPU 达到阈值，建议将工作线程扩容 2 个。', '平台运维组', 'warning'),
          timeline('18:05', '签批业务自动切换备用通道', '高峰期自动分流后，业务成功率恢复到 99.2% 以上。', '业务运行组', 'success')
        ]
      }
    ]
  },
  terminal: {
    code: 'terminal',
    name: '终端态势',
    title: '终端接入与资产态势',
    subtitle: 'endpoint posture & compliance',
    location: '终端保障中心 · 设备与接入态势',
    lastUpdated: '2026-07-07 19:16',
    dataMode: 'mock',
    summary:
      '终端态势页以设备在线、补丁合规、USB Key 认证、地域分布与异常终端处置为核心，先形成可替换真实接口的前端骨架，未来可直接接入 MDM、资产平台与证书中心。',
    heroTags: [
      { label: '在线终端', value: '131 / 140', tone: 'success' },
      { label: '补丁覆盖率', value: '94.2%', tone: 'success' },
      { label: '证书临期', value: '7 台', tone: 'warning' },
      { label: '异常终端', value: '5 台', tone: 'warning' }
    ],
    actions: [
      { label: '本轮重点', detail: '优先关注境外保障点位的离线终端、证书临期设备与 USB Key 认证失败终端。', tone: 'warning' },
      { label: '数据建议', detail: '建议未来接入终端管理平台、USB Key 管理系统、位置服务与补丁管理接口。', tone: 'info' },
      { label: '展示策略', detail: '首屏聚焦资产覆盖、合规水位与异常终端列表，支持未来增加 drill-down。', tone: 'success' }
    ],
    kpis: [
      { label: '在线终端', value: '131', unit: '台', trend: '+2', description: '较昨日同期新增 2 台在线', tone: 'success' },
      { label: '离线终端', value: '9', unit: '台', trend: '-1', description: '其中 3 台位于境外保障点位', tone: 'warning' },
      { label: 'USB Key 认证通过率', value: '97.8', unit: '%', trend: '+0.6%', description: '当日认证失败 3 次', tone: 'success' },
      { label: '补丁滞后设备', value: '8', unit: '台', trend: '-2', description: '高危补丁已补齐 4 台', tone: 'warning' },
      { label: '证书临期设备', value: '7', unit: '台', trend: '+1', description: '7 天内到期设备需要轮换', tone: 'warning' },
      { label: '高风险终端', value: '2', unit: '台', trend: '持平', description: '存在复合异常行为与认证失败', tone: 'danger' }
    ],
    highlights: [
      highlight('移动终端', '移动终端在线率保持在 95% 以上，但海外点位存在偶发离线。', '42 台', '移动终端总量', 'info'),
      highlight('加固终端', '专网加固终端补丁覆盖率最高，整体风险最低。', '98.3%', '补丁覆盖率', 'success'),
      highlight('证书体系', '证书临期主要集中在境外便携设备，需要在 7 天内统一轮换。', '7 台', '待换证终端', 'warning'),
      highlight('异常终端', 'T-089 与 T-103 需要联合安全域继续跟踪。', '2 台', '高风险终端', 'danger')
    ],
    sections: [
      {
        kind: 'cards',
        code: 'terminal-region-cards',
        title: '重点区域分布',
        description: '用区域视角先看保障压力，再决定 drill-down 到单机。',
        tags: ['区域', '分布'],
        colSpan: 5,
        items: [
          card('总部园区', '主办公区设备', '58 台', '在线率 96.5%，USB Key 认证稳定。', 'success', 96),
          card('东南亚分部', '移动终端与便携设备为主', '24 台', '2 台证书临期，1 台离线时间超过 30 分钟。', 'warning', 88),
          card('西亚保障点', '短时任务终端', '11 台', '网络切换频繁，建议重点关注离线告警阈值。', 'info', 82),
          card('欧洲支撑点', '值守与签批终端', '9 台', '补丁覆盖率 100%，当前状态稳定。', 'success', 100)
        ]
      },
      {
        kind: 'chart',
        code: 'terminal-online-trend',
        title: '近 7 天终端在线与补丁趋势',
        description: '反映终端规模、在线率与合规动作之间的关系。',
        tags: ['趋势', '终端'],
        colSpan: 7,
        option: lineOption(
          ['在线终端', '补丁覆盖率'],
          ['07-01', '07-02', '07-03', '07-04', '07-05', '07-06', '07-07'],
          [
            { name: '在线终端', color: colors.green, data: [126, 127, 129, 128, 130, 129, 131] },
            { name: '补丁覆盖率', color: colors.blue, data: [90, 91, 92, 93, 93, 94, 94] }
          ]
        ),
        footer: '后续可接入 MDM 实时在线记录与补丁分发工单，支持区域 / 类型筛选。'
      },
      {
        kind: 'table',
        code: 'terminal-watch-table',
        title: '重点终端观察表',
        description: '把资产、认证、连通和风险放在一张表里，方便后续联动点击。',
        tags: ['资产', '观察'],
        colSpan: 7,
        columns: [
          { key: 'terminal', label: '终端编号' },
          { key: 'owner', label: '所属单位' },
          { key: 'type', label: '终端类型' },
          { key: 'location', label: '部署位置' },
          { key: 'usbKey', label: 'USB Key', tone: true },
          { key: 'status', label: '在线状态', tone: true }
        ],
        rows: [
          row({ terminal: 'T-003', owner: '东南亚分部', type: '移动终端', location: '泰国曼谷', usbKey: '已认证', status: '在线' }, { usbKey: 'success', status: 'success' }),
          row({ terminal: 'T-052', owner: '总部园区', type: '固定终端', location: '保密签批室', usbKey: '认证异常', status: '锁定中' }, { usbKey: 'warning', status: 'danger' }),
          row({ terminal: 'T-089', owner: '西亚保障点', type: '便携终端', location: '外场站点', usbKey: '待复核', status: '离线' }, { usbKey: 'warning', status: 'danger' }),
          row({ terminal: 'T-103', owner: '总部园区', type: '固定终端', location: '文电处理区', usbKey: '已认证', status: '在线' }, { usbKey: 'success', status: 'success' })
        ]
      },
      {
        kind: 'signals',
        code: 'terminal-signals',
        title: '异常终端信号',
        description: '面向终端运维的处置优先级排序。',
        tags: ['异常', '处置'],
        colSpan: 5,
        items: [
          signal('P1', '终端 T-089 离线且与高风险账号绑定', '终端在外场离线 32 分钟，同时关联账号在业务系统触发异常访问路径，建议远程锁定并要求人工复核。', '境外保障点 · 联动安全域', 'danger'),
          signal('P2', '终端 T-052 连续 3 次 PIN 错误', 'USB Key 认证失败后终端已进入锁定状态，建议排查是否为误操作或账号借用。', '总部园区 · 认证系统', 'warning'),
          signal('P2', '7 台设备证书将在 7 天内到期', '建议按区域安排错峰换证，避免集中换证影响业务值守。', '证书中心', 'info')
        ]
      },
      {
        kind: 'sources',
        code: 'terminal-sources',
        title: '终端域来源规划',
        description: '当前只做前端经验建模，但已把未来接入点拆清楚。',
        tags: ['规划', '来源'],
        colSpan: 6,
        items: [
          source('终端管理平台', '建议优先接入', '分钟级', '在线状态 / 设备清单 / 版本', '决定终端态势的主资产视图。', 'success'),
          source('USB Key 管理系统', '接口待定', '分钟级', '认证结果 / PIN 错误 / 证书映射', '用于终端认证与合规信号展示。', 'warning'),
          source('补丁与软件分发平台', '接口待定', '小时级', '补丁安装 / 漏洞修复 / 软件版本', '支持合规覆盖率、补丁滞后列表。', 'info')
        ]
      },
      {
        kind: 'chart',
        code: 'terminal-compliance-radar',
        title: '终端合规雷达',
        description: '从认证、补丁、在线、位置可信、数据防护五个维度评估终端域成熟度。',
        tags: ['合规', '雷达'],
        colSpan: 6,
        option: radarOption(
          [
            { name: '在线稳定', max: 100 },
            { name: '认证可信', max: 100 },
            { name: '补丁覆盖', max: 100 },
            { name: '位置可信', max: 100 },
            { name: '数据防护', max: 100 }
          ],
          [94, 97, 94, 82, 89]
        ),
        footer: '位置可信分值偏低，意味着未来建议接入更可靠的位置与网络环境判定来源。'
      }
    ]
  },
  business: {
    code: 'business',
    name: '业务态势',
    title: '业务运行与链路态势',
    subtitle: 'service throughput & mission continuity',
    location: '业务运行中心 · 核心业务驾驶舱',
    lastUpdated: '2026-07-07 19:15',
    dataMode: 'mock',
    summary:
      '业务态势页围绕密信、电报、签批、文件交换等核心业务链路组织，重点呈现吞吐、成功率、时延、积压与通道切换，先形成业务观测与指挥席结构，未来再接真实日志中心与业务网关。',
    heroTags: [
      { label: '日业务量', value: '12.8 万条', tone: 'info' },
      { label: '成功率', value: '99.24%', tone: 'success' },
      { label: '高峰延迟', value: '420 ms', tone: 'warning' },
      { label: '积压任务', value: '36 笔', tone: 'warning' }
    ],
    actions: [
      { label: '本轮重点', detail: '关注签批链路高峰期时延与电报通道切换，确保任务窗口内业务连续性。', tone: 'warning' },
      { label: '建设建议', detail: '建议未来接入业务日志中心、网关指标、消息中间件与签批流程引擎。', tone: 'info' },
      { label: '展示策略', detail: '将服务健康、吞吐趋势、积压与变更时间线放入同一页面，便于业务运行席决策。', tone: 'success' }
    ],
    kpis: [
      { label: '日电报 / 消息量', value: '12.8', unit: '万', trend: '+6.2%', description: '较昨日业务量持续提升', tone: 'info' },
      { label: '业务成功率', value: '99.24', unit: '%', trend: '+0.3%', description: '核心链路稳定在高位', tone: 'success' },
      { label: '高峰期平均延迟', value: '420', unit: 'ms', trend: '+28ms', description: '签批链路在 18:00 后抬升明显', tone: 'warning' },
      { label: '待处理积压', value: '36', unit: '笔', trend: '-4', description: '大部分来自签批与交换队列', tone: 'warning' },
      { label: '备用通道切换', value: '2', unit: '次', trend: '持平', description: '已自动切换并恢复', tone: 'info' },
      { label: '异常业务事件', value: '3', unit: '件', trend: '-1', description: '集中在时延与重试抖动', tone: 'warning' }
    ],
    highlights: [
      highlight('密信业务', '业务量稳步提升，晚高峰成功率保持在 99.4% 以上。', '8.6 万', '日密信流量', 'success'),
      highlight('电报业务', '电报保障链路发生 1 次自动切换，但恢复迅速。', '2.7 万', '日电报量', 'info'),
      highlight('签批流程', '签批高峰时延偏高，是当前最主要的业务体验问题。', '420ms', '高峰平均延迟', 'warning'),
      highlight('文件交换', '大文件交换在 18:00 后出现短时积压，需要继续观察。', '36 笔', '积压队列', 'warning')
    ],
    sections: [
      {
        kind: 'cards',
        code: 'business-service-cards',
        title: '核心业务服务健康卡',
        description: '把关键系统以服务卡片方式并列，后续可接入点击下钻。',
        tags: ['服务', '健康度'],
        colSpan: 5,
        items: [
          card('密信服务', '主通道稳定运行', '99.42%', '高峰期仍保持较高成功率。', 'success', 99),
          card('电报服务', '自动切换备用链路', '2 次', '切换后无明显丢包，建议保留观测。', 'info', 92),
          card('签批服务', '高峰时延略高', '420 ms', '应重点优化数据库查询与审批回执。', 'warning', 84),
          card('文件交换服务', '存在短时积压', '36 笔', '建议在窗口期增加并发消费者。', 'warning', 78)
        ]
      },
      {
        kind: 'chart',
        code: 'business-volume-chart',
        title: '近 24 小时业务量与成功率',
        description: '为业务运行席保留最常用的趋势观察图。',
        tags: ['趋势', '业务量'],
        colSpan: 7,
        option: lineOption(
          ['业务量', '成功率'],
          ['00', '04', '08', '10', '12', '14', '16', '18', '20'],
          [
            { name: '业务量', color: colors.blue, data: [34, 28, 56, 82, 76, 88, 94, 110, 87] },
            { name: '成功率', color: colors.green, data: [99, 99, 98, 99, 99, 99, 99, 98, 99] }
          ]
        ),
        footer: '业务量使用归一化指标。未来可拆分为消息数、审批流、文件交换量等多条曲线。'
      },
      {
        kind: 'table',
        code: 'business-sla-table',
        title: '服务 SLA 观察表',
        description: '以面向运行值守的 SLA 表替代单纯的图表堆叠。',
        tags: ['SLA'],
        colSpan: 7,
        columns: [
          { key: 'service', label: '服务' },
          { key: 'throughput', label: '当前吞吐' },
          { key: 'latency', label: '平均时延' },
          { key: 'success', label: '成功率' },
          { key: 'status', label: '状态', tone: true }
        ],
        rows: [
          row({ service: '密信服务', throughput: '4.2k/min', latency: '138ms', success: '99.42%', status: '稳定' }, { status: 'success' }),
          row({ service: '电报服务', throughput: '1.1k/min', latency: '166ms', success: '99.17%', status: '可控' }, { status: 'info' }),
          row({ service: '签批服务', throughput: '620/min', latency: '420ms', success: '98.73%', status: '关注' }, { status: 'warning' }),
          row({ service: '文件交换', throughput: '180/min', latency: '510ms', success: '97.94%', status: '排查中' }, { status: 'warning' })
        ]
      },
      {
        kind: 'signals',
        code: 'business-signals',
        title: '业务瓶颈与建议',
        description: '不是简单告警，而是面向运行值守的业务改进建议。',
        tags: ['建议', '瓶颈'],
        colSpan: 5,
        items: [
          signal('P1', '签批服务在 18:00 后数据库查询放大', '建议优先排查审批回执查询与附件预览接口，必要时对高峰时段启用只读副本。', '业务运行组', 'warning'),
          signal('P2', '文件交换服务出现短时积压', '积压队列在 18:20 达到 36 笔，建议增加消费者并检查大文件重试策略。', '交换通道', 'warning'),
          signal('P2', '备用链路切换策略表现良好', '建议将自动切换与恢复日志沉淀为业务恢复时间指标，进入综合态势。', '保障链路', 'success')
        ]
      },
      {
        kind: 'chart',
        code: 'business-service-compare',
        title: '业务类型对比',
        description: '帮助理解哪个业务类型真正消耗链路与计算资源。',
        tags: ['对比'],
        colSpan: 6,
        option: barOption(
          ['业务量', '异常重试'],
          ['密信', '电报', '签批', '交换'],
          [
            { name: '业务量', color: colors.blue, data: [86, 44, 26, 18] },
            { name: '异常重试', color: colors.orange, data: [3, 2, 7, 5] }
          ]
        ),
        footer: '签批与文件交换的异常重试更值得关注。'
      },
      {
        kind: 'timeline',
        code: 'business-timeline',
        title: '业务变更与恢复时间线',
        description: '为后续接入变更单、切换单、恢复单保留时间线位。',
        tags: ['变更', '恢复'],
        colSpan: 6,
        items: [
          timeline('18:42', '签批服务执行慢 SQL 热修复', '业务高峰前针对审批回执查询开启索引热变更，平均时延从 470ms 回落到 420ms。', '业务运行组', 'success'),
          timeline('17:58', '电报保障链路自动切换备用通道', '主通道抖动持续 40 秒后自动切换，期间未发生明显失败。', '通道保障组', 'info'),
          timeline('17:23', '文件交换队列扩容 1 个消费者', '积压队列开始回落，但仍建议继续观察重试分布。', '平台运维组', 'warning')
        ]
      }
    ]
  },
  security: {
    code: 'security',
    name: '安全保密态势',
    title: '安全保密与零信任态势',
    subtitle: 'risk, alert & response orchestration',
    location: '安全保密中心 · 风险指挥席',
    lastUpdated: '2026-07-07 19:14',
    dataMode: 'mock',
    summary:
      '安全态势页聚焦风险评分、零信任策略命中、异常行为、数据泄露线索与自动处置效果。由于外部系统协议尚未定型，当前先以前端经验模型形成信息架构，便于后续直接挂接统一接入层。',
    heroTags: [
      { label: '综合风险评分', value: '62 / 100', tone: 'warning' },
      { label: '高危告警', value: '4 件', tone: 'danger' },
      { label: '自动处置率', value: '68%', tone: 'info' },
      { label: '策略命中', value: '126 次', tone: 'warning' }
    ],
    actions: [
      { label: '本轮重点', detail: '重点关注异常登录、深夜导出与终端/账号复合风险，优先缩短研判和闭环时间。', tone: 'danger' },
      { label: '数据建议', detail: '未来建议接入零信任平台、行为分析、DLP、审计中心和账号中心。', tone: 'info' },
      { label: '呈现策略', detail: '先建立“风险矩阵 + 趋势 + 告警 + 时间线 + 组件健康”的稳定结构。', tone: 'success' }
    ],
    kpis: [
      { label: '综合风险评分', value: '62', unit: '/100', trend: '-5', description: '较昨日回落，主要来自处置闭环提升', tone: 'warning' },
      { label: '高危安全事件', value: '4', unit: '件', trend: '-1', description: '异常登录与深夜导出为主', tone: 'danger' },
      { label: '零信任策略命中', value: '126', unit: '次', trend: '+18', description: '以访问控制和二次认证为主', tone: 'warning' },
      { label: '自动处置率', value: '68', unit: '%', trend: '+7%', description: '离线自主防御与策略下发覆盖扩大', tone: 'info' },
      { label: '异常行为模型告警', value: '9', unit: '条', trend: '+2', description: 'LSTM/KNN 联合研判', tone: 'warning' },
      { label: '敏感数据线索', value: '3', unit: '件', trend: '持平', description: '深夜导出与越权访问需继续跟踪', tone: 'danger' }
    ],
    highlights: [
      highlight('账号风险', '账号 U-0812 与终端 T-089 形成复合风险，是当前最需要闭环的对象。', '高', '复合风险等级', 'danger'),
      highlight('行为异常', '深夜高频文件导出、异常访问路径等行为仍需持续优化规则。', '9 条', '模型告警', 'warning'),
      highlight('自动处置', '离线自主处置能力已覆盖部分终端与策略中心。', '68%', '自动处置率', 'info'),
      highlight('保密策略', '加密审查与访问控制策略命中明显增加，说明策略生效范围扩大。', '126 次', '策略命中', 'success')
    ],
    sections: [
      {
        kind: 'matrix',
        code: 'security-risk-matrix',
        title: '风险视角矩阵',
        description: '把账号、终端、数据、访问控制等主要风险面并列展示。',
        tags: ['风险', '矩阵'],
        colSpan: 6,
        items: [
          matrixItem('账号与身份', '零信任运营组', '71/100', '需重点关注', '异常登录 +2', '零信任 / IAM', '异常登录与跨区域访问仍是主风险。', 'warning'),
          matrixItem('终端与设备', '终端安全组', '68/100', '存在高危样本', '高危终端 2 台', '终端平台 / USB Key', '终端锁定与离线自主处置已产生效果。', 'warning'),
          matrixItem('数据与文件', '保密审查组', '64/100', '泄露线索存在', '深夜导出 1 起', 'DLP / 审计日志', '文件导出与越权读取需要持续观察。', 'danger'),
          matrixItem('访问与通道', '网络安全组', '84/100', '总体可控', '策略命中 +18', '访问控制 / 网关', '策略生效率良好，但需要减少误报。', 'info')
        ]
      },
      {
        kind: 'chart',
        code: 'security-alert-trend',
        title: '近 24 小时安全事件趋势',
        description: '区分高危事件与模型告警，形成“风险热度”观察。',
        tags: ['安全事件'],
        colSpan: 6,
        option: lineOption(
          ['高危事件', '模型告警'],
          ['00', '04', '08', '10', '12', '14', '16', '18', '20'],
          [
            { name: '高危事件', color: colors.red, data: [1, 1, 2, 2, 3, 4, 4, 4, 3] },
            { name: '模型告警', color: colors.orange, data: [2, 3, 4, 4, 5, 7, 9, 9, 8] }
          ]
        ),
        footer: '后续可用统一外部接入接口将不同安全来源归一后汇聚到此。'
      },
      {
        kind: 'signals',
        code: 'security-ai-signals',
        title: '异常行为与研判建议',
        description: '让安全席先看最具处置价值的线索。',
        tags: ['AI 分析'],
        colSpan: 5,
        items: [
          signal('P1', '终端 T-089：未认证用户访问加密文件', 'KNN 与 LSTM 同时给出高分，建议立即冻结账号并对终端执行断网处置。', 'KNN 0.87 · LSTM 0.92', 'danger'),
          signal('P1', '终端 T-103：深夜高频文件导出', '22:00-02:00 时段导出 15 份文件，建议核查任务单与授权链路。', 'LSTM 0.91 · 导出 15 份', 'warning'),
          signal('P2', '终端 T-052：连续密码错误触发规则', '规则命中 3 次/5 分钟，建议检查是否存在借用或误操作。', '规则引擎', 'warning')
        ]
      },
      {
        kind: 'timeline',
        code: 'security-timeline',
        title: '安全事件时间线',
        description: '强调研判、处置和恢复过程。',
        tags: ['事件'],
        colSpan: 7,
        items: [
          timeline('18:56', '终端与账号复合风险触发', '终端 T-089 锁定后，账号 U-0812 在业务系统出现异常访问路径。', '安全保密组', 'danger'),
          timeline('18:28', '深夜导出告警升级处置级别', '因历史相似模式较多，将高频文件导出规则提升至人工复核。', '保密审查组', 'warning'),
          timeline('17:45', '访问控制策略临时加严', '针对高风险账号切换到双因子 + 设备指纹复核模式。', '零信任运营组', 'success'),
          timeline('17:12', '终端离线自主防御生效', '客户端对高危终端执行断网与强制锁定，防止进一步扩散。', '终端安全组', 'info')
        ]
      },
      {
        kind: 'cards',
        code: 'security-components',
        title: '防护组件与策略健康度',
        description: '安全态势不能只有事件，还需要看到能力本身的健康度。',
        tags: ['组件', '能力'],
        colSpan: 6,
        items: [
          card('零信任策略中心', '策略生效稳定', '98.1%', '动态策略下发成功率保持高位。', 'success', 98),
          card('行为分析引擎', '模型命中偏多', '9 条', '需要优化异常行为阈值与误报控制。', 'warning', 74),
          card('DLP / 审计中心', '规则覆盖继续扩大', '87%', '建议补齐更多业务系统的敏感数据审计。', 'info', 87),
          card('离线自主防御', '能力验证通过', '68%', '仍有部分终端未安装完整防御组件。', 'warning', 68)
        ]
      },
      {
        kind: 'table',
        code: 'security-policy-hits',
        title: '策略命中排行',
        description: '方便未来接策略中心 API 后直接替换。',
        tags: ['策略'],
        colSpan: 6,
        columns: [
          { key: 'policy', label: '策略' },
          { key: 'scope', label: '作用对象' },
          { key: 'hits', label: '命中次数' },
          { key: 'action', label: '最近动作' },
          { key: 'status', label: '状态', tone: true }
        ],
        rows: [
          row({ policy: '二次认证提升', scope: '高风险账号', hits: '38', action: '切换双因子', status: '已生效' }, { status: 'success' }),
          row({ policy: '文件导出审查', scope: '加密文件', hits: '31', action: '人工复核', status: '持续关注' }, { status: 'warning' }),
          row({ policy: '终端锁定', scope: 'PIN 错误终端', hits: '22', action: '30 分钟锁定', status: '已处置' }, { status: 'info' }),
          row({ policy: '访问降权', scope: '异常访问账号', hits: '18', action: '权限降级', status: '联动中' }, { status: 'warning' })
        ]
      }
    ]
  }
};

export async function getMockSituationPage(pageCode: SituationPageCode): Promise<SituationPage> {
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  return pages[pageCode] ?? pages.overview;
}
