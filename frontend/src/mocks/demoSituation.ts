import { reactive } from 'vue';

import type {
  DemoActivity,
  DemoEquipment,
  DemoHopType,
  DemoLinkType,
  DemoMessageMetrics,
  DemoPerson,
  DemoRegion,
  DemoRoute,
  DemoRouteHop,
  DemoRouteSwitch,
  DemoSatellite,
  DemoSituationScenario,
  DemoSigningMetrics,
  DemoSuiteStatus,
  DemoSystemTrafficItem
} from '@/types/demoSituation';

interface RegionSeed {
  countryCode: string;
  countryName: string;
  city: string;
  longitude: number;
  latitude: number;
  people: number;
  online: number;
  healthy: number;
  degraded: number;
  department: string;
  trafficGb: number;
  uplinkMbps: number;
  downlinkMbps: number;
  linkType: DemoLinkType;
  satelliteId?: string;
  message: DemoMessageMetrics;
  signing: DemoSigningMetrics;
}

const names = [
  '陈默', '周航', '林川', '赵宁', '孙悦', '何远', '许嘉', '郑桐', '高原', '唐婧',
  '韩旭', '曹瑞', '梁安', '罗清', '冯辰', '彭越', '蒋文', '邹明', '白杨', '邵晨',
  '马原', '柳青', '方舟', '文澜', '顾城', '苏芮'
];

const regionSeeds: RegionSeed[] = [
  { countryCode: 'CN', countryName: '中国', city: '北京', longitude: 116.4, latitude: 39.9, people: 1, online: 1, healthy: 1, degraded: 0, department: '北京通信保障中心', trafficGb: 0, uplinkMbps: 0, downlinkMbps: 0, linkType: 'ground', message: { login: 1, logout: 0, sentMessages: 8, receivedMessages: 10, sentFiles: 2, receivedFiles: 3 }, signing: { received: 4, processed: 4, pending: 0, exception: 0 } },
  { countryCode: 'AE', countryName: '阿联酋', city: '阿布扎比', longitude: 54.4, latitude: 24.3, people: 5, online: 4, healthy: 3, degraded: 1, department: '西亚业务保障组', trafficGb: 3.2, uplinkMbps: 3.6, downlinkMbps: 5.1, linkType: 'satellite', satelliteId: 'sat-1', message: { login: 5, logout: 1, sentMessages: 34, receivedMessages: 38, sentFiles: 11, receivedFiles: 13 }, signing: { received: 18, processed: 14, pending: 3, exception: 1 } },
  { countryCode: 'SG', countryName: '新加坡', city: '新加坡', longitude: 103.8, latitude: 1.3, people: 4, online: 4, healthy: 4, degraded: 0, department: '东南亚业务保障组', trafficGb: 2.4, uplinkMbps: 2.8, downlinkMbps: 4.0, linkType: 'ground', message: { login: 5, logout: 1, sentMessages: 27, receivedMessages: 31, sentFiles: 8, receivedFiles: 9 }, signing: { received: 14, processed: 11, pending: 3, exception: 0 } },
  { countryCode: 'DE', countryName: '德国', city: '柏林', longitude: 10.4, latitude: 51.1, people: 4, online: 3, healthy: 3, degraded: 1, department: '欧洲业务保障组', trafficGb: 2.3, uplinkMbps: 2.5, downlinkMbps: 3.8, linkType: 'ground', message: { login: 4, logout: 1, sentMessages: 25, receivedMessages: 27, sentFiles: 7, receivedFiles: 8 }, signing: { received: 13, processed: 10, pending: 2, exception: 1 } },
  { countryCode: 'KE', countryName: '肯尼亚', city: '内罗毕', longitude: 37.9, latitude: 0.2, people: 3, online: 3, healthy: 3, degraded: 0, department: '非洲业务保障组', trafficGb: 1.8, uplinkMbps: 2.1, downlinkMbps: 3.0, linkType: 'satellite', satelliteId: 'sat-1', message: { login: 3, logout: 0, sentMessages: 17, receivedMessages: 20, sentFiles: 5, receivedFiles: 7 }, signing: { received: 10, processed: 8, pending: 2, exception: 0 } },
  { countryCode: 'BR', countryName: '巴西', city: '巴西利亚', longitude: -51.9, latitude: -14.2, people: 3, online: 2, healthy: 2, degraded: 1, department: '南美业务保障组', trafficGb: 1.8, uplinkMbps: 1.8, downlinkMbps: 2.7, linkType: 'satellite', satelliteId: 'sat-2', message: { login: 2, logout: 0, sentMessages: 15, receivedMessages: 16, sentFiles: 4, receivedFiles: 5 }, signing: { received: 9, processed: 7, pending: 1, exception: 1 } },
  { countryCode: 'CA', countryName: '加拿大', city: '多伦多', longitude: -79.4, latitude: 43.7, people: 2, online: 0, healthy: 0, degraded: 0, department: '北美备用保障组', trafficGb: 0, uplinkMbps: 0, downlinkMbps: 0, linkType: 'ground', message: { login: 0, logout: 0, sentMessages: 0, receivedMessages: 0, sentFiles: 0, receivedFiles: 0 }, signing: { received: 0, processed: 0, pending: 0, exception: 0 } },
  { countryCode: 'AU', countryName: '澳大利亚', city: '悉尼', longitude: 151.2, latitude: -33.9, people: 2, online: 0, healthy: 0, degraded: 0, department: '大洋洲备用保障组', trafficGb: 0, uplinkMbps: 0, downlinkMbps: 0, linkType: 'ground', message: { login: 0, logout: 0, sentMessages: 0, receivedMessages: 0, sentFiles: 0, receivedFiles: 0 }, signing: { received: 0, processed: 0, pending: 0, exception: 0 } },
  { countryCode: 'US', countryName: '美国', city: '洛杉矶', longitude: -118.2, latitude: 34.1, people: 2, online: 0, healthy: 0, degraded: 0, department: '北美备用保障组', trafficGb: 0, uplinkMbps: 0, downlinkMbps: 0, linkType: 'ground', message: { login: 0, logout: 0, sentMessages: 0, receivedMessages: 0, sentFiles: 0, receivedFiles: 0 }, signing: { received: 0, processed: 0, pending: 0, exception: 0 } }
];

const securityEventTime = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60000).toISOString();

