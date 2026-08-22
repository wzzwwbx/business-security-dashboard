<script setup lang="ts">
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import RouteTopologyPanel from '@/components/demo/RouteTopologyPanel.vue';
import flagAe from '@/assets/map/flag-ae.svg';
import flagAu from '@/assets/map/flag-au.svg';
import flagBr from '@/assets/map/flag-br.svg';
import flagCa from '@/assets/map/flag-ca.svg';
import flagDe from '@/assets/map/flag-de.svg';
import flagKe from '@/assets/map/flag-ke.svg';
import flagSg from '@/assets/map/flag-sg.svg';
import flagUs from '@/assets/map/flag-us.svg';
import satelliteSuccess from '@/assets/map/satellite-success.svg';
import satelliteWarning from '@/assets/map/satellite-warning.svg';
import { demoSituationScenario } from '@/mocks/demoSituation';
import type { DemoRegion } from '@/types/demoSituation';
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  regions: DemoRegion[];
  selectedCountryCode?: string;
}>();

const emit = defineEmits<{
  selectCountry: [countryCode: string];
}>();

const worldGeoJson = ref<Record<string, unknown> | null>(null);
const mapChart = ref<InstanceType<typeof EChartWidget> | null>(null);

onMounted(async () => {
  const response = await fetch('/maps/world-110m.json');
  const data = await response.json() as { features: Array<{ properties: Record<string, string>; [key: string]: unknown }>; [key: string]: unknown };
  worldGeoJson.value = {
    ...data,
    features: data.features
      .filter((feature) => feature.properties.NAME !== 'Antarctica')
      .map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          name: feature.properties.NAME_ZH || feature.properties.NAME || feature.properties.ADMIN
        }
      }))
  };
});

function regionStatus(region: DemoRegion) {
  const online = region.people.filter((person) => person.online).length;
  if (online === 0) return { color: '#778397', label: '全员离线' };
  if (online === region.people.length) return { color: '#43d7a2', label: '全员在线' };
  return { color: '#e9b949', label: '部分在线' };
}

function findRegionByMapName(name: string) {
  return props.regions.find((region) => region.countryName === name || region.countryCode === name || (region.countryCode === 'CN' && name === '北京'));
}

function regionTooltip(region: DemoRegion) {
  const person = region.people[0];
  if (!person) return `<strong>${region.countryName}</strong><br/>暂无用户数据`;
  const messageTotal = person.message.sentMessages + person.message.receivedMessages;
  return `<strong>${region.countryName}</strong><br/>用户 ${person.name} · ${person.code}<br/>${person.department}<br/>${person.online ? '在线' : '离线'} · ${person.suiteStatusLabel} · ${person.primaryIp}<br/>密信收发 ${messageTotal} 条 · 签阅待处理 ${person.signing.pending} 份`;
}

const beijing = computed(() => props.regions.find((region) => region.countryCode === 'CN'));

// 红色五角星：北京站点标识。
const STAR_PATH = 'M24 2 L29.4 18.3 L46.6 18.3 L32.8 28.9 L38.4 45.1 L24 34.8 L9.6 45.1 L15.2 28.9 L1.4 18.3 L18.6 18.3 Z';

// 各卫星链路站点使用不同颜色区分联通关系。
const SATELLITE_COLORS = ['#a97bff', '#ff8fa3', '#43d7a2'];

// 卫星悬浮于地图上方“天空”空位：geo 预留顶部天空带，卫星取接近 90°N 的坐标投影到天空带。
const SAT_GEO: Record<string, [number, number]> = {
  'sat-1': [40, 95],
  'sat-2': [-55, 95]
};

// 通信卫星和国旗使用构建时打包的同源 SVG，避免依赖 data URI、CSP 配置和客户端 emoji 字体。
const FLAG_SYMBOLS: Record<string, string> = {
  AE: flagAe,
  SG: flagSg,
  DE: flagDe,
  KE: flagKe,
  BR: flagBr,
  CA: flagCa,
  AU: flagAu,
  US: flagUs
};

const SATELLITE_SYMBOLS = {
  warning: satelliteWarning,
  success: satelliteSuccess
} as const;

// 站点国旗使用构建时打包的本地 SVG 图标。
const FLAG_EMOJI: Record<string, string> = {
  AE: '🇦🇪', SG: '🇸🇬', DE: '🇩🇪', KE: '🇰🇪', BR: '🇧🇷', CA: '🇨🇦', AU: '🇦🇺', US: '🇺🇸'
};

