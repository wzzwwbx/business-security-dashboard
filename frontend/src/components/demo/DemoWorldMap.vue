<script setup lang="ts">
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import { demoSituationScenario } from '@/mocks/demoSituation';
import type { DemoRegion } from '@/types/demoSituation';
import { computed, onMounted, ref } from 'vue';

const props = defineProps<{
  regions: DemoRegion[];
  selectedCountryCode?: string;
}>();

const emit = defineEmits<{
  selectCountry: [countryCode: string];
}>();

const worldGeoJson = ref<Record<string, unknown> | null>(null);
const mapChart = ref<InstanceType<typeof EChartWidget> | null>(null);
let highlightedSatelliteRoute: number[] = [];
let highlightedSatelliteSeriesIndex: number | null = null;

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

// 真实卫星矢量图（data URI SVG：两侧太阳能帆板 + 星体 + 天线锅，天线随状态着色）。
function satelliteSvg(accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
    <rect x="2" y="34" width="36" height="22" rx="1.5" fill="#16395f" stroke="#4a8ad4" stroke-width="1.2"/>
    <line x1="11" y1="34" x2="11" y2="56" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="20" y1="34" x2="20" y2="56" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="29" y1="34" x2="29" y2="56" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="2" y1="41" x2="38" y2="41" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="2" y1="49" x2="38" y2="49" stroke="#4a8ad4" stroke-width="0.7"/>
    <rect x="3" y="35" width="14" height="8" fill="#2e5b8f" opacity="0.7"/>
    <rect x="82" y="34" width="36" height="22" rx="1.5" fill="#16395f" stroke="#4a8ad4" stroke-width="1.2"/>
    <line x1="91" y1="34" x2="91" y2="56" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="100" y1="34" x2="100" y2="56" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="109" y1="34" x2="109" y2="56" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="82" y1="41" x2="118" y2="41" stroke="#4a8ad4" stroke-width="0.7"/>
    <line x1="82" y1="49" x2="118" y2="49" stroke="#4a8ad4" stroke-width="0.7"/>
    <rect x="103" y="35" width="14" height="8" fill="#2e5b8f" opacity="0.7"/>
    <rect x="40" y="26" width="40" height="38" rx="4" fill="#e4edff" stroke="#9fb8e0" stroke-width="1.2"/>
    <rect x="40" y="44" width="40" height="8" fill="#9fc3f0" opacity="0.55"/>
    <rect x="40" y="54" width="40" height="5" fill="#7fa8e0" opacity="0.6"/>
    <rect x="52" y="31" width="10" height="10" rx="2" fill="#5a95ff" opacity="0.9"/>
    <rect x="68" y="31" width="8" height="8" rx="2" fill="#5a95ff" opacity="0.7"/>
    <line x1="60" y1="26" x2="60" y2="10" stroke="#c0d4f0" stroke-width="3"/>
    <ellipse cx="60" cy="10" rx="15" ry="5.5" fill="#eef5ff" stroke="#8fb0dd" stroke-width="1.2"/>
    <ellipse cx="60" cy="10" rx="7" ry="2.4" fill="#5a95ff" opacity="0.55"/>
    <line x1="80" y1="34" x2="94" y2="22" stroke="${accent}" stroke-width="2.5"/>
    <path d="M94 22 L103 13 L107 24 Z" fill="${accent}"/>
    <rect x="47" y="64" width="8" height="7" rx="1.5" fill="#c9a54b"/>
    <rect x="65" y="64" width="8" height="7" rx="1.5" fill="#c9a54b"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const chartOption = computed(() => {
  const center = beijing.value;
  const points = props.regions.map((region) => {
    const isBeijing = region.countryCode === 'CN';
    return {
      name: region.countryCode === 'CN' ? '北京' : region.countryName,
      value: [region.longitude, region.latitude, region.people.length],
      symbol: isBeijing ? `path://${STAR_PATH}` : 'circle',
      symbolSize: isBeijing ? 30 : 20,
      itemStyle: isBeijing
        ? { color: '#ff4d5e', shadowColor: 'rgba(255,77,94,.85)', shadowBlur: 16, borderColor: '#ffd7dc', borderWidth: 1 }
        : { color: regionStatus(region).color, borderColor: props.selectedCountryCode === region.countryCode ? '#ffffff' : 'rgba(255,255,255,.55)', borderWidth: props.selectedCountryCode === region.countryCode ? 2 : 1 },
      payload: region
    };
  });

  const overseas = props.regions.filter((region) => region.countryCode !== 'CN');

  // 地面链路：统一蓝色实线，与图例一致。
  const groundLines = center ? overseas.filter((region) => region.linkType === 'ground').map((region) => ({
    coords: [[center.longitude, center.latitude], [region.longitude, region.latitude]],
    value: region.downlinkMbps,
    lineStyle: {
      color: '#5a95ff',
      width: 1 + region.downlinkMbps / 3,
      opacity: 0.5
    }
  })) : [];

  // 卫星链路：北京 → 卫星 与 卫星 → 站点 拆分为两段弧线。
  // 不同站点使用不同弧度：避免北京→卫星共用上行段完全重合（如阿联酋与肯尼亚同经卫-1），且弧线更明显。
  const satelliteLines = center ? overseas.filter((region) => region.linkType === 'satellite').flatMap((region, index) => {
    const satGeo = SAT_GEO[region.satelliteId ?? ''] ?? SAT_GEO['sat-1'];
    const color = SATELLITE_COLORS[index % SATELLITE_COLORS.length];
    const arcs = { AE: [-0.52, -0.3], KE: [-0.16, -0.6], BR: [-0.42, -0.45] }[region.countryCode] ?? [-0.35, -0.35];
    return [
      {
        coords: [[center.longitude, center.latitude], satGeo],
        lineStyle: { color, width: 1.5, opacity: 0.38, type: 'dashed', curveness: arcs[0] }
      },
      {
        coords: [satGeo, [region.longitude, region.latitude]],
        lineStyle: { color, width: 1.5, opacity: 0.38, type: 'dashed', curveness: arcs[1] }
      }
    ];
  }) : [];

  // 通信卫星：真实卫星矢量图，位于地图上方“天空”区域（高纬度海洋上空）。
  const satellitePoints = demoSituationScenario.satellites.map((sat) => {
    const geo = SAT_GEO[sat.id] ?? SAT_GEO['sat-1'];
    const warn = sat.status === 'warning';
    const accent = warn ? '#ffc857' : '#43d7a2';
    return {
      name: sat.name,
      value: [...geo, 0],
      symbol: `image://${satelliteSvg(accent)}`,
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
        if (!payload) return params.name ?? '';
        if (payload.kind === 'satellite') {
          return `<strong>${payload.name}</strong><br/>带宽 ${payload.bandwidthMbps} Mbps · 利用率 ${payload.utilization}%<br/>${payload.note ?? ''}`;
        }
        const online = payload.people.filter((person) => person.online).length;
        const healthy = payload.people.filter((person) => person.suiteStatus === 'healthy').length;
        const channel = payload.linkType === 'satellite' ? '卫星信道' : '地面信道';
        return `<strong>${payload.countryCode === 'CN' ? '北京' : payload.countryName}</strong><br/>配发人员 ${payload.people.length} 人 · 在线 ${online} 人 · ${regionStatus(payload).label}<br/>完整套件 ${healthy} 套 · ${channel} · 今日流量 ${payload.trafficGb.toFixed(1)} GB`;
      }
    },
    geo: {
      map: 'demo-world-countries',
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
      { type: 'lines', coordinateSystem: 'geo', zlevel: 1, silent: true, effect: { show: true, period: 7, trailLength: 0.15, symbolSize: 3 }, data: groundLines },
      {
        name: '卫星链路',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        silent: false,
        emphasis: { lineStyle: { width: 2.8, opacity: 1 } },
        data: satelliteLines
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

function setSatelliteRouteHighlight(seriesIndex: number, dataIndex: number, active: boolean) {
  const chart = mapChart.value?.getChart();
  if (!chart) return;

  if (highlightedSatelliteRoute.length && highlightedSatelliteSeriesIndex !== null) {
    highlightedSatelliteRoute.forEach((index) => chart.dispatchAction({ type: 'downplay', seriesIndex: highlightedSatelliteSeriesIndex, dataIndex: index }));
    highlightedSatelliteRoute = [];
    highlightedSatelliteSeriesIndex = null;
  }

  if (!active) return;
  const routeStart = Math.floor(dataIndex / 2) * 2;
  highlightedSatelliteRoute = [routeStart, routeStart + 1];
  highlightedSatelliteSeriesIndex = seriesIndex;
  highlightedSatelliteRoute.forEach((index) => chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex: index }));
}

function handleMouseover(payload: Record<string, any>) {
  if (payload.seriesName !== '卫星链路' || typeof payload.seriesIndex !== 'number' || typeof payload.dataIndex !== 'number') return;
  setSatelliteRouteHighlight(payload.seriesIndex, payload.dataIndex, true);
}

function handleMouseout(payload: Record<string, any>) {
  if (payload.seriesName !== '卫星链路' || typeof payload.seriesIndex !== 'number') return;
  setSatelliteRouteHighlight(payload.seriesIndex, 0, false);
}

function handleClick(payload: Record<string, any>) {
  const region = payload.data?.payload as DemoRegion | undefined;
  // 卫星节点与链路不触发区域选择。
  if (region && 'countryCode' in region) emit('selectCountry', region.countryCode);
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
    <EChartWidget
      v-if="worldGeoJson"
      ref="mapChart"
      :option="chartOption"
      :map-definition="{ name: 'demo-world-countries', geoJson: worldGeoJson }"
      @chart-click="handleClick"
      @chart-mouseover="handleMouseover"
      @chart-mouseout="handleMouseout"
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
</style>