const securityEvents: DemoActivity[] = [
  { id: 'sec-001', type: 'security', title: '境外地址异常登录尝试', detail: '阿布扎比节点连续 5 次登录失败，已触发锁定策略', minutesAgo: 6, occurredAt: securityEventTime(6), securityLevel: 'high', tone: 'danger' },
  { id: 'sec-002', type: 'security', title: '高危文件被拦截隔离', detail: '密信附件命中未知哈希，已隔离并上报', minutesAgo: 15, occurredAt: securityEventTime(15), securityLevel: 'high', tone: 'danger' },
  { id: 'sec-003', type: 'security', title: '密盒证书即将到期', detail: '密盒证书有效期不足 30 天，建议尽快更换', minutesAgo: 28, occurredAt: securityEventTime(28), securityLevel: 'medium', tone: 'warning' },
  { id: 'sec-004', type: 'security', title: '身份密钥认证异常', detail: '身份密钥介质未响应，已转人工核验', minutesAgo: 41, occurredAt: securityEventTime(41), securityLevel: 'medium', tone: 'warning' },
  { id: 'sec-005', type: 'security', title: '境外链路流量异常', detail: '下行速率接近告警基线，持续观察中', minutesAgo: 55, occurredAt: securityEventTime(55), securityLevel: 'notice', tone: 'info' }
];

function allocate(total: number, count: number, index: number) {
  const base = Math.floor(total / count);
  return base + (index < total % count ? 1 : 0);
}

function statusAt(seed: RegionSeed, index: number): DemoSuiteStatus {
  if (index < seed.healthy) return 'healthy';
  if (index < seed.healthy + seed.degraded) return 'degraded';
  return 'offline';
}

function equipmentFor(personIndex: number, status: DemoSuiteStatus, online: boolean): DemoEquipment[] {
  const sequence = String(personIndex + 1).padStart(3, '0');
  const degradedOrder = [4, 9, 13, 19];
  const degradedIndex = degradedOrder.indexOf(personIndex);
  const active = status !== 'offline';
  const cryptoReady = active && degradedIndex !== 2;
  const keyReady = active && degradedIndex !== 0;
  const satelliteReady = active && degradedIndex !== 1 && degradedIndex !== 3;

  return [
    { type: 'pad', label: '终端 PAD', code: `PAD-${sequence}`, status: active ? 'online' : 'offline', statusLabel: active ? '在线' : '离线', version: 'SecureOS 4.8.2', detail: active ? '最近心跳正常' : '超过 30 分钟未上报', tone: active ? 'success' : 'danger' },
    { type: 'crypto-box', label: '密盒', code: `CRYPTO-${sequence}`, status: cryptoReady ? 'ready' : active ? 'degraded' : 'offline', statusLabel: cryptoReady ? '就绪' : active ? '证书待更新' : '离线', version: 'GMBox 3.6.1', detail: cryptoReady ? '国密模块与证书状态正常' : active ? '证书有效期不足 30 天' : '未检测到设备', tone: cryptoReady ? 'success' : active ? 'warning' : 'danger' },
    { type: 'key', label: '身份密钥', code: `KEY-${sequence}`, status: keyReady ? 'ready' : active ? 'degraded' : 'offline', statusLabel: keyReady ? '可用' : active ? '待关注' : '离线', version: '密钥介质 2.1', detail: keyReady ? '身份密钥认证正常' : active ? '密钥有效期即将到期' : '未检测到密钥', tone: keyReady ? 'success' : active ? 'warning' : 'danger' },
    { type: 'message-app', label: '密信软件', code: `MSG-${sequence}`, status: online ? 'logged-in' : active ? 'available' : 'offline', statusLabel: online ? '已登录' : active ? '未登录' : '离线', version: '5.4.7', detail: online ? '会话保持正常' : active ? '软件运行，当前无用户会话' : '终端离线', tone: online ? 'success' : active ? 'info' : 'danger' },
    { type: 'signing-app', label: '签阅软件', code: `SIGN-${sequence}`, status: active ? 'available' : 'offline', statusLabel: active ? '可用' : '离线', version: '2.9.3', detail: active ? '签阅服务连接正常' : '终端离线', tone: active ? 'success' : 'danger' },
    { type: 'satellite', label: '卫星终端', code: `SAT-${sequence}`, status: satelliteReady ? 'connected' : active ? 'degraded' : 'offline', statusLabel: satelliteReady ? '通联' : active ? '链路降级' : '离线', version: 'SATCOM 2.3', detail: satelliteReady ? '已接入 50 Mbps 共享链路' : active ? '信号质量低于基线' : '链路未建立', tone: satelliteReady ? 'success' : active ? 'warning' : 'danger' }
  ];
}

function activitiesFor(person: DemoPerson): DemoActivity[] {
  const items: DemoActivity[] = [];
  if (person.online) {
    items.push({ id: `${person.id}-login`, type: 'login', title: '密信登录成功', detail: `${person.equipment[0].code} 已建立安全会话`, minutesAgo: person.lastActiveMinutes + 18, tone: 'success' });
  }
  if (person.message.receivedMessages > 0) {
    items.push({ id: `${person.id}-message`, type: 'message', title: '接收密信消息', detail: `今日累计接收 ${person.message.receivedMessages} 条消息`, minutesAgo: person.lastActiveMinutes + 8, tone: 'info' });
  }
  if (person.signing.processed > 0) {
    items.push({ id: `${person.id}-signing`, type: 'signing', title: '完成文件签阅', detail: `今日已处理 ${person.signing.processed} 份文件`, minutesAgo: person.lastActiveMinutes, tone: 'success' });
  }
  if (person.suiteStatus === 'degraded') {
    items.push({ id: `${person.id}-warning`, type: 'security', title: '装备套件降级', detail: person.equipment.find((item) => item.tone === 'warning')?.detail ?? '部分装备需要关注', minutesAgo: 32, tone: 'warning' });
  }
  return items;
}