function flagSvg(emoji: string) {
  const countryCode = Object.entries(FLAG_EMOJI).find(([, value]) => value === emoji)?.[0];
  return FLAG_SYMBOLS[countryCode ?? 'AE'] ?? flagAe;
}

const chartOption = computed(() => {
  const center = beijing.value;
  const points = props.regions.map((region) => {
    const isBeijing = region.countryCode === 'CN';
    return {
      name: region.countryCode === 'CN' ? '北京' : region.countryName,
      value: [region.longitude, region.latitude, region.people.length],
      symbol: isBeijing ? `path://${STAR_PATH}` : `image://${flagSvg(FLAG_EMOJI[region.countryCode] ?? '🌐')}`,
      symbolSize: isBeijing ? 30 : 26,
      itemStyle: isBeijing
        ? { color: '#ff4d5e', shadowColor: 'rgba(255,77,94,.85)', shadowBlur: 16, borderColor: '#ffd7dc', borderWidth: 1 }
        : { color: regionStatus(region).color, borderColor: props.selectedCountryCode === region.countryCode ? '#ffffff' : 'rgba(255,255,255,.55)', borderWidth: props.selectedCountryCode === region.countryCode ? 2 : 1 },
      payload: region
    };
  });

  const overseas = props.regions.filter((region) => region.countryCode !== 'CN');

  // 注册命中几何（geo 端点 + curveness），供自定义点击/悬浮判定使用。
  geoRouteLines.length = 0;

  // 地面链路：统一蓝色实线，与图例一致；线路点击/悬浮由自定义命中处理。
  const groundSegments = center ? overseas.filter((region) => region.linkType === 'ground').map((region) => ({
    coords: [[center.longitude, center.latitude], [region.longitude, region.latitude]],
    value: region.downlinkMbps,
    routeId: demoSituationScenario.routes.find((route) => route.countryCode === region.countryCode && route.kind === 'primary')?.id,
    countryCode: region.countryCode,
    lineStyle: {
      color: '#5a95ff',
      width: 1 + region.downlinkMbps / 3,
      opacity: 0.5
    }
  })) : [];
  groundSegments.forEach((segment, dataIndex) => {
    const coords = segment.coords as [[number, number], [number, number]];
    geoRouteLines.push({ countryCode: segment.countryCode, routeId: segment.routeId, seriesIndex: 0, dataIndex, from: coords[0], to: coords[1] });
  });

  // 卫星链路：北京 → 卫星 与 卫星 → 站点 拆分为两段弧线；点击任一段查看多跳拓扑。
  const satelliteSegments = center ? overseas.filter((region) => region.linkType === 'satellite').flatMap((region, index) => {
    const satGeo = SAT_GEO[region.satelliteId ?? ''] ?? SAT_GEO['sat-1'];
    const color = SATELLITE_COLORS[index % SATELLITE_COLORS.length];
    const arcs = { AE: [-0.52, -0.3], KE: [-0.16, -0.6], BR: [-0.42, -0.45] }[region.countryCode] ?? [-0.35, -0.35];
    return [
      {
        coords: [[center.longitude, center.latitude], satGeo],
        routeId: demoSituationScenario.routes.find((route) => route.countryCode === region.countryCode && route.kind === 'primary')?.id,
        countryCode: region.countryCode,
        lineStyle: { color, width: 1.5, opacity: 0.38, type: 'dashed', curveness: arcs[0] }
      },
      {
        coords: [satGeo, [region.longitude, region.latitude]],
        routeId: demoSituationScenario.routes.find((route) => route.countryCode === region.countryCode && route.kind === 'primary')?.id,
        countryCode: region.countryCode,
        lineStyle: { color, width: 1.5, opacity: 0.38, type: 'dashed', curveness: arcs[1] }
      }
    ];
  }) : [];
  satelliteSegments.forEach((segment, dataIndex) => {
    const coords = segment.coords as [[number, number], [number, number]];
    const curveness = (segment.lineStyle as { curveness?: number })?.curveness;
    geoRouteLines.push({ countryCode: segment.countryCode, routeId: segment.routeId, seriesIndex: 2, dataIndex, from: coords[0], to: coords[1], curveness });
  });

  // 通信卫星位于地图上方“天空”区域（高纬度海洋上空）。
  const satellitePoints = demoSituationScenario.satellites.map((sat) => {
    const geo = SAT_GEO[sat.id] ?? SAT_GEO['sat-1'];
    const warn = sat.status === 'warning';
    return {
      name: sat.name,
      value: [...geo, 0],
      symbol: `image://${SATELLITE_SYMBOLS[warn ? 'warning' : 'success']}`,
      symbolSize: 44,
      itemStyle: { shadowColor: warn ? 'rgba(255,200,87,.7)' : 'rgba(67,215,162,.7)', shadowBlur: 12 },
      label: {
        show: true,
        position: 'bottom',
        distance: 4,
        color: warn ? '#e9c97a' : '#8fd8be',
        fontSize: 13,
        formatter: sat.name
      },
      payload: { kind: 'satellite' as const, ...sat }
    };
  });

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 16, 29, .96)',
      borderColor: 'rgba(105, 151, 255, .55)',
      textStyle: { color: '#e9edfa', fontSize: 14 },
      formatter: (params: any) => {
        const payload = params.data?.payload as (DemoRegion & { kind?: string; bandwidthMbps?: number; utilization?: number; note?: string }) | undefined;
        if (payload?.kind === 'satellite') {
          return `<strong>${payload.name}</strong><br/>带宽 ${payload.bandwidthMbps} Mbps · 利用率 ${payload.utilization}%<br/>${payload.note ?? ''}`;
        }
        const region = payload?.countryCode ? payload : findRegionByMapName(params.name);
        return region ? regionTooltip(region) : params.name ?? '';
      }
    },
    geo: {
      map: 'demo-world-countries',
      tooltip: { show: true },
      roam: true,
      zoom: 1.08,
      center: [18, 17],
      top: '14%',
      scaleLimit: { min: 0.85, max: 6 },
      itemStyle: { areaColor: '#17243b', borderColor: '#46617f', borderWidth: 0.6 },
      emphasis: { itemStyle: { areaColor: '#243b5d', borderColor: '#8eb1db' }, label: { show: true, color: '#eef4ff', fontSize: 16 } },
      select: { disabled: true }
    },
    series: [
      {
        name: '地面链路',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 1,
        silent: true,
        emphasis: { lineStyle: { width: 3, opacity: 1 } },
        effect: { show: true, period: 7, trailLength: 0.15, symbolSize: 3 },
        data: groundSegments
      },
      {
        name: '卫星链路',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        silent: true,
        emphasis: { lineStyle: { width: 2.8, opacity: 1 } },
        data: satelliteSegments
      },
      {
        name: '通信卫星',
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 4,
        label: { show: false },
        data: satellitePoints
      },
      {
        name: '人员在线状态',
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 3,
        label: {
          show: true,
          position: 'right',
          color: '#f1f5ff',
          fontSize: 16,
          formatter: (params: any) => {
            const region = params.data?.payload as DemoRegion;
            const online = region.people.filter((person) => person.online).length;
            return `${region.countryCode === 'CN' ? '北京' : region.countryName}  ${online}/${region.people.length}`;
          }
        },
        data: points
      }
    ]
  };
});

