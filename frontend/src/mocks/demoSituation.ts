import type {
  DemoActivity,
  DemoEquipment,
  DemoMessageMetrics,
  DemoPerson,
  DemoRegion,
  DemoSigningMetrics,
  DemoSituationScenario,
  DemoSuiteStatus
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
  message: DemoMessageMetrics;
  signing: DemoSigningMetrics;
}

const names = [
  '陈默', '周航', '林川', '赵宁', '孙悦', '何远', '许嘉', '郑桐', '高原', '唐婧',
  '韩旭', '曹瑞', '梁安', '罗清', '冯辰', '彭越', '蒋文', '邹明', '白杨', '邵晨'
];

const regionSeeds: RegionSeed[] = [
  { countryCode: 'CN', countryName: '中国', city: '北京', longitude: 116.4, latitude: 39.9, people: 1, online: 1, healthy: 1, degraded: 0, department: '北京通信保障中心', trafficGb: 0, uplinkMbps: 0, downlinkMbps: 0, message: { login: 1, logout: 0, sentMessages: 8, receivedMessages: 10, sentFiles: 2, receivedFiles: 3 }, signing: { received: 4, processed: 4, pending: 0, exception: 0 } },
  { countryCode: 'AE', countryName: '阿联酋', city: '阿布扎比', longitude: 54.4, latitude: 24.3, people: 5, online: 4, healthy: 3, degraded: 1, department: '西亚业务保障组', trafficGb: 3.2, uplinkMbps: 3.6, downlinkMbps: 5.1, message: { login: 5, logout: 1, sentMessages: 34, receivedMessages: 38, sentFiles: 11, receivedFiles: 13 }, signing: { received: 18, processed: 14, pending: 3, exception: 1 } },
  { countryCode: 'SG', countryName: '新加坡', city: '新加坡', longitude: 103.8, latitude: 1.3, people: 4, online: 3, healthy: 3, degraded: 1, department: '东南亚业务保障组', trafficGb: 2.4, uplinkMbps: 2.8, downlinkMbps: 4.0, message: { login: 4, logout: 1, sentMessages: 27, receivedMessages: 31, sentFiles: 8, receivedFiles: 9 }, signing: { received: 14, processed: 11, pending: 3, exception: 0 } },
  { countryCode: 'DE', countryName: '德国', city: '柏林', longitude: 10.4, latitude: 51.1, people: 4, online: 3, healthy: 3, degraded: 1, department: '欧洲业务保障组', trafficGb: 2.3, uplinkMbps: 2.5, downlinkMbps: 3.8, message: { login: 4, logout: 1, sentMessages: 25, receivedMessages: 27, sentFiles: 7, receivedFiles: 8 }, signing: { received: 13, processed: 10, pending: 2, exception: 1 } },
  { countryCode: 'KE', countryName: '肯尼亚', city: '内罗毕', longitude: 37.9, latitude: 0.2, people: 3, online: 2, healthy: 2, degraded: 0, department: '非洲业务保障组', trafficGb: 1.8, uplinkMbps: 2.1, downlinkMbps: 3.0, message: { login: 2, logout: 0, sentMessages: 17, receivedMessages: 20, sentFiles: 5, receivedFiles: 7 }, signing: { received: 10, processed: 8, pending: 2, exception: 0 } },
  { countryCode: 'BR', countryName: '巴西', city: '巴西利亚', longitude: -51.9, latitude: -14.2, people: 3, online: 2, healthy: 2, degraded: 1, department: '南美业务保障组', trafficGb: 1.8, uplinkMbps: 1.8, downlinkMbps: 2.7, message: { login: 2, logout: 0, sentMessages: 15, receivedMessages: 16, sentFiles: 4, receivedFiles: 5 }, signing: { received: 9, processed: 7, pending: 1, exception: 1 } }
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
  const satelliteReady = active && degradedIndex !== 1 && degradedIndex !== 3;

  return [
    { type: 'pad', label: '终端 PAD', code: `PAD-${sequence}`, status: active ? 'online' : 'offline', statusLabel: active ? '在线' : '离线', version: 'SecureOS 4.8.2', detail: active ? '最近心跳正常' : '超过 30 分钟未上报', tone: active ? 'success' : 'danger' },
    { type: 'crypto-box', label: '密盒', code: `CRYPTO-${sequence}`, status: cryptoReady ? 'ready' : active ? 'degraded' : 'offline', statusLabel: cryptoReady ? '就绪' : active ? '证书待更新' : '离线', version: 'GMBox 3.6.1', detail: cryptoReady ? '国密模块与证书状态正常' : active ? '证书有效期不足 30 天' : '未检测到设备', tone: cryptoReady ? 'success' : active ? 'warning' : 'danger' },
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
    downlinkMbps: seed.downlinkMbps
  };
});