let globalIndex = 0;
const regions: DemoRegion[] = regionSeeds.map((seed) => {
  const people: DemoPerson[] = Array.from({ length: seed.people }, (_, index) => {
    const personIndex = globalIndex++;
    const status = statusAt(seed, index);
    const online = index < seed.online;
    const sequence = String(personIndex + 1).padStart(3, '0');
    const message: DemoMessageMetrics = {
      login: allocate(seed.message.login, seed.people, index),
      logout: allocate(seed.message.logout, seed.people, index),
      sentMessages: allocate(seed.message.sentMessages, seed.people, index),
      receivedMessages: allocate(seed.message.receivedMessages, seed.people, index),
      sentFiles: allocate(seed.message.sentFiles, seed.people, index),
      receivedFiles: allocate(seed.message.receivedFiles, seed.people, index)
    };
    const signing: DemoSigningMetrics = {
      received: allocate(seed.signing.received, seed.people, index),
      processed: allocate(seed.signing.processed, seed.people, index),
      pending: allocate(seed.signing.pending, seed.people, index),
      exception: allocate(seed.signing.exception, seed.people, index)
    };
    const person: DemoPerson = {
      id: `person-${sequence}`,
      code: `RY-${sequence}`,
      name: names[personIndex],
      department: seed.department,
      countryCode: seed.countryCode,
      countryName: seed.countryName,
      city: seed.city,
      online,
      suiteStatus: status,
      suiteStatusLabel: status === 'healthy' ? '套件正常' : status === 'degraded' ? '套件降级' : '人员离线',
      lastActiveMinutes: online ? 2 + (personIndex * 3) % 13 : 34 + personIndex,
      primaryIp: `10.${20 + regionSeeds.indexOf(seed)}.${10 + index}.${30 + personIndex}`,
      equipment: equipmentFor(personIndex, status, online),
      message,
      signing,
      activities: []
    };
    person.activities = activitiesFor(person);
    return person;
  });

  return {
    countryCode: seed.countryCode,
    countryName: seed.countryName,
    city: seed.city,
    longitude: seed.longitude,
    latitude: seed.latitude,
    people,
    trafficGb: seed.trafficGb,
    uplinkMbps: seed.uplinkMbps,
    downlinkMbps: seed.downlinkMbps,
    linkType: seed.linkType,
    satelliteId: seed.satelliteId
  };
});

const people = regions.flatMap((region) => region.people);

// 生成“A 发送给 B”的收发关系：每人按发送量在近地/同区域人员中分配主要接收对象。
// 接收来源按收到的消息量在全体人员中分配，保证发送与接收关系可互相印证。
function pickWeighted(count: number, pool: DemoPerson[]): DemoPerson[] {
  const result: DemoPerson[] = [];
  const weighted = [...pool];
  while (result.length < count && weighted.length) {
    const slice = weighted.slice(0, Math.max(1, Math.ceil(weighted.length / 2)));
    const index = Math.floor(Math.random() * slice.length);
    const picked = slice[index];
    if (!result.includes(picked)) result.push(picked);
    weighted.splice(weighted.indexOf(picked), 1);
  }
  return result;
}

people.forEach((person) => {
  const sameRegion = people.filter((item) => item.id !== person.id && item.countryCode === person.countryCode);
  const nearby = people.filter((item) => item.id !== person.id && item.countryCode !== person.countryCode);
  const recipientPool = [...sameRegion, ...nearby];
  const recipients = pickWeighted(Math.min(3, Math.max(1, recipientPool.length)), recipientPool);
  const senderPool = people.filter((item) => item.id !== person.id);
  const senders = pickWeighted(Math.min(3, senderPool.length), senderPool);

  person.message.topRecipients = recipients.map((target, index) => ({
    personId: target.id,
    count: Math.max(1, Math.round(person.message.sentMessages / recipients.length) + (index === 0 ? person.message.sentMessages % recipients.length : 0))
  })).filter((item) => item.count > 0);
  person.message.topSenders = senders.map((target, index) => ({
    personId: target.id,
    count: Math.max(1, Math.round(person.message.receivedMessages / senders.length) + (index === 0 ? person.message.receivedMessages % senders.length : 0))
  })).filter((item) => item.count > 0);
});

// 将初始安全事件关联到对应人员：异常登录→阿联酋、证书到期→新加坡、密钥异常→阿联酋等。
const initialEventPersonIndexes = [1, 7, 9, 4, 13];
securityEvents.forEach((event, index) => {
  event.personId = people[initialEventPersonIndexes[index]]?.id;
});