// —— 线路命中：复刻 ECharts 渲染（端点投影 + 屏幕空间控制点公式）做自定义命中 ——
// ECharts lines 的贝塞尔命中退化为包围盒（大弧线会误吞其他线路），且元素不带业务数据，
// 因此用 convertToPixel 投影 geo 端点后按屏幕公式离散弧线，以点到折线距离判定命中。
interface GeoRouteLine {
  countryCode: string;
  routeId?: string;
  seriesIndex: number;
  dataIndex: number;
  from: [number, number];
  to: [number, number];
  curveness?: number;
}

const geoRouteLines: GeoRouteLine[] = [];
let highlightedRoute: Array<{ seriesIndex: number; dataIndex: number }> = [];
const BASE_HIT_THRESHOLD_PX = 8;

// 命中阈值随 geo 缩放自适应：放大时线条更宽更疏，收紧阈值避免误触；缩小时放宽便于点击。
function hitThreshold(chart: { getOption: () => { geo?: Array<{ zoom?: number }> } }) {
  const zoom = chart.getOption().geo?.[0]?.zoom ?? 1.08;
  return Math.max(4, Math.min(12, BASE_HIT_THRESHOLD_PX * (1.08 / zoom)));
}

function discretizeLine(x1: number, y1: number, x2: number, y2: number, cpx?: number, cpy?: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const count = 24;
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const inv = 1 - t;
    if (cpx == null || cpy == null) {
      pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    } else {
      pts.push([inv * inv * x1 + 2 * inv * t * cpx + t * t * x2, inv * inv * y1 + 2 * inv * t * cpy + t * t * y2]);
    }
  }
  return pts;
}

