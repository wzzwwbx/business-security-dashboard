import type {
  SituationCardItem,
  SituationHighlight,
  SituationKpi,
  SituationMatrixItem,
  SituationPage,
  SituationPageCode,
  SituationSection,
  SituationSignalItem,
  SituationSourceItem,
  SituationTimelineItem,
  SituationTone
} from '@/types/situation';
import type { MiniTrendItem, VisualAssetNode, VisualLink } from '@/types/visualization';

function kpi(label: string, value: string, description: string, tone: SituationTone, unit?: string, trend?: string): SituationKpi {
  return { label, value, description, tone, unit, trend };
}

function highlight(title: string, description: string, metric: string, meta: string, tone: SituationTone): SituationHighlight {
  return { title, description, metric, meta, tone };
}

function matrix(name: string, owner: string, score: string, status: string, trend: string, source: string, description: string, tone: SituationTone): SituationMatrixItem {
  return { name, owner, score, status, trend, source, description, tone };
}

function signal(label: string, title: string, description: string, meta: string, tone: SituationTone): SituationSignalItem {
  return { label, title, description, meta, tone };
}

function source(sourceName: string, status: string, latency: string, coverage: string, note: string, tone: SituationTone): SituationSourceItem {
  return { source: sourceName, status, latency, coverage, note, tone };
}

function card(name: string, summary: string, metric: string, detail: string, tone: SituationTone): SituationCardItem {
  return { name, summary, metric, detail, tone };
}