const initialTimes = Array.from({ length: 7 }, (_, i) =>
  new Date(Date.now() - (6 - i) * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
);

// —— 多跳业务路由 ——
// 每条路由：北京接入中心 → 多跳中继 → 站点。主路由为当前生效线路，备用路由待命，
// 遭受攻击时由智能分析生成切换策略下发。
type RouteHopSeed = { name: string; type: DemoHopType; coord: [number, number]; latencyMs: number; packetLossPct: number; throughputMbps: number; note: string };
type RouteSeed = { countryCode: string; name: string; kind: 'primary' | 'backup'; hops: RouteHopSeed[] };

const routeSeeds: RouteSeed[] = [
  // 阿联酋：卫星主路由 + 海底光缆备路由
  {
    countryCode: 'AE',
    name: '北京 → 阿布扎比（卫星主路由）',
    kind: 'primary',
    hops: [
      { name: '北京信关站 G1', type: 'gateway', coord: [117.5, 39.8], latencyMs: 3, packetLossPct: 0.1, throughputMbps: 14.5, note: '北京信关站上行业务接入' },
      { name: '卫-1 印度洋中继星', type: 'satellite', coord: [40, 95], latencyMs: 118, packetLossPct: 1.8, throughputMbps: 11.2, note: '卫星中继：北京 ↔ 西亚' },
      { name: '阿布扎比信关站 G2', type: 'gateway', coord: [54.6, 23.8], latencyMs: 42, packetLossPct: 0.4, throughputMbps: 12.6, note: '阿布扎比信关站下行接入' }
    ]
  },
  {
    countryCode: 'AE',
    name: '北京 → 阿布扎比（海底光缆备路由）',
    kind: 'backup',
    hops: [
      { name: '华南中继 R1', type: 'terrestrial', coord: [112, 22], latencyMs: 12, packetLossPct: 0.2, throughputMbps: 13.8, note: '华南陆缆骨干' },
      { name: '马六甲海缆中继', type: 'submarine', coord: [99, 4], latencyMs: 58, packetLossPct: 0.5, throughputMbps: 12.4, note: '南海—马六甲海缆' },
      { name: '印度洋海缆中继', type: 'submarine', coord: [72, -5], latencyMs: 96, packetLossPct: 0.6, throughputMbps: 11.8, note: '印度洋海缆主干' },
      { name: '迪拜陆缆站', type: 'terrestrial', coord: [55.2, 25.2], latencyMs: 38, packetLossPct: 0.3, throughputMbps: 13.1, note: '波斯湾陆缆接入' }
    ]
  },
  // 新加坡：陆缆主路由 + 海底光缆备路由
  {
    countryCode: 'SG',
    name: '北京 → 新加坡（陆缆主路由）',
    kind: 'primary',
    hops: [
      { name: '华南中继 R1', type: 'terrestrial', coord: [112, 22], latencyMs: 12, packetLossPct: 0.2, throughputMbps: 13.8, note: '华南陆缆骨干' },
      { name: '马六甲中继 R3', type: 'terrestrial', coord: [99, 4], latencyMs: 55, packetLossPct: 0.4, throughputMbps: 12.6, note: '中南半岛—马六甲陆缆' }
    ]
  },
  {
    countryCode: 'SG',
    name: '北京 → 新加坡（海底光缆备路由）',
    kind: 'backup',
    hops: [
      { name: '上海中继', type: 'terrestrial', coord: [121.5, 31.2], latencyMs: 8, packetLossPct: 0.1, throughputMbps: 14.2, note: '华东陆缆骨干' },
      { name: '南海海缆中继', type: 'submarine', coord: [114, 8], latencyMs: 42, packetLossPct: 0.6, throughputMbps: 11.9, note: '南海海底光缆' },
      { name: '新加坡海缆登陆站', type: 'submarine', coord: [103.7, 1.25], latencyMs: 18, packetLossPct: 0.2, throughputMbps: 13.4, note: '海缆登陆接入' }
    ]
  },
  // 德国：中亚陆缆主路由 + 海缆备路由
  {
    countryCode: 'DE',
    name: '北京 → 柏林（中亚陆缆主路由）',
    kind: 'primary',
    hops: [
      { name: '中亚中继 R7', type: 'terrestrial', coord: [76, 43], latencyMs: 68, packetLossPct: 0.5, throughputMbps: 12.1, note: '中亚陆缆骨干' },
      { name: '欧洲中继 R8', type: 'terrestrial', coord: [18, 49], latencyMs: 96, packetLossPct: 0.4, throughputMbps: 11.7, note: '东欧陆缆接入' }
    ]
  },
  {
    countryCode: 'DE',
    name: '北京 → 柏林（海缆备路由）',
    kind: 'backup',
    hops: [
      { name: '马六甲海缆中继', type: 'submarine', coord: [99, 4], latencyMs: 58, packetLossPct: 0.5, throughputMbps: 12.4, note: '南海—马六甲海缆' },
      { name: '红海中继', type: 'submarine', coord: [38, 22], latencyMs: 88, packetLossPct: 0.6, throughputMbps: 11.6, note: '红海海底光缆' },
      { name: '地中海中继', type: 'submarine', coord: [18, 35], latencyMs: 74, packetLossPct: 0.5, throughputMbps: 12.0, note: '地中海海底光缆' },
      { name: '柏林陆缆站', type: 'terrestrial', coord: [13.4, 52.5], latencyMs: 12, packetLossPct: 0.2, throughputMbps: 13.6, note: '欧洲陆缆接入' }
    ]
  },
  // 肯尼亚：卫星主路由 + 海缆备路由
  {
    countryCode: 'KE',
    name: '北京 → 内罗毕（卫星主路由）',
    kind: 'primary',
    hops: [
      { name: '华南中继 R1', type: 'terrestrial', coord: [112, 22], latencyMs: 12, packetLossPct: 0.2, throughputMbps: 13.8, note: '华南陆缆骨干' },
      { name: '卫-1 印度洋中继星', type: 'satellite', coord: [40, 95], latencyMs: 124, packetLossPct: 1.6, throughputMbps: 10.8, note: '卫星中继：北京 ↔ 非洲' },
      { name: '内罗毕信关站', type: 'gateway', coord: [38.2, 0.4], latencyMs: 46, packetLossPct: 0.5, throughputMbps: 12.2, note: '内罗毕信关站下行接入' }
    ]
  },
  {
    countryCode: 'KE',
    name: '北京 → 内罗毕（海缆备路由）',
    kind: 'backup',
    hops: [
      { name: '印度洋海缆中继', type: 'submarine', coord: [72, -5], latencyMs: 96, packetLossPct: 0.6, throughputMbps: 11.8, note: '印度洋海缆主干' },
      { name: '蒙巴萨海缆站', type: 'submarine', coord: [40.2, -3.5], latencyMs: 62, packetLossPct: 0.5, throughputMbps: 12.3, note: '东非海缆登陆' },
      { name: '内罗毕陆缆', type: 'terrestrial', coord: [36.8, -1.3], latencyMs: 28, packetLossPct: 0.3, throughputMbps: 13.0, note: '东非陆缆接入' }
    ]
  },
  // 巴西：卫星主路由 + 太平洋海缆备路由
  {
    countryCode: 'BR',
    name: '北京 → 巴西利亚（卫星主路由）',
    kind: 'primary',
    hops: [
      { name: '北京信关站 G1', type: 'gateway', coord: [117.5, 39.8], latencyMs: 3, packetLossPct: 0.1, throughputMbps: 14.5, note: '北京信关站上行业务接入' },
      { name: '卫-2 大西洋中继星', type: 'satellite', coord: [-55, 95], latencyMs: 142, packetLossPct: 1.9, throughputMbps: 10.4, note: '卫星中继：北京 ↔ 南美' },
      { name: '巴西利亚信关站', type: 'gateway', coord: [-52.2, -15.6], latencyMs: 34, packetLossPct: 0.4, throughputMbps: 12.8, note: '巴西利亚信关站下行接入' }
    ]
  },
  {
    countryCode: 'BR',
    name: '北京 → 巴西利亚（太平洋海缆备路由）',
    kind: 'backup',
    hops: [
      { name: '太平洋海缆中继', type: 'submarine', coord: [150, -10], latencyMs: 88, packetLossPct: 0.5, throughputMbps: 12.2, note: '西太平洋海底光缆' },
      { name: '东太平洋中继', type: 'submarine', coord: [-140, 30], latencyMs: 132, packetLossPct: 0.7, throughputMbps: 11.4, note: '东太平洋海底光缆' },
      { name: '圣地亚哥登陆站', type: 'submarine', coord: [-70, -20], latencyMs: 96, packetLossPct: 0.6, throughputMbps: 11.9, note: '南美西岸海缆登陆' },
      { name: '巴西利亚陆缆', type: 'terrestrial', coord: [-47.9, -15.8], latencyMs: 42, packetLossPct: 0.3, throughputMbps: 13.2, note: '南美陆缆骨干' }
    ]
  }
];

const BEIJING_COORD: [number, number] = [116.4, 39.9];

function buildRoutes(): DemoRoute[] {
  return routeSeeds.map((seed) => {
    const hops: DemoRouteHop[] = seed.hops.map((hop, hopIndex) => ({
      id: `hop-${seed.countryCode}-${seed.kind}-${hopIndex + 1}`,
      name: hop.name,
      type: hop.type,
      longitude: hop.coord[0],
      latitude: hop.coord[1],
      latencyMs: hop.latencyMs,
      packetLossPct: hop.packetLossPct,
      throughputMbps: hop.throughputMbps,
      status: 'normal',
      note: hop.note
    }));
    return {
      id: `route-${seed.countryCode}-${seed.kind}`,
      countryCode: seed.countryCode,
      name: seed.name,
      kind: seed.kind,
      hops,
      latencyMs: hops.reduce((sum, hop) => sum + hop.latencyMs, 0),
      status: seed.kind === 'primary' ? 'normal' : 'standby'
    };
  });
}


const scenarioData: DemoSituationScenario = {
  generatedAt: new Date().toISOString(),
  people,
  regions,
  securityEvents,
  satellites: [
    { id: 'sat-1', name: '卫-1 印度洋中继星', longitude: 75, latitude: 0, status: 'warning', bandwidthMbps: 20, utilization: 68, note: '服务西亚、非洲区域接入' },
    { id: 'sat-2', name: '卫-2 大西洋中继星', longitude: -45, latitude: 0, status: 'success', bandwidthMbps: 10, utilization: 42, note: '服务南美区域接入' }
  ],
  systemTraffic: {
    times: [...initialTimes],
    series: [
      { code: 'msg', name: '密信服务', data: [8.2, 9.1, 10.6, 12.4, 14.1, 13.2, 12.8] },
      { code: 'sign', name: '签阅服务', data: [5.4, 6.1, 7.2, 8.0, 9.4, 8.8, 8.6] },
      { code: 'crypto', name: '密盒服务', data: [3.8, 4.2, 5.1, 5.6, 6.8, 6.4, 6.2] }
    ],
    snapshot: [
      { code: 'msg', name: '密信服务', throughputMbps: 12.8, trafficGb: 4.6, peakMbps: 18.9, successRate: 99.6, tone: 'success' },
      { code: 'sign', name: '签阅服务', throughputMbps: 8.6, trafficGb: 2.9, peakMbps: 12.4, successRate: 99.2, tone: 'success' },
      { code: 'crypto', name: '密盒服务', throughputMbps: 6.2, trafficGb: 2.1, peakMbps: 9.6, successRate: 99.8, tone: 'success' }
    ]
  },
  businessTrend: {
    times: [...initialTimes],
    messageSent: [3, 5, 9, 14, 20, 18, 13],
    messageReceived: [4, 6, 10, 16, 22, 20, 14],
    fileCount: [1, 2, 3, 4, 5, 4, 3],
    signingReceived: [3, 5, 8, 13, 16, 14, 9],
    signingProcessed: [2, 4, 7, 10, 13, 11, 7],
    signingPending: [1, 2, 4, 6, 9, 12, 11]
  },
  routes: buildRoutes(),
  routeSwitches: [],
  link: {
    capacityMbps: 50,
    uplinkMbps: 12.8,
    downlinkMbps: 18.6,
    utilization: 37.2,
    trafficGb: 11.5,
    peakMbps: 38.7,
    peakUtilization: 77.4,
    threshold: 80,
    times: initialTimes,
    uplinkTrend: [2.4, 1.8, 5.6, 9.2, 15.4, 31.2, 12.8],
    downlinkTrend: [3.8, 2.6, 8.4, 13.7, 22.5, 38.7, 18.6]
  }
};

const totalsData = {
  assignedPeople: people.length,
  onlinePeople: people.filter((person) => person.online).length,
  healthySuites: people.filter((person) => person.suiteStatus === 'healthy').length,
  degradedSuites: people.filter((person) => person.suiteStatus === 'degraded').length,
  offlineSuites: people.filter((person) => person.suiteStatus === 'offline').length,
  padOnline: people.filter((person) => person.equipment.find((item) => item.type === 'pad')?.status === 'online').length,
  cryptoReady: people.filter((person) => person.equipment.find((item) => item.type === 'crypto-box')?.status === 'ready').length,
  keyReady: people.filter((person) => person.equipment.find((item) => item.type === 'key')?.status === 'ready').length,
  satelliteConnected: people.filter((person) => person.equipment.find((item) => item.type === 'satellite')?.status === 'connected').length,
  messageLoggedIn: people.filter((person) => person.equipment.find((item) => item.type === 'message-app')?.status === 'logged-in').length,
  messageAvailable: people.filter((person) => ['logged-in', 'available'].includes(person.equipment.find((item) => item.type === 'message-app')?.status ?? '')).length,
  signingAvailable: people.filter((person) => person.equipment.find((item) => item.type === 'signing-app')?.status === 'available').length,
  message: people.reduce<DemoMessageMetrics>((total, person) => ({
    login: total.login + person.message.login,
    logout: total.logout + person.message.logout,
    sentMessages: total.sentMessages + person.message.sentMessages,
    receivedMessages: total.receivedMessages + person.message.receivedMessages,
    sentFiles: total.sentFiles + person.message.sentFiles,
    receivedFiles: total.receivedFiles + person.message.receivedFiles,
    topRecipients: [],
    topSenders: []
  }), { login: 0, logout: 0, sentMessages: 0, receivedMessages: 0, sentFiles: 0, receivedFiles: 0, topRecipients: [], topSenders: [] }),
  signing: people.reduce<DemoSigningMetrics>((total, person) => ({
    received: total.received + person.signing.received,
    processed: total.processed + person.signing.processed,
    pending: total.pending + person.signing.pending,
    exception: total.exception + person.signing.exception
  }), { received: 0, processed: 0, pending: 0, exception: 0 })
};

// Reactive so every panel/chart updates as the live simulation mutates it.
export const demoSituationScenario = reactive(scenarioData) as DemoSituationScenario;
export const demoTotals = reactive(totalsData);

const TICK_SECONDS = 10;
const TICKS_PER_MINUTE = Math.round(60 / TICK_SECONDS);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;
const randomPick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const timeLabel = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

let tickCount = 0;
let securitySeq = securityEvents.length + 100;

const securityEventPool: Array<{ title: string; detail: (person: DemoPerson) => string; tone: DemoActivity['tone']; level: NonNullable<DemoActivity['securityLevel']> }> = [
  { title: '境外地址异常登录尝试', detail: (person) => `${person.countryName} ${person.city} 节点连续登录失败，已触发锁定策略`, tone: 'danger', level: 'high' },
  { title: '高危文件被拦截隔离', detail: () => '密信附件命中未知哈希，已隔离并上报', tone: 'danger', level: 'high' },
  { title: '密盒证书即将到期', detail: (person) => `${person.name} 的密盒证书有效期不足 30 天，建议尽快更换`, tone: 'warning', level: 'medium' },
  { title: '身份密钥认证异常', detail: (person) => `${person.name} 的身份密钥介质未响应，已转人工核验`, tone: 'warning', level: 'medium' },
  { title: '境外链路流量波动', detail: (person) => `${person.countryName} 方向下行速率出现波动，持续观察中`, tone: 'info', level: 'notice' },
  { title: '密信会话异地登录', detail: (person) => `${person.name} 的密信会话在非常用终端登录`, tone: 'warning', level: 'medium' }
];

function pushActivity(person: DemoPerson, activity: DemoActivity) {
  if (person.activities.length >= 6) person.activities.shift();
  person.activities.push(activity);
}

function setMessageSession(person: DemoPerson, online: boolean) {
  const app = person.equipment.find((item) => item.type === 'message-app');
  if (!app) return;
  app.status = online ? 'logged-in' : 'offline';
  app.statusLabel = online ? '已登录' : '离线';
  app.tone = online ? 'success' : 'danger';
}

function maybeFlipSessions() {
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const person = randomPick(demoSituationScenario.people);
    if (person.online) {
      person.online = false;
      setMessageSession(person, false);
      person.message.logout += 1;
      pushActivity(person, { id: `act-${Date.now()}-${i}`, type: 'logout', title: '密信登出', detail: `${person.code} 结束安全会话`, minutesAgo: 0, tone: 'info' });
    } else if (Math.random() < 0.6) {
      person.online = true;
      setMessageSession(person, true);
      person.message.login += 1;
      pushActivity(person, { id: `act-${Date.now()}-${i}`, type: 'login', title: '密信登录成功', detail: `${person.code} 已建立安全会话`, minutesAgo: 0, tone: 'success' });
    }
  }
}