function pointToSegmentDist(px: number, py: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - a[0]) * dx + (py - a[1]) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = a[0] + t * dx;
  const qy = a[1] + t * dy;
  return Math.hypot(px - qx, py - qy);
}

function findRouteAt(px: number, py: number) {
  const chart = mapChart.value?.getChart();
  if (!chart) return null;
  const threshold = hitThreshold(chart);
  let best: GeoRouteLine | null = null;
  let bestDist = Infinity;
  for (const line of geoRouteLines) {
    const s0 = chart.convertToPixel({ geoIndex: 0 }, line.from);
    const s1 = chart.convertToPixel({ geoIndex: 0 }, line.to);
    if (!s0 || !s1) continue;
    const c = line.curveness ?? 0;
    const pts = discretizeLine(s0[0], s0[1], s1[0], s1[1], c ? s0[0] + (s1[0] - s0[0]) / 2 + (s1[1] - s0[1]) * c : undefined, c ? s0[1] + (s1[1] - s0[1]) / 2 - (s1[0] - s0[0]) * c : undefined);
    for (let i = 0; i < pts.length - 1; i += 1) {
      const dist = pointToSegmentDist(px, py, pts[i], pts[i + 1]);
      if (dist < bestDist) {
        bestDist = dist;
        best = line;
      }
    }
  }
  return bestDist <= threshold ? best : null;
}

function highlightRoute(routeId: string | undefined) {
  const chart = mapChart.value?.getChart();
  if (!chart) return;
  const zr = chart.getZr();
  zr.storage.getDisplayList().forEach((el) => {
    const element = el as { type?: string; __bssRouteId?: string; __bssBase?: { w: number; o: number }; style?: { lineWidth?: number; opacity?: number; stroke?: string }; setStyle?: (style: Record<string, unknown>) => void };
    if (element.type !== 'ec-line') return;
    if (routeId && element.__bssRouteId === routeId) {
      element.setStyle?.({ lineWidth: 3, opacity: 1, shadowBlur: 10, shadowColor: element.style?.stroke });
    } else if (element.__bssBase) {
      element.setStyle?.({ lineWidth: element.__bssBase.w, opacity: element.__bssBase.o, shadowBlur: 0 });
    }
  });
  zr.refresh();
}

// 为每个线路元素标记所属路由与基础样式（元素级高亮，不依赖 ECharts emphasis）。
// 重合线段（如 AE/KE 共用北京→卫-1 上行段）按“每条路由占用一个未标记元素”分配，
// 避免两条重合线都被标成同一条路由导致高亮错位。
function tagLineElements() {
  const chart = mapChart.value?.getChart();
  if (!chart) return;
  const zr = chart.getZr();
  const elements = zr.storage.getDisplayList().filter((el) => {
    const element = el as { type?: string; __bssRouteId?: string };
    return element.type === 'ec-line' && !element.__bssRouteId;
  });
  const used = new Set<object>();
  for (const line of geoRouteLines) {
    const a = chart.convertToPixel({ geoIndex: 0 }, line.from);
    const b = chart.convertToPixel({ geoIndex: 0 }, line.to);
    if (!a || !b) continue;
    for (const el of elements) {
      if (used.has(el)) continue;
      const element = el as { type?: string; shape?: { x1: number; y1: number; x2: number; y2: number }; style?: { lineWidth?: number; opacity?: number } };
      const shape = element.shape;
      if (shape && Math.abs(shape.x1 - a[0]) < 1.5 && Math.abs(shape.y1 - a[1]) < 1.5 && Math.abs(shape.x2 - b[0]) < 1.5 && Math.abs(shape.y2 - b[1]) < 1.5) {
        (el as { __bssRouteId?: string }).__bssRouteId = line.routeId;
        (el as { __bssBase?: { w: number; o: number } }).__bssBase = { w: element.style?.lineWidth ?? 1.5, o: element.style?.opacity ?? 0.5 };
        used.add(el);
        break;
      }
    }
  }
}