function timeline(time: string, title: string, description: string, actor: string, tone: SituationTone): SituationTimelineItem {
  return { time, title, description, actor, tone };
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

function sectionScene(code: string, title: string, description: string, nodes: VisualAssetNode[], links: VisualLink[], tags: string[]) {
  return { kind: 'scene' as const, code, title, description, tags, colSpan: 12, nodes, links, legend: ['主视觉', '联动', '下钻'] };
}

function sectionRelation(code: string, title: string, description: string, nodes: VisualAssetNode[], links: VisualLink[], tags: string[]) {
  return { kind: 'relationMap' as const, code, title, description, tags, colSpan: 12, nodes, links, legend: ['关系链路', '风险焦点', '闭环状态'] };
}

function buildOverviewSections(): SituationSection[] {
  const nodes = [
    sceneNode('overview-center', '综合分析中枢', 'domain', 'success', 46, 50, '统一汇聚四域态势与联动处置', '联动闭环', '87%'),
    sceneNode('overview-security', '安全域', 'policy', 'warning', 24, 26, '攻击面、告警、策略联动', '待处置', '12 条'),
    sceneNode('overview-business', '业务域', 'service', 'success', 72, 28, '核心业务链路与服务质量', '成功率', '99.3%'),
    sceneNode('overview-terminal', '终端域', 'terminal', 'warning', 26, 74, '终端资产、人员关联、异常事件', '高风险', '6 台'),
    sceneNode('overview-ops', '运维域', 'server', 'success', 72, 74, '主机、来源、资源告警', '在线主机', '168 台'),
    sceneNode('overview-source', '来源接入', 'source', 'info', 12, 50, '零信任、探针、日志中心、人工注入', '已接入', '11 个'),
    sceneNode('overview-workflow', '处置闭环', 'alert', 'success', 88, 50, '研判、协同、处置、复盘', '闭环耗时', '24 分钟')
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
    sectionScene('overview-scene', '综合态势中枢图', '从中枢视角联动安全、业务、终端与运维四大主题。', nodes, links, ['主视觉', '综合指挥']),
    {
      kind: 'miniTrendGroup',
      code: 'overview-mini-trends',
      title: '关键态势走势',
      description: '首屏仅保留关键对比，完整明细通过下钻查看。',
      tags: ['趋势', '首屏摘要'],
      colSpan: 4,
      items: [
        trend('health', '综合健康度', '82 分', 82, 'success', '较昨日 +3 分'),
        trend('alerts', '待处置告警', '28 条', 56, 'warning', '高危 4 条'),
        trend('sources', '来源就绪度', '91%', 91, 'success', '新增 1 个接口'),
        trend('closure', '联动闭环率', '87%', 87, 'success', '平均 24 分钟')
      ]
    },
    {
      kind: 'sources',
      code: 'overview-sources',
      title: '来源接入概览',
      description: '多源并行接入，支持探针、接口与人工演示注入。',
      tags: ['来源', '左侧'],
      colSpan: 4,
      items: [
        source('零信任网关', '健康', '28 秒', '终端 / 账号', '支撑终端与账号联动', 'success'),
        source('运维探针', '健康', '58 秒', '主机 / 进程', '当前已覆盖多台主机', 'success'),
        source('业务链路平台', '规划中', '待明确', '服务 / 依赖', '接口契约待定', 'info'),
        source('人工注入台', '可用', '即时', '演示 / 联调', '用于多源联调验证', 'warning')
      ]
    },
    {
      kind: 'drilldownSummary',
      code: 'overview-focus',
      title: '重点联动事项',
      description: '将长文案压缩为短项，首屏只展示最值得看的动作。',
      tags: ['闭环', '右侧'],
      colSpan: 4,
      items: [
        card('终端与账号复合风险', '终端、账号、导出行为形成复合风险链。', '高危', '建议优先锁定终端并二次校验账号口令。', 'danger'),
        card('签批服务高峰关注', '业务高峰时段服务时延有抬升趋势。', '420 毫秒', '建议下钻业务链路查看网关和数据库依赖。', 'warning'),
        card('主机资源健康', '运维域当前整体稳定，少量主机处于延迟态。', '168 台在线', '可从运维态势查看来源、热点进程与告警。', 'success')
      ]
    },
    {
      kind: 'matrix',
      code: 'overview-matrix',
      title: '主题健康矩阵',
      description: '按主题域观察当前健康度、变化趋势与责任归属。',
      tags: ['矩阵', '治理'],
      colSpan: 6,
      items: [
        matrix('安全域', '安全保密组', '74', '高危告警待处置', '高危 4 条', '零信任 / 审计', '重点关注高危风险与策略闭环。', 'warning'),
        matrix('业务域', '业务运行组', '88', '服务稳定', '成功率 99.3%', '业务链路 / 网关', '核心服务稳定，峰值时延需要持续跟踪。', 'success'),
        matrix('终端域', '终端保障组', '79', '人员关联待补', '待认领 9 台', '终端管理 / 网关', '需尽快补齐人员手机号与终端归属。', 'warning'),
        matrix('运维域', '平台运维组', '84', '来源健康', '延迟主机 5 台', 'Probe / External', '多源接入正常，少量主机未按时刷新。', 'success')
      ]
    },
    {
      kind: 'signals',
      code: 'overview-signals',
      title: '最新联动信号',
      description: '突出跨域事件而不是长流水。',
      tags: ['信号', '右侧'],
      colSpan: 6,
      items: [
        signal('安全关注', '深夜异常导出与终端风险叠加', '来自终端域和安全域的风险信号在综合中枢完成聚合。', '建议联动三员审批核查', 'danger'),
        signal('业务关注', '签批链路出现短时积压', '业务域提示网关到数据库的时延在高峰期抬升。', '建议查看业务拓扑依赖', 'warning'),
        signal('建设建议', '外部系统接口仍可继续扩充', '当前前端已支持多源占位，后续可平滑接入业务与资产平台。', '前端可先行迭代', 'info')
      ]
    }
  ];
}

function buildSecuritySections(): SituationSection[] {
  const nodes = [
    sceneNode('security-center', '安全策略中枢', 'policy', 'warning', 44, 48, '策略命中、告警研判、联动处置', '高危事件', '4 条'),
    sceneNode('security-boundary', '边界防护', 'gateway', 'success', 18, 22, '边界访问控制与网关策略', '拦截率', '98.4%'),
    sceneNode('security-account', '账号安全', 'person', 'warning', 18, 72, '账号口令、认证与权限异常', '异常账号', '6 个'),
    sceneNode('security-terminal', '终端安全', 'terminal', 'warning', 70, 22, '终端状态与密码模块异常', '高风险终端', '6 台'),
    sceneNode('security-data', '数据对象', 'database', 'danger', 70, 72, '敏感数据导出与访问异常', '异常导出', '2 次'),
    sceneNode('security-response', '处置闭环', 'alert', 'success', 86, 48, '研判、加固、留痕与复盘', '闭环率', '85%')
  ];

  const links: VisualLink[] = [
    { from: 'security-boundary', to: 'security-center', tone: 'success' },
    { from: 'security-account', to: 'security-center', tone: 'warning' },
    { from: 'security-center', to: 'security-terminal', tone: 'warning' },
    { from: 'security-center', to: 'security-data', tone: 'danger' },
    { from: 'security-center', to: 'security-response', tone: 'success' }
  ];

  return [
    sectionRelation('security-scene', '风险链路总览', '从边界、账号、终端、数据四类对象观察攻击面与处置路径。', nodes, links, ['主视觉', '风险链路']),
    {
      kind: 'miniTrendGroup',
      code: 'security-mini-trends',
      title: '安全关键指标',
      description: '首屏保留关键数值与简要趋势。',
      tags: ['趋势', '左侧'],
      colSpan: 4,
      items: [
        trend('risk', '高危告警', '4 条', 58, 'danger', '较上一时段 +1'),
        trend('policy', '策略命中', '96.8%', 97, 'success', '边界与终端策略持续生效'),
        trend('terminal', '高风险终端', '6 台', 42, 'warning', '需联动终端保障组'),
        trend('account', '异常账号', '6 个', 38, 'warning', '需审计复核')
      ]
    },
    {
      kind: 'drilldownSummary',
      code: 'security-focus',
      title: '研判建议',
      description: '用短句呈现高价值动作建议。',
      tags: ['右侧', '处置'],
      colSpan: 4,
      items: [
        card('优先核查异常导出', '异常导出叠加高风险终端，需优先研判。', '优先级高', '建议核查导出对象与账号授权范围。', 'danger'),
        card('账号二次核验', '异常账号存在跨区域登录与敏感访问。', '6 个账号', '建议触发二次核验并收紧临时权限。', 'warning'),
        card('终端策略巡检', '部分终端密码模块处于异常或降级状态。', '9 台关注', '建议查看终端页的人员关联与策略命中详情。', 'warning')
      ]
    },
    {
      kind: 'signals',
      code: 'security-hot-events',
      title: '高危事件流',
      description: '围绕安全闭环展示最新关键信号。',
      tags: ['事件', '右侧'],
      colSpan: 4,
      items: [
        signal('高危', '敏感数据深夜导出', '与账号异常登录和终端风险信号形成关联。', '建议立即复核审批链路', 'danger'),
        signal('关注', '边界策略连续命中异常访问', '边界网关持续命中相似访问模式。', '建议联动账号黑名单', 'warning'),
        signal('提示', '新增外部来源待接入', '可补充账号画像和策略中心数据。', '不阻塞前端展示', 'info')
      ]
    },
    {
      kind: 'timeline',
      code: 'security-timeline',
      title: '处置闭环时间线',
      description: '帮助快速理解“发生了什么、如何处置、谁来确认”。',
      tags: ['闭环', '底部'],
      colSpan: 12,
      items: [
        timeline('19:12', '生成复合风险事件', '终端风险、账号异常与数据导出被统一聚合。', '安全研判引擎', 'danger'),
        timeline('19:18', '下发账号复核任务', '安全管理员发起账号授权范围复核。', '安全管理员', 'warning'),
        timeline('19:26', '终端侧执行隔离策略', '终端保障组对高风险终端执行临时访问收敛。', '终端保障组', 'warning'),
        timeline('19:42', '审计管理员追加留痕', '补录风险研判过程与处置结论。', '审计管理员', 'success')
      ]
    }
  ];
}

function buildBusinessSections(): SituationSection[] {
  const nodes = [
    sceneNode('business-center', '核心业务链路', 'domain', 'success', 44, 48, '围绕核心业务的服务依赖与运行态势', '成功率', '99.3%'),
    sceneNode('business-msg', '密信服务', 'service', 'success', 20, 22, '主消息能力', '业务量', '132 万'),
    sceneNode('business-approve', '签批服务', 'service', 'warning', 20, 74, '高峰时延关注', '时延', '420 毫秒'),
    sceneNode('business-gateway', '统一网关', 'gateway', 'success', 68, 20, '入口汇聚与路由分流', '成功率', '99.7%'),
    sceneNode('business-policy', '策略服务', 'policy', 'success', 68, 74, '鉴权与流程控制', '规则命中', '98.9%'),
    sceneNode('business-db', '业务数据库', 'database', 'warning', 84, 48, '高峰期写入压力抬升', '积压', '12 队列')
  ];

  const links: VisualLink[] = [
    { from: 'business-msg', to: 'business-center', tone: 'success' },
    { from: 'business-approve', to: 'business-center', tone: 'warning' },
    { from: 'business-center', to: 'business-gateway', tone: 'success' },
    { from: 'business-center', to: 'business-policy', tone: 'success' },
    { from: 'business-center', to: 'business-db', tone: 'warning' }
  ];

  return [
    sectionRelation('business-scene', '业务依赖拓扑', '将核心业务系统、网关、策略与数据库关系集中到中枢视图。', nodes, links, ['主视觉', '业务依赖']),
    {
      kind: 'miniTrendGroup',
      code: 'business-mini-trends',
      title: '业务运行摘要',
      description: '聚焦业务量、成功率、时延与积压。',
      tags: ['左侧', '趋势'],
      colSpan: 4,
      items: [
        trend('volume', '业务量', '132 万', 88, 'success', '较昨日 +6%'),
        trend('sla', '成功率', '99.3%', 99, 'success', '主链路稳定'),
        trend('latency', '高峰时延', '420 毫秒', 48, 'warning', '签批链路需持续观察'),
        trend('backlog', '积压队列', '12', 30, 'warning', '数据库写入压力抬升')
      ]
    },
    {
      kind: 'drilldownSummary',
      code: 'business-recommend',
      title: '恢复与优化建议',
      description: '将长文本建议收敛为可执行动作。',
      tags: ['右侧', '建议'],
      colSpan: 4,
      items: [
        card('优先查看签批链路', '签批服务是当前最值得下钻的对象。', '420 毫秒', '建议从签批服务到数据库链路逐级排查。', 'warning'),
        card('数据库写入平滑', '数据库在高峰期出现短时积压。', '12 队列', '建议评估写入限流或异步化策略。', 'warning'),
        card('网关分流正常', '统一网关当前分流正常，入口成功率稳定。', '99.7%', '可将排查重点放在下游服务和数据层。', 'success')
      ]
    },
    {
      kind: 'matrix',
      code: 'business-matrix',
      title: '关键服务清单',
      description: '压缩文本比重，突出服务责任与运行状态。',
      tags: ['矩阵', '治理'],
      colSpan: 6,
      items: [
        matrix('密信服务', '业务运行组', '92', '稳定', '业务量持续增长', '业务链路平台', '当前服务稳定，适合作为健康基线。', 'success'),
        matrix('签批服务', '业务运行组', '79', '时延关注', '高峰期抬升', '网关 / 数据库', '建议结合数据库写入与网关路由进一步排查。', 'warning'),
        matrix('统一网关', '平台运维组', '90', '稳定', '成功率 99.7%', '网关监控', '入口层稳定，为链路分流提供支撑。', 'success'),
        matrix('业务数据库', '数据库运维组', '76', '积压关注', '高峰写入抬升', '数据库监控', '需持续观察写入压力与慢查询走势。', 'warning')
      ]
    },
    {
      kind: 'signals',
      code: 'business-signals',
      title: '受影响链路',
      description: '从业务影响角度压缩展示重点。',
      tags: ['右侧', '影响'],
      colSpan: 6,
      items: [
        signal('关注', '签批服务高峰时延抬升', '下游数据库队列积压导致响应时间抬升。', '建议联动运维域观察资源情况', 'warning'),
        signal('稳定', '统一网关入口成功率保持高位', '入口层处理稳定，为分流与限流提供支撑。', '可作为业务健康基线', 'success'),
        signal('提示', '后续可接入更多业务日志来源', '前端已支持更丰富的业务节点和关系图扩展。', '无需推翻现有页面结构', 'info')
      ]
    }
  ];
}

const PAGES: Record<SituationPageCode, SituationPage> = {
  overview: {
    code: 'overview',
    name: '综合态势',
    title: '综合态势指挥舱',
    subtitle: '统一联动四域态势与处置闭环',
    location: '综合态势中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '首屏聚焦综合健康度、联动闭环率和四域主视觉，不再用长表格堆叠页面。',
    heroTags: [
      { label: '综合健康度', value: '82 分', tone: 'success' },
      { label: '待处置告警', value: '28 条', tone: 'warning' },
      { label: '来源就绪度', value: '91%', tone: 'success' },
      { label: '联动闭环率', value: '87%', tone: 'success' }
    ],
    actions: [
      { label: '重点', detail: '优先核查跨域复合风险和高峰时段业务链路。', tone: 'warning' },
      { label: '建设', detail: '后端接口未定部分先用多源占位，前端结构已可持续扩展。', tone: 'info' }
    ],
    kpis: [
      kpi('综合健康度', '82', '四域综合评分', 'success', '分', '+3'),
      kpi('待处置告警', '28', '当前未完成闭环的重点事项', 'warning', '条', '-2'),
      kpi('高危联动', '4', '需要三域协同确认的事件', 'danger', '起', '持平'),
      kpi('终端待认领', '9', '需要补齐人员手机号与归属', 'warning', '台', '-1'),
      kpi('在线主机', '168', '资源态势在线主机数量', 'success', '台', '+6'),
      kpi('业务成功率', '99.3', '核心业务链路成功率', 'success', '%', '+0.2')
    ],
    highlights: [
      highlight('跨域复合风险', '终端、账号、导出行为形成一条清晰风险链。', '高危', '建议从综合中枢直接下钻', 'danger'),
      highlight('资源态势稳定', '运维域在线主机数量和来源健康度整体稳定。', '168 台在线', '少量主机延迟上报', 'success')
    ],
    sections: buildOverviewSections()
  },
  security: {
    code: 'security',
    name: '安全态势',
    title: '安全风险链路舱',
    subtitle: '攻击面、风险链路与处置闭环',
    location: '安全保密中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '用拓扑化主视觉替代长清单，突出边界、账号、终端、数据对象之间的风险链路。',
    heroTags: [
      { label: '高危告警', value: '4 条', tone: 'danger' },
      { label: '策略命中', value: '96.8%', tone: 'success' },
      { label: '异常账号', value: '6 个', tone: 'warning' },
      { label: '高风险终端', value: '6 台', tone: 'warning' }
    ],
    actions: [
      { label: '重点', detail: '优先关注敏感数据深夜导出与异常账号交叉信号。', tone: 'danger' },
      { label: '处置', detail: '推荐从账号复核、终端隔离、审批链路审计三步推进。', tone: 'warning' }
    ],
    kpis: [
      kpi('高危告警', '4', '待处置高危安全事件', 'danger', '条', '+1'),
      kpi('策略命中', '96.8', '边界与终端策略命中率', 'success', '%', '+0.4'),
      kpi('异常账号', '6', '需要核验的账号数量', 'warning', '个', '持平'),
      kpi('高风险终端', '6', '需要联动终端页处置的设备', 'warning', '台', '+2'),
      kpi('敏感导出', '2', '异常导出次数', 'danger', '次', '持平'),
      kpi('闭环率', '85', '安全处置闭环率', 'success', '%', '+3')
    ],
    highlights: [
      highlight('敏感导出行为', '异常导出叠加账号与终端风险，是当前最需要优先处置的链路。', '优先级高', '建议直接下钻数据对象节点', 'danger')
    ],
    sections: buildSecuritySections()
  },
  business: {
    code: 'business',
    name: '业务态势',
    title: '业务链路驾驶舱',
    subtitle: '服务依赖、链路健康与恢复建议',
    location: '业务运行中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '围绕核心业务拓扑、服务等级与依赖关系组织首屏，让业务页更像指挥舱而不是说明文档。',
    heroTags: [
      { label: '业务量', value: '132 万', tone: 'success' },
      { label: '成功率', value: '99.3%', tone: 'success' },
      { label: '高峰时延', value: '420 毫秒', tone: 'warning' },
      { label: '积压队列', value: '12', tone: 'warning' }
    ],
    actions: [
      { label: '重点', detail: '签批服务与数据库写入是当前排查重点。', tone: 'warning' },
      { label: '优化', detail: '优先从链路依赖入手，而不是继续堆更多表格。', tone: 'info' }
    ],
    kpis: [
      kpi('业务量', '132', '核心业务处理总量', 'success', '万', '+6%'),
      kpi('成功率', '99.3', '核心业务成功率', 'success', '%', '+0.2'),
      kpi('高峰时延', '420', '签批链路高峰响应时间', 'warning', '毫秒', '+35'),
      kpi('积压队列', '12', '数据库写入积压', 'warning', '个', '+2'),
      kpi('链路告警', '5', '当前业务相关告警', 'warning', '条', '-1'),
      kpi('恢复建议', '3', '自动生成建议数', 'info', '项', '新增')
    ],
    highlights: [
      highlight('签批链路', '签批链路在高峰期的压力最值得重点观察。', '420 毫秒', '建议下钻服务拓扑', 'warning')
    ],
    sections: buildBusinessSections()
  },
  terminal: {
    code: 'terminal',
    name: '终端态势',
    title: '终端资产态势',
    subtitle: '终端、人员、异常事件一体呈现',
    location: '终端保障中心',
    lastUpdated: '2026-07-08 19:18',
    dataMode: 'mock',
    summary: '终端态势已切换到独立页面，这里保留与主题页结构兼容的占位数据。',
    heroTags: [
      { label: '在线终端', value: '131 台', tone: 'success' },
      { label: '高风险终端', value: '6 台', tone: 'warning' },
      { label: '待认领终端', value: '9 台', tone: 'warning' },
      { label: '异常事件', value: '18 条', tone: 'warning' }
    ],
    actions: [{ label: '提示', detail: '终端态势请通过独立路由查看资产图标化页面。', tone: 'info' }],
    kpis: [
      kpi('在线终端', '131', '终端在线数量', 'success', '台'),
      kpi('高风险终端', '6', '需要重点处置', 'warning', '台'),
      kpi('待认领终端', '9', '需补齐归属关系', 'warning', '台'),
      kpi('来源数量', '2', '当前接入终端来源', 'info', '个'),
      kpi('密码模块异常', '4', '需要关注的终端', 'warning', '台'),
      kpi('软件变更', '11', '近 24 小时变化', 'warning', '台')
    ],
    highlights: [highlight('已迁移', '终端主题已由独立页面承载。', '独立页', '点击左侧导航访问终端态势', 'info')],
    sections: [
      {
        kind: 'drilldownSummary',
        code: 'terminal-guide',
        title: '使用说明',
        description: '当前主题数据仅作为兼容占位。',
        tags: ['占位'],
        colSpan: 12,
        items: [card('请查看终端态势页', '终端态势已具备资产图标化、聚类和详情抽屉。', '已迁移', '通过左侧导航进入终端态势页面。', 'info')]
      }
    ]
  }
};

export async function getMockSituationPage(pageCode: SituationPageCode) {
  const page = PAGES[pageCode];
  if (!page) {
    throw new Error(`未找到 ${pageCode} 的态势页面 mock。`);
  }

  return structuredClone(page);
}
