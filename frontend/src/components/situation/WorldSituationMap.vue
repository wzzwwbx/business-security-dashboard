<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import type { SituationGeoOverview, SituationGeoSelection } from '@/types/situationGeo';
import { computed, onMounted, ref } from 'vue';

const props = defineProps<{
  data: SituationGeoOverview;
}>();

const emit = defineEmits<{
  enterSite: [siteCode: string];
  enterCountry: [countryCode: string];
}>();

const showSites = ref(true);
const showTerminals = ref(true);
const showLinks = ref(true);
const selected = ref<SituationGeoSelection | null>(null);
const worldGeoJson = ref<Record<string, unknown> | null>(null);

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

const toneColor = {
  success: '#31e6a1',
  warning: '#ffc857',
  danger: '#ff6178',
  info: '#35d8ff'
};

const siteSeries = computed(() => props.data.sites.map((site) => ({
  name: site.name,
  value: [site.longitude, site.latitude, site.deviceCount],
  symbolSize: Math.max(15, Math.min(28, 12 + site.deviceCount / 8)),
  itemStyle: { color: toneColor[site.status] },
  payload: site
})));

const terminalSeries = computed(() => props.data.terminalRegions.map((region) => ({
  name: region.countryName,
  value: [region.longitude, region.latitude, region.total],
  symbolSize: Math.max(21, Math.min(42, 17 + Math.sqrt(region.total))),
  itemStyle: { color: toneColor[region.status] },
  payload: region
})));

const linkSeries = computed(() => {
  const center = props.data.sites.find((site) => site.siteCode === 'beijing-core') ?? props.data.sites[0];
  if (!center) return [];
  return props.data.terminalRegions.map((region) => ({
    coords: [[center.longitude, center.latitude], [region.longitude, region.latitude]],
    lineStyle: { color: toneColor[region.status] }
  }));
});

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      const item = params.data?.payload as SituationGeoSelection | undefined;
      if (!item) return params.name ?? '';
      if (item.kind === 'site') {
        return `<strong>${item.name}</strong><br/>设备 ${item.deviceCount} 台 · 在线率 ${item.onlineRate}%<br/>告警 ${item.alertCount} 条 · 资源负载 ${item.resourceUsage}%`;
      }
      return `<strong>${item.countryName}</strong><br/>终端 ${item.total} 台 · 在线 ${item.online} 台<br/>离线 ${item.offline} 台 · 异常 ${item.warning + item.danger} 台`;
    }
  },
  geo: {
    map: 'world-countries',
    roam: true,
    zoom: 1.08,
    center: [15, 16],
    scaleLimit: { min: 0.8, max: 8 },
    itemStyle: {
      areaColor: 'rgba(18, 91, 151, 0.76)',
      borderColor: 'rgba(58, 203, 255, 0.78)',
      borderWidth: 0.55
    },
    emphasis: { itemStyle: { areaColor: 'rgba(22, 151, 215, 0.92)', borderColor: '#6be7ff', borderWidth: 1 }, label: { show: true, color: '#e9fbff', fontSize: 13 } },
    select: { itemStyle: { areaColor: 'rgba(19, 129, 192, 0.9)' }, label: { color: '#ffffff' } },
    silent: false
  },
  series: [
    ...(showLinks.value ? [{ type: 'lines', coordinateSystem: 'geo', zlevel: 1, silent: true, effect: { show: true, period: 6, trailLength: 0.22, symbolSize: 3 }, lineStyle: { width: 1, opacity: 0.35, curveness: 0.2 }, data: linkSeries.value }] : []),
    ...(showSites.value ? [{ name: '机房', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 3, rippleEffect: { scale: 2.6, brushType: 'stroke' }, label: { show: true, position: 'right', formatter: '{b}', color: '#dff9ff', fontSize: 14 }, data: siteSeries.value }] : []),
    ...(showTerminals.value ? [{ name: '终端区域', type: 'scatter', coordinateSystem: 'geo', zlevel: 2, symbol: 'pin', label: { show: true, position: 'inside', formatter: (params: any) => String(params.value?.[2] ?? ''), color: '#06101d', fontWeight: 800, fontSize: 13 }, data: terminalSeries.value }] : [])
  ]
}));

function handleChartClick(params: Record<string, any>) {
  const payload = params.data?.payload as SituationGeoSelection | undefined;
  if (payload) selected.value = payload;
}
</script>