function isScatterTarget(target: unknown) {
  // scatter（区域点 / 卫星图标）元素带 __ecData.seriesIndex；地图区域 / 其他元素则继续线路判定。
  const el = target as { __ecData?: { seriesIndex?: number } } | null;
  const seriesIndex = el?.__ecData?.seriesIndex;
  return typeof seriesIndex === 'number' && (seriesIndex === 2 || seriesIndex === 3);
}

function handleZrClick(event: { zrX?: number; zrY?: number; offsetX?: number; offsetY?: number; target?: unknown }) {
  // 命中 scatter（区域点 / 卫星图标）时由 ECharts click 处理区域选择，这里跳过线路判定；
  // 命中地图区域等非 scatter 元素时继续判定线路（线路本身为 silent，target 会落到地图区域）。
  if (event.target && isScatterTarget(event.target)) return;
  const x = event.zrX ?? event.offsetX ?? 0;
  const y = event.zrY ?? event.offsetY ?? 0;
  const hit = findRouteAt(x, y);
  if (hit) topologyCountry.value = hit.countryCode;
}

function handleZrMove(event: { zrX?: number; zrY?: number; offsetX?: number; offsetY?: number }) {
  const x = event.zrX ?? event.offsetX ?? 0;
  const y = event.zrY ?? event.offsetY ?? 0;
  const hit = findRouteAt(x, y);
  highlightRoute(hit?.routeId);
}

function handleZrGlobalOut() {
  highlightRoute(undefined);
}

function onChartRendered() {
  const chart = mapChart.value?.getChart();
  if (!chart) return;
  tagLineElements();
  const zr = chart.getZr();
  zr.off('click', handleZrClick as never);
  zr.off('mousemove', handleZrMove as never);
  zr.off('globalout', handleZrGlobalOut as never);
  zr.on('click', handleZrClick as never);
  zr.on('mousemove', handleZrMove as never);
  zr.on('globalout', handleZrGlobalOut as never);
}

onBeforeUnmount(() => {
  const chart = mapChart.value?.getChart();
  if (chart) {
    chart.getZr().off('click', handleZrClick as never);
    chart.getZr().off('mousemove', handleZrMove as never);
    chart.getZr().off('globalout', handleZrGlobalOut as never);
  }
});

// —— 点击线路：打开多跳拓扑面板 ——
const topologyCountry = ref<string | null>(null);

function handleClick(payload: Record<string, any>) {
  const data = payload.data as { payload?: (DemoRegion & { kind?: string }) | undefined } | undefined;
  const payloadData = data?.payload;

  // 点击国家区域本身时，按地图名称找到该国唯一用户并打开详情。
  if (payload.componentType === 'geo') {
    const region = findRegionByMapName(payload.name);
    if (region) {
      topologyCountry.value = null;
      emit('selectCountry', region.countryCode);
    }
    return;
  }

  // 仅 scatter（区域点 / 卫星图标）点击参与区域选择；线路点击由 zr 自定义命中处理。
  if (payload.seriesType !== 'scatter') return;
  topologyCountry.value = null;
  // 卫星图标：打开该卫星服务的第一条路由拓扑（卫-1 → 阿布扎比、卫-2 → 巴西利亚）。
  if (payloadData?.kind === 'satellite') {
    const satelliteId = payloadData.id;
    const route = demoSituationScenario.routes.find((item) => item.kind === 'primary' && (item.hops.some((hop) => hop.type === 'satellite') && (satelliteId === 'sat-1' ? item.countryCode === 'AE' : item.countryCode === 'BR')));
    if (route) topologyCountry.value = route.countryCode;
    return;
  }
  const region = payloadData as DemoRegion | undefined;
  if (region && 'countryCode' in region) emit('selectCountry', region.countryCode);
}

// —— 切换策略下发提示（单次展示，点击打开对应拓扑，手动关闭） ——
const switchToast = ref<{ text: string; countryCode: string } | null>(null);
let lastToastSwitchId = '';
// 空数组时访问 [0] 不会收集依赖，改为监听 length 并用策略 id 去重。
watch(() => demoSituationScenario.routeSwitches.length, () => {
  const policy = demoSituationScenario.routeSwitches[0];
  if (!policy || policy.id === lastToastSwitchId) return;
  lastToastSwitchId = policy.id;
  const region = demoSituationScenario.regions.find((item) => item.countryCode === policy.countryCode);
  const name = region ? (region.countryCode === 'CN' ? '北京' : region.countryName) : policy.countryCode;
  switchToast.value = {
    text: `线路安全智能分析：${name} 主路由遭攻击，已生成并下发分段绕行策略，点击查看对应线路拓扑`,
    countryCode: policy.countryCode
  };
});

