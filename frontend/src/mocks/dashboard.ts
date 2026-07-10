import type { DashboardMenuItem, DashboardPage, WidgetDefinition } from '@/types/dashboard';

const menu: DashboardMenuItem[] = [
  { code: 'overview', name: '态势总览', route: '/overview' },
  { code: 'terminal', name: '终端态势', route: '/terminal' },
  { code: 'business', name: '业务态势', route: '/business' },
  { code: 'security', name: '安全保密态势', route: '/security', badge: 3 },
  { code: 'ops', name: '运维态势', route: '/ops' }
];

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

const lineChart = (nameA: string, nameB: string, xAxis: string[], dataA: number[], dataB: number[]) => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 8, textStyle },
  grid: { left: 18, right: 18, top: 48, bottom: 20, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisLine,
    axisLabel: textStyle,
    data: xAxis
  },
  yAxis: {
    type: 'value',
    axisLine,
    axisLabel: textStyle,
    splitLine
  },
  series: [
    {
      name: nameA,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3, color: colors.cyan },
      areaStyle: { color: 'rgba(45,226,230,0.12)' },
      data: dataA
    },
    {
      name: nameB,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3, color: colors.blue },
      areaStyle: { color: 'rgba(30,136,255,0.10)' },
      data: dataB
    }
  ]
});

const barChart = (legend: string[], xAxis: string[], series: Array<{ name: string; color: string; data: number[] }>) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { top: 8, textStyle },
  grid: { left: 18, right: 18, top: 48, bottom: 20, containLabel: true },
  xAxis: {
    type: 'category',
    axisLine,
    axisLabel: textStyle,
    data: xAxis
  },
  yAxis: {
    type: 'value',
    axisLine,
    axisLabel: textStyle,
    splitLine
  },
  series: series.map((item) => ({
    name: item.name,
    type: 'bar',
    barMaxWidth: 18,
    itemStyle: { color: item.color, borderRadius: [6, 6, 0, 0] },
    data: item.data
  }))
});

const pieChart = (data: Array<{ name: string; value: number }>) => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle },
  series: [
    {
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      label: { color: '#d9e8ff' },
      data
    }
  ]
});

const radarChart = () => ({
  tooltip: {},
  radar: {
    radius: '64%',
    indicator: [
      { name: '账号异常', max: 100 },
      { name: '终端合规', max: 100 },
      { name: '链路稳定', max: 100 },
      { name: '密钥安全', max: 100 },
      { name: '策略覆盖', max: 100 },
      { name: '审计完整', max: 100 }
    ],
    axisName: { color: '#d9e8ff' },
    splitLine: { lineStyle: { color: 'rgba(91,151,255,0.14)' } },
    splitArea: { areaStyle: { color: ['transparent'] } },
    axisLine: { lineStyle: { color: 'rgba(91,151,255,0.14)' } }
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [86, 92, 81, 95, 88, 90],
          areaStyle: { color: 'rgba(45,226,230,0.18)' },
          lineStyle: { color: colors.cyan },
          itemStyle: { color: colors.cyan }
        }
      ]
    }
  ]
});

const gaugeChart = () => ({
  series: [
    {
      type: 'gauge',
      min: 0,
      max: 100,
      progress: { show: true, roundCap: true, width: 12 },
      axisLine: { lineStyle: { width: 12 } },
      pointer: { show: true, length: '62%' },
      detail: { valueAnimation: true, formatter: '{value} 分', color: '#f3f8ff', fontSize: 22 },
      data: [{ value: 78 }],
      title: { color: '#90a4c3' }
    }
  ]
});

const statusItem = (name: string, description: string, status: 'success' | 'warning' | 'danger' | 'info', progress: number) => ({
  name,
  description,
  status,
  progress
});

const widget = (
  code: string,
  title: string,
  type: WidgetDefinition['type'],
  colSpan: number,
  minHeight: number,
  tags: string[],
  payload: Record<string, unknown>
): WidgetDefinition => ({ code, title, type, colSpan, minHeight, tags, payload });