const people = regions.flatMap((region) => region.people);

export const demoSituationScenario: DemoSituationScenario = {
  generatedAt: new Date().toISOString(),
  people,
  regions,
  link: {
    capacityMbps: 50,
    uplinkMbps: 12.8,
    downlinkMbps: 18.6,
    utilization: 37.2,
    trafficGb: 11.5,
    peakMbps: 38.7,
    peakUtilization: 77.4,
    threshold: 80,
    times: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '当前'],
    uplinkTrend: [2.4, 1.8, 5.6, 9.2, 15.4, 31.2, 12.8],
    downlinkTrend: [3.8, 2.6, 8.4, 13.7, 22.5, 38.7, 18.6]
  }
};

export const demoTotals = {
  assignedPeople: people.length,
  onlinePeople: people.filter((person) => person.online).length,
  healthySuites: people.filter((person) => person.suiteStatus === 'healthy').length,
  degradedSuites: people.filter((person) => person.suiteStatus === 'degraded').length,
  offlineSuites: people.filter((person) => person.suiteStatus === 'offline').length,
  padOnline: people.filter((person) => person.equipment.find((item) => item.type === 'pad')?.status === 'online').length,
  cryptoReady: people.filter((person) => person.equipment.find((item) => item.type === 'crypto-box')?.status === 'ready').length,
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
    receivedFiles: total.receivedFiles + person.message.receivedFiles
  }), { login: 0, logout: 0, sentMessages: 0, receivedMessages: 0, sentFiles: 0, receivedFiles: 0 }),
  signing: people.reduce<DemoSigningMetrics>((total, person) => ({
    received: total.received + person.signing.received,
    processed: total.processed + person.signing.processed,
    pending: total.pending + person.signing.pending,
    exception: total.exception + person.signing.exception
  }), { received: 0, processed: 0, pending: 0, exception: 0 })
};

function assertDemoValue(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`演示场景数据不一致：${label} 应为 ${expected}，实际为 ${actual}`);
  }
}

export function validateDemoSituationScenario() {
  assertDemoValue('配发人员', demoTotals.assignedPeople, 20);
  assertDemoValue('在线用户', demoTotals.onlinePeople, 15);
  assertDemoValue('完整套件', demoTotals.healthySuites, 14);
  assertDemoValue('降级套件', demoTotals.degradedSuites, 4);
  assertDemoValue('离线套件', demoTotals.offlineSuites, 2);
  assertDemoValue('PAD 在线', demoTotals.padOnline, 18);
  assertDemoValue('密盒就绪', demoTotals.cryptoReady, 17);
  assertDemoValue('卫星终端通联', demoTotals.satelliteConnected, 16);
  assertDemoValue('密信软件可用', demoTotals.messageAvailable, 18);
  assertDemoValue('密信当前登录', demoTotals.messageLoggedIn, 15);
  assertDemoValue('签阅软件可用', demoTotals.signingAvailable, 18);
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
  assertDemoValue('人员装备数量', people.reduce((total, person) => total + person.equipment.length, 0), 100);
  assertDemoValue('区域累计流量', Math.round(regions.reduce((total, region) => total + region.trafficGb, 0) * 10), Math.round(demoSituationScenario.link.trafficGb * 10));
  return true;
}

validateDemoSituationScenario();