function openTopologyFromToast() {
  if (switchToast.value) topologyCountry.value = switchToast.value.countryCode;
}
</script>

<template>
  <div class="demo-map">
    <div class="map-legend-overlay" aria-label="地图图例">
      <span><i class="ground" />地面链路</span>
      <span><i class="satellite" />卫星链路</span>
      <span><i class="status success" />全员在线</span>
      <span><i class="status warning" />部分在线</span>
      <span><i class="status offline" />全员离线</span>
    </div>

    <Transition name="route-toast">
      <div v-if="switchToast" class="route-switch-toast" role="status" @click="openTopologyFromToast">
        <i /><span>{{ switchToast.text }}</span>
        <button type="button" class="toast-close" aria-label="关闭提示" @click.stop="switchToast = null">×</button>
      </div>
    </Transition>

    <Transition name="route-panel">
      <RouteTopologyPanel v-if="topologyCountry" :country-code="topologyCountry" @close="topologyCountry = null" />
    </Transition>

    <EChartWidget
      v-if="worldGeoJson"
      ref="mapChart"
      :option="chartOption"
      :map-definition="{ name: 'demo-world-countries', geoJson: worldGeoJson }"
      @chart-click="handleClick"
      @rendered="onChartRendered"
    />
    <BaseSkeleton v-else width="100%" height="100%" />
  </div>
</template>

<style scoped>
.demo-map { position: relative; width: 100%; height: 100%; min-height: 300px; }
.map-legend-overlay { position: absolute; z-index: 6; top: 12px; right: 12px; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px 14px; padding: 8px 12px; border: 1px solid rgba(70, 97, 127, .55); background: rgba(12, 20, 33, .82); backdrop-filter: blur(4px); }
.map-legend-overlay span { display: inline-flex; align-items: center; gap: 6px; color: #b7c3d5; font-size: 13px; white-space: nowrap; }
.map-legend-overlay i { display: inline-block; }
.map-legend-overlay i.ground { width: 16px; height: 0; border-top: 2px solid #5a95ff; }
.map-legend-overlay i.satellite { width: 16px; height: 0; border-top: 2px dashed #a97bff; }
.map-legend-overlay i.status { width: 7px; height: 7px; border-radius: 50%; background: #778397; }
.map-legend-overlay i.status.success { background: #43d7a2; }
.map-legend-overlay i.status.warning { background: #e9b949; }
.map-legend-overlay i.status.offline { background: #778397; }

/* 切换策略下发提示 */
.route-switch-toast { position: absolute; z-index: 8; top: 56px; right: 12px; max-width: 460px; display: flex; align-items: flex-start; gap: 8px; padding: 10px 10px 10px 14px; border: 1px solid rgba(239, 101, 121, .6); border-left: 3px solid #ef6579; background: rgba(28, 16, 26, .94); backdrop-filter: blur(4px); color: #ffd9de; font-size: 13px; line-height: 1.5; box-shadow: 0 6px 24px rgba(0, 0, 0, .45); cursor: pointer; }
.route-switch-toast i { flex: 0 0 auto; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: #ef6579; box-shadow: 0 0 8px #ef6579; }
.route-switch-toast span { flex: 1 1 auto; }
.route-switch-toast .toast-close { flex: 0 0 auto; width: 22px; height: 22px; padding: 0; border: 1px solid rgba(239, 101, 121, .5); color: #ffb9c2; background: transparent; font-size: 15px; line-height: 1; cursor: pointer; }
.route-switch-toast .toast-close:hover { color: #fff; background: rgba(239, 101, 121, .2); }

.route-panel-enter-active, .route-panel-leave-active { transition: opacity .22s ease; }
.route-panel-enter-from, .route-panel-leave-to { opacity: 0; }
.route-toast-enter-active, .route-toast-leave-active { transition: opacity .25s ease, transform .25s ease; }
.route-toast-enter-from, .route-toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