<template>
  <div class="world-map-shell">
    <div class="map-toolbar" aria-label="地图图层">
      <label><input v-model="showSites" type="checkbox" />机房</label>
      <label><input v-model="showTerminals" type="checkbox" />终端区域</label>
      <label><input v-model="showLinks" type="checkbox" />风险连线</label>
    </div>

    <EChartWidget
      v-if="worldGeoJson"
      :option="chartOption"
      :map-definition="{ name: 'world-countries', geoJson: worldGeoJson }"
      @chart-click="handleChartClick"
    />
    <BaseSkeleton v-else class="map-loading" width="100%" height="100%" />

    <Transition name="map-detail">
      <article v-if="selected" class="map-selection" :class="`is-${selected.status}`">
        <button class="selection-close" type="button" aria-label="关闭地图详情" @click="selected = null">×</button>
        <template v-if="selected.kind === 'site'">
          <span>{{ selected.countryName }} · {{ selected.city }}</span>
          <h3>{{ selected.name }}</h3>
          <div class="selection-grid">
            <strong>{{ selected.deviceCount }}<small>设备</small></strong>
            <strong>{{ selected.onlineRate }}%<small>在线率</small></strong>
            <strong>{{ selected.alertCount }}<small>告警</small></strong>
            <strong>{{ selected.resourceUsage }}%<small>负载</small></strong>
          </div>
          <BaseButton @click="emit('enterSite', selected.siteCode)">进入机房</BaseButton>
        </template>
        <template v-else>
          <span>国家级终端聚合</span>
          <h3>{{ selected.countryName }}</h3>
          <div class="selection-grid">
            <strong>{{ selected.total }}<small>终端</small></strong>
            <strong>{{ selected.online }}<small>在线</small></strong>
            <strong>{{ selected.offline }}<small>离线</small></strong>
            <strong>{{ selected.warning + selected.danger }}<small>异常</small></strong>
          </div>
          <BaseButton @click="emit('enterCountry', selected.countryCode)">查看终端</BaseButton>
        </template>
      </article>
    </Transition>
  </div>
</template>

<style scoped>
.world-map-shell { position: relative; min-height: 0; height: 100%; overflow: hidden; background: radial-gradient(circle at 50% 48%, rgba(22, 111, 151, .16), transparent 54%), linear-gradient(rgba(35, 216, 255, .025) 1px, transparent 1px), linear-gradient(90deg, rgba(35, 216, 255, .025) 1px, transparent 1px); background-size: auto, 30px 30px, 30px 30px; }
.map-loading { position: absolute; inset: 44px 8px 8px; width: auto !important; height: auto !important; }
.map-toolbar { position: absolute; z-index: 5; top: 8px; left: 10px; display: flex; gap: 6px; padding: 5px; border: 1px solid rgba(53, 216, 255, .22); background: rgba(5, 17, 31, .84); }
.map-toolbar label { display: flex; align-items: center; gap: 4px; padding: 3px 6px; color: #9fc7dc; font-size: 11px; cursor: pointer; }
.map-toolbar input { accent-color: #35d8ff; }
.map-selection { position: absolute; z-index: 6; right: 12px; bottom: 12px; width: min(300px, calc(100% - 24px)); padding: 14px; border: 1px solid rgba(53, 216, 255, .42); background: rgba(5, 17, 31, .95); box-shadow: 0 0 28px rgba(53, 216, 255, .12); }
.map-selection.is-danger { border-color: rgba(255, 97, 120, .65); }
.map-selection.is-warning { border-color: rgba(255, 200, 87, .6); }
.map-selection > span { color: #79a8c1; font-size: 11px; }
.map-selection h3 { margin: 4px 24px 10px 0; color: #effcff; font-size: 16px; }
.selection-close { position: absolute; top: 6px; right: 8px; border: 0; background: transparent; color: #8fb4c8; font-size: 20px; cursor: pointer; }
.selection-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; }
.selection-grid strong { display: grid; gap: 2px; color: #35d8ff; font-size: 15px; }
.selection-grid small { color: #7f9cae; font-size: 10px; font-weight: 400; }
.map-detail-enter-active, .map-detail-leave-active { transition: opacity .2s ease, transform .2s ease; }
.map-detail-enter-from, .map-detail-leave-to { opacity: 0; transform: translateY(10px); }
@media (max-width: 700px) { .map-toolbar { right: 8px; flex-wrap: wrap; } .selection-grid { grid-template-columns: repeat(2, 1fr); } }
@media (prefers-reduced-motion: reduce) { .map-detail-enter-active, .map-detail-leave-active { transition: none; } }
</style>