function bumpBusiness() {
  const onlinePeople = demoSituationScenario.people.filter((person) => person.online);
  if (!onlinePeople.length) return;
  const person = randomPick(onlinePeople);
  const sentMessages = Math.floor(Math.random() * 3);
  const receivedMessages = Math.floor(Math.random() * 3);
  const sentFiles = Math.random() < 0.3 ? 1 : 0;
  const receivedFiles = Math.random() < 0.3 ? 1 : 0;
  person.message.sentMessages += sentMessages;
  person.message.receivedMessages += receivedMessages;
  person.message.sentFiles += sentFiles;
  person.message.receivedFiles += receivedFiles;
  if (sentMessages > 0 || receivedMessages > 0) {
    const direction = sentMessages >= receivedMessages ? '发送密信消息' : '接收密信消息';
    pushActivity(person, { id: `act-${Date.now()}-message`, type: 'message', title: direction, detail: `今日收发 ${person.message.sentMessages + person.message.receivedMessages} 条消息`, minutesAgo: 0, tone: 'info' });
  } else if (sentFiles > 0 || receivedFiles > 0) {
    pushActivity(person, { id: `act-${Date.now()}-file`, type: 'file', title: '密信文件收发', detail: `今日发送 ${person.message.sentFiles} / 接收 ${person.message.receivedFiles} 份`, minutesAgo: 0, tone: 'info' });
  }
  if (Math.random() < 0.5) {
    person.signing.received += 1;
    if (Math.random() < 0.7) {
      person.signing.processed += 1;
      pushActivity(person, { id: `act-${Date.now()}-signing`, type: 'signing', title: '完成文件签阅', detail: `今日已处理 ${person.signing.processed} 份文件`, minutesAgo: 0, tone: 'success' });
    } else {
      person.signing.pending += 1;
      pushActivity(person, { id: `act-${Date.now()}-pending`, type: 'signing', title: '新增待签阅文件', detail: `当前待处理 ${person.signing.pending} 份`, minutesAgo: 0, tone: 'warning' });
    }
  }
}

