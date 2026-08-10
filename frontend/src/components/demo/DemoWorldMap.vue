<script setup lang="ts">
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
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
const overseas = computed(() => props.regions.filter((region) => region.countryCode !== 'CN'));

const chartOption = computed(() => {
  const center = beijing.value;
  const points = props.regions.map((region) => ({
    name: region.countryCode === 'CN' ? '北京' : region.countryName,
    value: [region.longitude, region.latitude, region.people.length],
    symbolSize: region.countryCode === 'CN' ? 26 : 20,
    itemStyle: {
      color: regionStatus(region).color,
      borderColor: props.selectedCountryCode === region.countryCode ? '#ffffff' : 'rgba(255,255,255,.55)',
      borderWidth: props.selectedCountryCode === region.countryCode ? 2 : 1
    },
    payload: region
  }));

  const lines = center ? overseas.value.map((region) => ({
    coords: [[center.longitude, center.latitude], [region.longitude, region.latitude]],
    value: region.downlinkMbps,
    lineStyle: {
      color: regionStatus(region).color,
      width: 1 + region.downlinkMbps / 3,
      opacity: 0.48
    }
  })) : [];

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 16, 29, .96)',
      borderColor: 'rgba(105, 151, 255, .55)',
      textStyle: { color: '#e9edfa', fontSize: 14 },
      formatter: (params: any) => {
        const region = params.data?.payload as DemoRegion | undefined;
        if (!region) return params.name ?? '';
        const online = region.people.filter((person) => person.online).length;
        const healthy = region.people.filter((person) => person.suiteStatus === 'healthy').length;
        return `<strong>${region.countryCode === 'CN' ? '北京' : region.countryName}</strong><br/>配发人员 ${region.people.length} 人 · 在线 ${online} 人 · ${regionStatus(region).label}<br/>完整套件 ${healthy} 套 · 今日流量 ${region.trafficGb.toFixed(1)} GB`;
      }
    },
    geo: {
      map: 'demo-world-countries',
      roam: true,
      zoom: 1.1,
      center: [18, 17],
      scaleLimit: { min: 0.85, max: 6 },
      itemStyle: { areaColor: '#17243b', borderColor: '#46617f', borderWidth: 0.6 },
      emphasis: { itemStyle: { areaColor: '#243b5d', borderColor: '#8eb1db' }, label: { show: true, color: '#eef4ff', fontSize: 16 } },
      select: { disabled: true }
    },
    series: [
      { type: 'lines', coordinateSystem: 'geo', zlevel: 1, silent: true, effect: { show: true, period: 7, trailLength: 0.15, symbolSize: 3 }, data: lines },
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

function handleClick(payload: Record<string, any>) {
  const region = payload.data?.payload as DemoRegion | undefined;
  if (region) emit('selectCountry', region.countryCode);
}
</script>

<template>
  <div class="demo-map">
    <EChartWidget
      v-if="worldGeoJson"
      :option="chartOption"
      :map-definition="{ name: 'demo-world-countries', geoJson: worldGeoJson }"
      @chart-click="handleClick"
    />
    <BaseSkeleton v-else width="100%" height="100%" />
  </div>
</template>

<style scoped>
.demo-map { width: 100%; height: 100%; min-height: 300px; }
</style>