const pages: Record<string, DashboardPage> = {
  overview: {
    code: 'overview',
    name: '态势总览',
    title: '综 合 态 势 总 览',
    subtitle: '业务安全态势系统',
    location: '综合值守中心',
    lastUpdated: '2026-07-06 19:30:00',
    dataMode: 'mock',
    summaryMetrics: [
      { label: '在线终端', value: '128', unit: '台', trend: '+4 较昨日', status: 'success', description: '覆盖 19 个保障节点' },
      { label: '今日电报收发', value: '2,486', unit: '份', trend: '+8.2%', status: 'info', description: '密信与签阅双通道汇总' },
      { label: '密码钥匙合规率', value: '96.8', unit: '%', trend: '+1.1%', status: 'success', description: '认证成功率持续提升' },
      { label: '高风险事件', value: '7', unit: '起', trend: '-2 起', status: 'warning', description: '含离群行为与策略拦截' },
      { label: '策略闭环率', value: '91.4', unit: '%', trend: '+3.6%', status: 'success', description: '建议已追踪到执行反馈' },
      { label: '智能检测命中', value: '23', unit: '条', trend: '+5 条', status: 'info', description: '多模型综合分析' }
    ],
    widgets: [
      widget('terminal-access', '终端接入状态', 'statusGrid', 4, 320, ['终端', '接入'], {
        items: [
          statusItem('境外终端-01', '4G 国际互联网接入 · 最近 3 分钟活跃', 'success', 98),
          statusItem('境外终端-02', '卫星链路抖动 12ms · 建议持续观察', 'warning', 81),
          statusItem('签批终端集群', '112 台终端保持在线', 'success', 93),
          statusItem('离线终端', '4 台终端处于离线缓存模式', 'info', 67)
        ]
      }),
      widget('telegram-trend', '电报业务量趋势（近24h）', 'lineChart', 4, 320, ['业务', '趋势'], {
        option: lineChart('发送量', '接收量', ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'], [82, 91, 104, 136, 149, 162, 151], [76, 88, 112, 127, 142, 155, 144])
      }),
      widget('usb-auth', '密码钥匙认证状态统计', 'pieChart', 4, 320, ['认证', '密码装备'], {
        option: pieChart([
          { name: '认证成功', value: 96 },
          { name: '待复核', value: 6 },
          { name: '故障', value: 2 }
        ])
      }),
      widget('overview-topology', '综合态势主链路', 'topology', 12, 440, ['拓扑', '主链路', '中枢'], {
        nodes: [
          { id: 'gateway', name: '接入网关', meta: '主备链路稳定运行', status: 'success', x: 12, y: 50 },
          { id: 'collector', name: '态势采集中心', meta: '统一汇聚主要业务与设备数据', status: 'info', x: 30, y: 22 },
          { id: 'mail', name: '密信交换系统', meta: '电报与消息业务稳定运行', status: 'success', x: 24, y: 50 },
          { id: 'analysis', name: '智能分析中心', meta: '综合研判风险与异常信号', status: 'success', x: 50, y: 50 },
          { id: 'sign', name: '签阅流转系统', meta: '当前高峰时段时延略有抬升', status: 'warning', x: 76, y: 50 },
          { id: 'zt', name: '策略中心', meta: '策略下发与风险评估', status: 'warning', x: 70, y: 22 },
          { id: 'defense', name: '动态防御系统', meta: '终端行为与安全事件持续采集', status: 'success', x: 30, y: 80 },
          { id: 'db', name: '数据存储集群', meta: '业务数据与运行记录统一归档', status: 'info', x: 50, y: 84 },
          { id: 'screen', name: '态势展示门户', meta: '综合展示与值守查看', status: 'success', x: 88, y: 52 }
        ],
        lines: [
          { from: 'gateway', to: 'collector' },
          { from: 'collector', to: 'analysis' },
          { from: 'mail', to: 'analysis' },
          { from: 'analysis', to: 'sign' },
          { from: 'analysis', to: 'zt' },
          { from: 'analysis', to: 'defense' },
          { from: 'analysis', to: 'db' },
          { from: 'zt', to: 'screen' },
          { from: 'sign', to: 'screen' }
        ]
      }),
      widget('security-events', '安全事件统计', 'barChart', 4, 320, ['安全', '事件'], {
        option: barChart(['一般', '中危', '高危'], ['账号异常', '终端违规', '策略拦截', '链路抖动'], [
          { name: '一般', color: colors.blue, data: [12, 9, 8, 15] },
          { name: '中危', color: colors.orange, data: [6, 7, 9, 4] },
          { name: '高危', color: colors.red, data: [2, 3, 4, 1] }
        ])
      }),
      widget('sign-flow', '签阅流转分布（本月）', 'pieChart', 4, 320, ['签阅', '分布'], {
        option: pieChart([
          { name: '已完成', value: 62 },
          { name: '处理中', value: 24 },
          { name: '待核实', value: 14 }
        ])
      }),
      widget('risk-trend', '今日风险趋势（近12h）', 'lineChart', 4, 320, ['风险', '趋势'], {
        option: lineChart('风险值', '策略命中', ['08', '10', '12', '14', '16', '18', '20'], [41, 48, 52, 66, 61, 58, 54], [28, 33, 38, 49, 44, 40, 35])
      }),
      widget('encrypt-transfer', '数据加密传输统计', 'barChart', 4, 320, ['传输', '加密'], {
        option: barChart(['传输量'], ['涉密消息', '附件交换', '同步归档', '安全策略'], [
          { name: '传输量', color: colors.cyan, data: [118, 84, 66, 52] }
        ])
      })
    ]
  },
  terminal: {
    code: 'terminal',
    name: '终端态势',
    title: '终 端 主 题 态 势',
    subtitle: '移动电报终端 / 签批终端 / 密码钥匙统一感知',
    location: '境外保障节点 + 后台服务中心机房',
    lastUpdated: '2026-07-06 19:30:00',
    dataMode: 'mock',
    summaryMetrics: [
      { label: '受管终端', value: '140', unit: '台', trend: '+6', status: 'success', description: '覆盖 4 大洲 19 个节点' },
      { label: '在线率', value: '92.4', unit: '%', trend: '+0.8%', status: 'success', description: '高峰时段稳定在线' },
      { label: '离线缓存终端', value: '4', unit: '台', trend: '持平', status: 'info', description: '均处于已授权缓存模式' },
      { label: '故障终端', value: '2', unit: '台', trend: '-1', status: 'warning', description: '驱动异常待恢复' },
      { label: '合规补丁率', value: '97.2', unit: '%', trend: '+1.6%', status: 'success', description: '补丁窗口推进中' },
      { label: '密码钥匙正常率', value: '95.6', unit: '%', trend: '+0.5%', status: 'info', description: '认证链路稳定' }
    ],
    widgets: [
      widget('asset-map', '资产位置地图 · 境外保障态势', 'nodeMap', 6, 320, ['节点', '资产'], {
        regions: [
          { name: '东南亚', count: 28, items: ['终端-SG-01', '终端-SG-02', '钥匙-SG-07', '网关-SG'] },
          { name: '西亚', count: 16, items: ['终端-DJ-01', '终端-DJ-02', '钥匙-DJ-03'] },
          { name: '欧洲', count: 24, items: ['终端-FR-01', '终端-DE-02', '钥匙-EU-11', '网关-EU'] },
          { name: '非洲', count: 12, items: ['终端-KE-02', '钥匙-KE-03', '卫星-KE'] }
        ]
      }),
      widget('asset-roster', '资产清单 · 140 台覆盖 4 大洲 19 个节点', 'table', 6, 320, ['清单', '台账'], {
        columns: [
          { key: 'asset', label: '终端编号' },
          { key: 'type', label: '类型' },
          { key: 'location', label: '位置' },
          { key: 'status', label: '状态', type: 'status' },
          { key: 'owner', label: '责任组' }
        ],
        rows: [
          { asset: '终端-SG-01', type: '签批终端', location: '新加坡', status: '正常', owner: '海外保障一组' },
          { asset: '终端-DJ-02', type: '移动终端', location: '迪拜', status: '处理中', owner: '海外保障二组' },
          { asset: '钥匙-EU-11', type: '密码钥匙', location: '法兰克福', status: '正常', owner: '欧洲保障组' },
          { asset: 'SAT-KE', type: '卫星模组', location: '内罗毕', status: '告警', owner: '链路保障组' }
        ]
      }),
      widget('terminal-comm', '近 7 天终端通联趋势', 'lineChart', 6, 320, ['通联', '趋势'], {
        option: lineChart('在线终端', '异常终端', ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], [122, 125, 126, 129, 131, 128, 130], [5, 4, 6, 3, 4, 2, 3])
      }),
      widget('terminal-key', '密码钥匙认证状态', 'pieChart', 3, 320, ['认证', '密钥'], {
        option: pieChart([
          { name: '成功', value: 132 },
          { name: '待复核', value: 5 },
          { name: '失败', value: 3 }
        ])
      }),
      widget('terminal-health', '终端健康度一览', 'statusGrid', 3, 320, ['健康度', '终端'], {
        items: [
          statusItem('终端驱动', '核心驱动版本覆盖率 98%', 'success', 98),
          statusItem('链路模组', '2 台终端存在卫星链路抖动', 'warning', 82),
          statusItem('缓存授权', '离线授权缓存策略正常', 'info', 88),
          statusItem('外设限制', '策略覆盖完整', 'success', 94)
        ]
      })
    ]
  },
  business: {
    code: 'business',
    name: '业务态势',
    title: '业 务 主 题 态 势',
    subtitle: '密信 / 签阅 / 电报收发 / 数字信封统一业务画像',
    location: '后台服务中心机房',
    lastUpdated: '2026-07-06 19:30:00',
    dataMode: 'mock',
    summaryMetrics: [
      { label: '当日业务量', value: '8,942', unit: '笔', trend: '+12.4%', status: 'info', description: '业务高峰出现在 16:00-19:00' },
      { label: '签阅办结率', value: '89.1', unit: '%', trend: '+3.1%', status: 'success', description: '平均办结时长下降' },
      { label: '数字信封加密', value: '1,486', unit: '次', trend: '+9.8%', status: 'success', description: '跨系统传输占比提升' },
      { label: '超时流转', value: '17', unit: '条', trend: '-4', status: 'warning', description: '主要集中在跨域审批链路' },
      { label: '业务成功率', value: '98.3', unit: '%', trend: '+0.6%', status: 'success', description: '核心通道平稳' },
      { label: '异常回退', value: '6', unit: '次', trend: '-2', status: 'info', description: '均已恢复处理' }
    ],
    widgets: [
      widget('biz-telegram', '近 7 天电报收发趋势', 'lineChart', 4, 320, ['电报', '趋势'], {
        option: lineChart('发送', '接收', ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], [320, 342, 356, 388, 410, 394, 402], [308, 330, 349, 372, 395, 381, 390])
      }),
      widget('biz-sign', '签阅流转分布（本月）', 'pieChart', 4, 320, ['签阅', '流转'], {
        option: pieChart([
          { name: '已办结', value: 68 },
          { name: '处理中', value: 21 },
          { name: '待签收', value: 11 }
        ])
      }),
      widget('biz-envelope', '数字信封加解密统计', 'barChart', 4, 320, ['信封', '加密'], {
        option: barChart(['加密', '解密'], ['涉密文件', '流转附件', '归档包', '跨域数据'], [
          { name: '加密', color: colors.cyan, data: [168, 132, 84, 65] },
          { name: '解密', color: colors.blue, data: [142, 124, 77, 58] }
        ])
      }),
      widget('biz-kpi', '业务处理时效监测', 'statusGrid', 6, 320, ['时效', '业务'], {
        items: [
          statusItem('密信投递', '平均时延 2.8 秒', 'success', 96),
          statusItem('签阅流转', '跨部门流程存在波峰', 'warning', 83),
          statusItem('数字信封', '高峰期处理保持稳定', 'success', 91),
          statusItem('归档同步', '最近 1 小时轻微延迟', 'info', 79)
        ]
      }),
      widget('biz-table', '重点业务样本', 'table', 6, 320, ['样本', '重点'], {
        columns: [
          { key: 'time', label: '时间' },
          { key: 'type', label: '业务类型' },
          { key: 'owner', label: '责任部门' },
          { key: 'status', label: '状态', type: 'status' },
          { key: 'cost', label: '处理时长' }
        ],
        rows: [
          { time: '19:08', type: '涉密电报', owner: '值班一组', status: '正常', cost: '2.4 秒' },
          { time: '18:52', type: '签阅流程', owner: '综合处', status: '处理中', cost: '6 分钟' },
          { time: '18:36', type: '数字信封', owner: '业务保障组', status: '正常', cost: '4.1 秒' },
          { time: '17:58', type: '归档同步', owner: '平台组', status: '待核实', cost: '8 分钟' }
        ]
      })
    ]
  },
  security: {
    code: 'security',
    name: '安全保密态势',
    title: '安 全 保 密 主 题 态 势',
    subtitle: '动态防御安全事件 / 风险评估 / 智能异常行为检测',
    location: '后台服务中心机房 + 终端侧安全组件',
    lastUpdated: '2026-07-06 19:30:00',
    dataMode: 'mock',
    summaryMetrics: [
      { label: '综合风险分', value: '78', unit: '分', trend: '+2', status: 'warning', description: '策略命中率上升带动风险提升' },
      { label: '已拦截异常', value: '19', unit: '次', trend: '+4', status: 'danger', description: '含越权访问与异常链路' },
      { label: '智能分析告警', value: '23', unit: '条', trend: '+5', status: 'info', description: '已进入事件研判队列' },
      { label: '策略覆盖率', value: '94.6', unit: '%', trend: '+1.3%', status: 'success', description: '终端与账号策略同步提升' },
      { label: '保密设备异常', value: '3', unit: '台', trend: '持平', status: 'warning', description: '密码装备待巡检' },
      { label: '处置闭环率', value: '88.9', unit: '%', trend: '+2.1%', status: 'success', description: '高风险事件闭环时长下降' }
    ],
    widgets: [
      widget('risk-gauge', '风险评估', 'gaugeChart', 3, 320, ['风险', '评估'], {
        option: gaugeChart()
      }),
      widget('security-timeline', '安全事件时间线', 'timeline', 5, 320, ['时间线', '事件'], {
        items: [
          { time: '19:12', title: '境外账号异常提权尝试', description: '风险策略已执行高风险二次认证，账号行为已进入复核。', status: 'danger' },
          { time: '18:48', title: '卫星链路抖动触发策略降级', description: '链路切换至备份通道，数据同步保持完整。', status: 'warning' },
          { time: '18:21', title: '终端外设接入被拦截', description: '违规外设被拒绝挂载，终端状态已恢复。', status: 'success' },
          { time: '17:54', title: '智能模型命中异常行为序列', description: '命中用户深夜高频签收模式，已推送安全研判。', status: 'info' }
        ]
      }),
      widget('ai-alert', '异常行为告警（智能分析）', 'alertList', 4, 320, ['分析', '告警'], {
        items: [
          { level: '高危', title: '账号 U-0812 异常访问', description: '检测到非常用地域 + 异常时段 + 高频访问组合行为。', time: '19:10', status: 'danger' },
          { level: '中危', title: '签阅链路访问跳变', description: '近 15 分钟访问频率高于均值 2.4 倍。', time: '18:43', status: 'warning' },
          { level: '提示', title: '模型参数更新完成', description: '分析模型参数热更新已生效。', time: '18:02', status: 'info' }
        ]
      }),
      widget('risk-factor', '风险因子雷达图', 'radarChart', 4, 320, ['因子', '雷达'], {
        option: radarChart()
      }),
      widget('attack-heat', '攻击类型分布', 'barChart', 4, 320, ['攻击', '分布'], {
        option: barChart(['次数'], ['账号越权', '异常登录', '设备违规', '链路劫持'], [
          { name: '次数', color: colors.red, data: [7, 12, 5, 2] }
        ])
      }),
      widget('crypto-equipment', '密码装备状态', 'statusGrid', 4, 320, ['密码装备', '状态'], {
        items: [
          statusItem('核心认证模块', '运行稳定，最近 24h 无异常', 'success', 97),
          statusItem('密码钥匙管理服务', '2 个实例延迟偏高', 'warning', 84),
          statusItem('链路加密组件', '证书状态正常', 'success', 95),
          statusItem('密钥审计任务', '周期任务已执行', 'info', 90)
        ]
      })
    ]
  },
  ops: {
    code: 'ops',
    name: '运维态势',
    title: '运 维 主 题 态 势',
    subtitle: '设备运行状态 / 策略下发追踪 / 智能处置推荐 / 系统日志审计',
    location: '后台服务中心机房',
    lastUpdated: '2026-07-06 19:30:00',
    dataMode: 'mock',
    summaryMetrics: [
      { label: '核心服务可用率', value: '99.94', unit: '%', trend: '+0.03%', status: 'success', description: '核心链路未出现中断' },
      { label: '策略执行数', value: '146', unit: '次', trend: '+18', status: 'info', description: '自动化联动占比提升' },
      { label: '待处置建议', value: '9', unit: '条', trend: '+2', status: 'warning', description: '已按优先级排序' },
      { label: '工单闭环', value: '91', unit: '%', trend: '+4%', status: 'success', description: '闭环时长继续下降' },
      { label: '资源告警', value: '4', unit: '项', trend: '-1', status: 'warning', description: '处理器与链路告警为主' },
      { label: '归档成功率', value: '98.8', unit: '%', trend: '+0.7%', status: 'success', description: '冷热分层归档稳定' }
    ],
    widgets: [
      widget('ops-devices', '设备运行状态', 'statusGrid', 6, 320, ['设备', '运行'], {
        items: [
          statusItem('态势采集服务器', '处理器峰值 78%，建议扩容', 'warning', 78),
          statusItem('智能分析服务器', '推理任务队列平稳', 'success', 91),
          statusItem('数据库主库', '复制延迟 < 1s', 'success', 96),
          statusItem('中心机房防火墙', '策略下发后状态同步正常', 'info', 89)
        ]
      }),
      widget('ops-policy', '策略下发记录', 'table', 6, 320, ['策略', '执行'], {
        columns: [
          { key: 'time', label: '时间' },
          { key: 'policy', label: '策略' },
          { key: 'target', label: '目标' },
          { key: 'status', label: '状态', type: 'status' },
          { key: 'latency', label: '生效时延' }
        ],
        rows: [
          { time: '19:02', policy: '外设禁用', target: '终端-DJ-02', status: '已执行', latency: '14 秒' },
          { time: '18:46', policy: '访问权限降级', target: '账号 U-0812', status: '执行中', latency: '27 秒' },
          { time: '18:13', policy: '二次认证提升', target: '签阅系统', status: '已执行', latency: '8 秒' },
          { time: '17:41', policy: '终端锁定 30 分钟', target: '终端-SG-03', status: '已执行', latency: '5 秒' }
        ]
      }),
      widget('ops-recommend', '处置策略推荐', 'recommendationList', 6, 320, ['推荐', '处置'], {
        items: [
          { priority: 'P1', title: '提升高风险用户认证级别', description: '针对 4 名高风险用户，建议立即切换到双因子 + 设备指纹复核策略。', action: '执行二次认证', target: '策略中心' },
          { priority: 'P2', title: '扩容采集线程池', description: '态势采集服务器在晚高峰处理器占用超过 75%，建议增加 2 个采集工作线程。', action: '调整服务参数', target: '态势采集服务' },
          { priority: 'P2', title: '补齐终端驱动升级', description: '2 台终端存在安全驱动版本滞后，建议在 22:00 后窗口统一升级。', action: '驱动升级', target: '终端运维组' }
        ]
      }),
      widget('ops-logs', '系统日志', 'alertList', 6, 320, ['日志', '审计'], {
        items: [
          { level: '提示', title: '日志接入成功', description: '密信系统最新日志批次已写入归档通道。', time: '19:14', status: 'success' },
          { level: '告警', title: '采集服务器处理器占用偏高', description: '采集峰值 78%，已生成扩容建议。', time: '18:59', status: 'warning' },
          { level: '提示', title: '数据库归档完成', description: '近 24 小时业务日志完成冷热分层归档。', time: '18:35', status: 'info' },
          { level: '告警', title: '节点切换记录', description: '卫星接入模组触发一次备链路切换。', time: '17:58', status: 'warning' }
        ]
      }),
      widget('ops-topology', '运维资源拓扑', 'topology', 12, 340, ['机房', '资源拓扑'], {
        nodes: [
          { id: 'node1', name: '云平台节点-01', meta: '应用服务池 A', status: 'success', x: 12, y: 40 },
          { id: 'node2', name: '云平台节点-02', meta: '应用服务池 B', status: 'success', x: 32, y: 68 },
          { id: 'collector', name: '态势采集服务器', meta: '日志汇聚 / 业务接入 / 消息同步', status: 'warning', x: 48, y: 35 },
          { id: 'analysis', name: '智能分析服务器', meta: '规则引擎 + 模型推理', status: 'info', x: 64, y: 58 },
          { id: 'database', name: '数据库服务器', meta: '核心业务主库', status: 'success', x: 74, y: 25 },
          { id: 'fw', name: '中心机房防火墙', meta: '边界访问控制', status: 'success', x: 88, y: 52 }
        ],
        lines: [
          { from: 'node1', to: 'collector' },
          { from: 'node2', to: 'collector' },
          { from: 'collector', to: 'analysis' },
          { from: 'analysis', to: 'database' },
          { from: 'database', to: 'fw' }
        ]
      })
    ]
  }
};

export async function getMockMenu(): Promise<DashboardMenuItem[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return menu;
}

export async function getMockPage(pageCode: string): Promise<DashboardPage> {
  await new Promise((resolve) => window.setTimeout(resolve, 280));
  return pages[pageCode] ?? pages.overview;
}