function maybeAddSecurityEvent() {
  if (Math.random() < 0.55) return;
  const template = randomPick(securityEventPool);
  const person = randomPick(demoSituationScenario.people);
  demoSituationScenario.securityEvents.unshift({
    id: `sec-${++securitySeq}`,
    type: 'security',
    title: template.title,
    detail: template.detail(person),
    minutesAgo: 0,
    occurredAt: new Date().toISOString(),
    securityLevel: template.level,
    tone: template.tone,
    personId: person.id
  });
  if (demoSituationScenario.securityEvents.length > 6) demoSituationScenario.securityEvents.pop();
}

// —— 多跳线路安全检测与智能切换 ——
interface RouteIncident {
  routeId: string;
  hopIndex: number;
  stage: 'attacked' | 'switching';
}
let routeIncident: RouteIncident | null = null;
let routeSwitchSeq = 0;

const routeAttackTemplates = [
  (hop: DemoRouteHop) => `${hop.name} 链路丢包率骤升至 ${hop.packetLossPct.toFixed(1)}%，疑似境外节点流量注入攻击`,
  (hop: DemoRouteHop) => `${hop.name} 检测到异常重传与吞吐骤降，疑似拥塞攻击`,
  (hop: DemoRouteHop) => `${hop.name} 连续握手失败，疑似中间人探测攻击`
];

// 智能分析：攻击发生后由“线路安全智能分析引擎”生成切换策略并下发。
function issueRouteSwitchPolicy(primary: DemoRoute, backup: DemoRoute, hopIndex: number) {
  const hop = primary.hops[hopIndex];
  demoSituationScenario.routeSwitches.unshift({
    id: `switch-${++routeSwitchSeq}`,
    countryCode: primary.countryCode,
    reason: `线路安全智能分析：主路由第 ${hopIndex + 1} 跳（${hop.name}）${primary.attackNote ?? '检测到链路攻击'}；综合比对各用线路健康度、时延与带宽余量，生成切换策略并下发：业务路由由「${primary.name}」切换至「${backup.name}」`,
    fromRouteId: primary.id,
    toRouteId: backup.id,
    issuedAt: new Date().toISOString(),
    status: 'issued'
  });
}

// 随机检测到一次攻击：将某主路由的一跳置为阻断并进入 attacked 阶段。
function attackRoute(route: DemoRoute, hopIndex: number) {
  const hop = route.hops[hopIndex];
  hop.status = 'blocked';
  hop.packetLossPct = 16 + Math.floor(Math.random() * 9);
  hop.throughputMbps = Math.max(0.4, Math.round(hop.throughputMbps * 0.22 * 10) / 10);
  hop.note = '遭受攻击，链路阻断';
  route.status = 'attacked';
  route.attackNote = routeAttackTemplates[Math.floor(Math.random() * routeAttackTemplates.length)](hop);
  routeIncident = { routeId: route.id, hopIndex, stage: 'attacked' };
}

// 攻击解除后回切：主路由恢复 normal，备用路由回到待命，链路参数复位。
function maybeRestoreRoute() {
  const switched = demoSituationScenario.routes.filter((route) => route.kind === 'primary' && route.status === 'switched');
  if (!switched.length || Math.random() > 0.14) return;
  const route = randomPick(switched);
  route.hops.forEach((hop) => {
    hop.status = 'normal';
    hop.packetLossPct = Math.max(0.1, Math.round((hop.packetLossPct * 0.05 + 0.2) * 10) / 10);
    hop.throughputMbps = Math.round((Math.min(14.5, hop.throughputMbps * 3.2)) * 10) / 10;
    hop.note = hop.note === '遭受攻击，链路阻断' ? '链路恢复正常' : hop.note;
  });
  route.status = 'normal';
  route.attackNote = undefined;
  const backup = demoSituationScenario.routes.find((item) => item.countryCode === route.countryCode && item.kind === 'backup');
  if (backup) backup.status = 'standby';
}

function maybeAttackRoute() {
  if (routeIncident) return;
  if (Math.random() > 0.16) return;
  const primaries = demoSituationScenario.routes.filter((route) => route.kind === 'primary' && route.status === 'normal');
  if (!primaries.length) return;
  const route = randomPick(primaries);
  attackRoute(route, Math.floor(Math.random() * route.hops.length));
}

// 每个 tick 推进一阶段：attacked → 生成策略切换（switching）→ 切换完成（switched / active）。
// 首个 tick 强制触发一次攻击，确保演示加载后立即呈现多跳攻击与切换效果。
let routeTickCount = 0;
function routeSecurityTick() {
  routeTickCount += 1;
  if (!routeIncident) {
    if (routeTickCount === 1) {
      const primaries = demoSituationScenario.routes.filter((route) => route.kind === 'primary' && route.status === 'normal');
      if (primaries.length) {
        const route = randomPick(primaries);
        attackRoute(route, Math.floor(Math.random() * route.hops.length));
      }
    } else {
      maybeAttackRoute();
      maybeRestoreRoute();
    }
    return;
  }
  const primary = demoSituationScenario.routes.find((route) => route.id === routeIncident!.routeId);
  const backup = primary
    ? demoSituationScenario.routes.find((route) => route.countryCode === primary.countryCode && route.kind === 'backup')
    : undefined;
  if (!primary || !backup) {
    routeIncident = null;
    return;
  }
  if (routeIncident.stage === 'attacked') {
    primary.status = 'switching';
    issueRouteSwitchPolicy(primary, backup, routeIncident.hopIndex);
    routeIncident.stage = 'switching';
  } else if (routeIncident.stage === 'switching') {
    primary.status = 'switched';
    backup.status = 'active';
    const policy = demoSituationScenario.routeSwitches[0];
    if (policy) policy.status = 'applied';
    routeIncident = null;
  }
}

function refreshTotals() {
  const peopleAll = demoSituationScenario.people;
  Object.assign(demoTotals, {
    assignedPeople: peopleAll.length,
    onlinePeople: peopleAll.filter((person) => person.online).length,
    healthySuites: peopleAll.filter((person) => person.suiteStatus === 'healthy').length,
    degradedSuites: peopleAll.filter((person) => person.suiteStatus === 'degraded').length,
    offlineSuites: peopleAll.filter((person) => person.suiteStatus === 'offline').length,
    padOnline: peopleAll.filter((person) => person.equipment.find((item) => item.type === 'pad')?.status === 'online').length,
    cryptoReady: peopleAll.filter((person) => person.equipment.find((item) => item.type === 'crypto-box')?.status === 'ready').length,
    keyReady: peopleAll.filter((person) => person.equipment.find((item) => item.type === 'key')?.status === 'ready').length,
    satelliteConnected: peopleAll.filter((person) => person.equipment.find((item) => item.type === 'satellite')?.status === 'connected').length,
    messageLoggedIn: peopleAll.filter((person) => person.equipment.find((item) => item.type === 'message-app')?.status === 'logged-in').length,
    messageAvailable: peopleAll.filter((person) => ['logged-in', 'available'].includes(person.equipment.find((item) => item.type === 'message-app')?.status ?? '')).length,
    signingAvailable: peopleAll.filter((person) => person.equipment.find((item) => item.type === 'signing-app')?.status === 'available').length,
    message: peopleAll.reduce<DemoMessageMetrics>((total, person) => ({
      login: total.login + person.message.login,
      logout: total.logout + person.message.logout,
      sentMessages: total.sentMessages + person.message.sentMessages,
      receivedMessages: total.receivedMessages + person.message.receivedMessages,
      sentFiles: total.sentFiles + person.message.sentFiles,
      receivedFiles: total.receivedFiles + person.message.receivedFiles,
      topRecipients: [],
      topSenders: []
    }), { login: 0, logout: 0, sentMessages: 0, receivedMessages: 0, sentFiles: 0, receivedFiles: 0, topRecipients: [], topSenders: [] }),
    signing: peopleAll.reduce<DemoSigningMetrics>((total, person) => ({
      received: total.received + person.signing.received,
      processed: total.processed + person.signing.processed,
      pending: total.pending + person.signing.pending,
      exception: total.exception + person.signing.exception
    }), { received: 0, processed: 0, pending: 0, exception: 0 })
  });
}

function tick() {
  tickCount += 1;

  // Rolling shared-link data on real clock time.
  const link = demoSituationScenario.link;
  const prevUp = link.uplinkTrend[link.uplinkTrend.length - 1] ?? link.uplinkMbps;
  const prevDown = link.downlinkTrend[link.downlinkTrend.length - 1] ?? link.downlinkMbps;
  const up = round1(clamp(prevUp + (Math.random() - 0.45) * 6, 1, 49.5));
  const down = round1(clamp(prevDown + (Math.random() - 0.45) * 8, 1, 49.5));
  link.uplinkMbps = up;
  link.downlinkMbps = down;
  link.utilization = round1(clamp(((up + down) / 2 / link.capacityMbps) * 100, 1, 99));
  link.trafficGb = round1(link.trafficGb + ((up + down) * TICK_SECONDS) / 3600);
  link.peakMbps = Math.max(link.peakMbps, up, down);
  link.peakUtilization = Math.max(link.peakUtilization, link.utilization);
  link.uplinkTrend.push(up);
  link.downlinkTrend.push(down);
  link.times.push(timeLabel());
  if (link.uplinkTrend.length > 7) link.uplinkTrend.shift();
  if (link.downlinkTrend.length > 7) link.downlinkTrend.shift();
  if (link.times.length > 7) link.times.shift();

  maybeFlipSessions();
  bumpBusiness();
  routeSecurityTick();

  // 业务趋势滚动：实时时间轴 + 每周期新增业务量。
  const trend = demoSituationScenario.businessTrend;
  trend.times.push(timeLabel());
  trend.messageSent.push(Math.floor(Math.random() * 5));
  trend.messageReceived.push(Math.floor(Math.random() * 5));
  trend.fileCount.push(Math.floor(Math.random() * 3));
  trend.signingReceived.push(Math.floor(Math.random() * 3));
  trend.signingProcessed.push(Math.floor(Math.random() * 3));
  trend.signingPending.push(Math.floor(Math.random() * 2));
  if (trend.times.length > 7) {
    trend.times.shift();
    trend.messageSent.shift();
    trend.messageReceived.shift();
    trend.fileCount.shift();
    trend.signingReceived.shift();
    trend.signingProcessed.shift();
    trend.signingPending.shift();
  }

  // 各业务系统流量滚动：吞吐量随业务量波动，快照同步更新。
  const systemTraffic = demoSituationScenario.systemTraffic;
  systemTraffic.times.push(timeLabel());
  if (systemTraffic.times.length > 7) systemTraffic.times.shift();
  const driftMap: Record<string, number> = { msg: 0.9, sign: 0.7, crypto: 0.5 };
  systemTraffic.series.forEach((item) => {
    const prev = item.data[item.data.length - 1] ?? 1;
    const drift = driftMap[item.code] ?? 0.6;
    const next = round1(clamp(prev + (Math.random() - 0.45) * drift, 0.8, 49.5));
    item.data.push(next);
    if (item.data.length > 7) item.data.shift();
  });
  systemTraffic.snapshot.forEach((item) => {
    const series = systemTraffic.series.find((entry) => entry.code === item.code);
    const current = series?.data[series.data.length - 1] ?? item.throughputMbps;
    item.throughputMbps = current;
    item.trafficGb = round1(item.trafficGb + (current * TICK_SECONDS) / 3600);
    item.peakMbps = Math.max(item.peakMbps, current);
    if (current > item.peakMbps * 0.82 && item.tone === 'success') item.tone = 'warning';
    if (current < item.peakMbps * 0.6 && item.tone === 'warning') item.tone = 'success';
  });

  // 卫星中继负载随共享链路利用率联动并叠加轻微漂移。
  demoSituationScenario.satellites.forEach((satellite) => {
    const base = satellite.id === 'sat-1' ? 1.5 : 0.9;
    const next = Math.round(clamp(link.utilization * base + (Math.random() - 0.5) * 8, 8, 98));
    satellite.utilization = next;
    satellite.status = next >= 75 ? 'warning' : 'success';
  });

  // 安全事件刷新放慢：约每 40 秒才有机会新增一条。
  if (tickCount % 4 === 0) maybeAddSecurityEvent();

  // Age events in whole minutes only, so no decimal timestamps are ever shown.
  if (tickCount % TICKS_PER_MINUTE === 0) {
    demoSituationScenario.people.forEach((person) => {
      person.activities.forEach((activity) => { activity.minutesAgo += 1; });
    });
    demoSituationScenario.securityEvents.forEach((event) => { event.minutesAgo += 1; });
  }

  refreshTotals();
}

// Keep a single interval across dev HMR reloads.
if (typeof window !== 'undefined') {
  const holder = window as unknown as { __bssDemoTimer?: number };
  if (holder.__bssDemoTimer) window.clearInterval(holder.__bssDemoTimer);
  holder.__bssDemoTimer = window.setInterval(tick, TICK_SECONDS * 1000);
}

function assertDemoValue(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`演示场景数据不一致：${label} 应为 ${expected}，实际为 ${actual}`);
  }
}

// 演示 / 测试钩子：强制触发一次线路攻击（无进行中事件时）。
export function demoTriggerRouteAttack() {
  if (routeIncident) return;
  const primaries = demoSituationScenario.routes.filter((route) => route.kind === 'primary' && route.status === 'normal');
  if (!primaries.length) return;
  const route = randomPick(primaries);
  const hopIndex = Math.floor(Math.random() * route.hops.length);
  attackRoute(route, hopIndex);
}

export function validateDemoSituationScenario() {
  assertDemoValue('配发人员', demoTotals.assignedPeople, 26);
  assertDemoValue('在线用户', demoTotals.onlinePeople, 17);
  assertDemoValue('完整套件', demoTotals.healthySuites, 16);
  assertDemoValue('降级套件', demoTotals.degradedSuites, 3);
  assertDemoValue('离线套件', demoTotals.offlineSuites, 7);
  assertDemoValue('PAD 在线', demoTotals.padOnline, 19);
  assertDemoValue('密盒就绪', demoTotals.cryptoReady, 18);
  assertDemoValue('身份密钥可用', demoTotals.keyReady, 18);
  assertDemoValue('卫星终端通联', demoTotals.satelliteConnected, 17);
  assertDemoValue('密信软件可用', demoTotals.messageAvailable, 19);
  assertDemoValue('密信当前登录', demoTotals.messageLoggedIn, 17);
  assertDemoValue('签阅软件可用', demoTotals.signingAvailable, 19);
  assertDemoValue('密信会话闭合', demoTotals.message.login - demoTotals.message.logout, demoTotals.messageLoggedIn);
  assertDemoValue('密信消息发送', demoTotals.message.sentMessages, 126);
  assertDemoValue('密信消息接收', demoTotals.message.receivedMessages, 142);
  assertDemoValue('密信文件发送', demoTotals.message.sentFiles, 37);
  assertDemoValue('密信文件接收', demoTotals.message.receivedFiles, 45);
  assertDemoValue('签阅收到', demoTotals.signing.received, 68);
  assertDemoValue('签阅已处理', demoTotals.signing.processed, 54);
  assertDemoValue('签阅待处理', demoTotals.signing.pending, 11);
  assertDemoValue('签阅异常退回', demoTotals.signing.exception, 3);
  assertDemoValue('签阅状态闭合', demoTotals.signing.processed + demoTotals.signing.pending + demoTotals.signing.exception, demoTotals.signing.received);
  assertDemoValue('人员装备数量', people.reduce((total, person) => total + person.equipment.length, 0), 156);
  assertDemoValue('区域累计流量', Math.round(regions.reduce((total, region) => total + region.trafficGb, 0) * 10), Math.round(demoSituationScenario.link.trafficGb * 10));
  assertDemoValue('卫星数量', demoSituationScenario.satellites.length, 2);
  assertDemoValue('业务系统数量', demoSituationScenario.systemTraffic.snapshot.length, 3);
  const messageRelations = people.every((person) => person.message.topRecipients.length >= 0 && person.message.topSenders.length >= 0);
  if (!messageRelations) throw new Error('演示场景数据不一致：收发关系未初始化');
  return true;
}

validateDemoSituationScenario();
