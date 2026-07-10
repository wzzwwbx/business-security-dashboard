<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import type { OpsTimeseriesDto } from '@/types/ops';
import { computed } from 'vue';

const props = defineProps<{
  timeseries: OpsTimeseriesDto | null;
  range: '1h' | '6h' | '24h';
}>();

const emit = defineEmits<{
  changeRange: [range: '1h' | '6h' | '24h'];
}>();

const chartOption = computed(() => {
  const points = props.timeseries?.points ?? [];
  if (!points.length) {
    return {};
  }

  return {
    legend: { top: 0 },
    grid: { left: 24, right: 24, top: 42, bottom: 20, containLabel: true },
    xAxis: { type: 'category', data: points.map((point) => point.observedAt.slice(11, 16)) },
    yAxis: [
      { type: 'value', name: '%' },
      { type: 'value', name: 'KB/s' }
    ],
    series: [
      { type: 'line', name: '处理器', smooth: true, data: points.map((point) => point.cpuUsagePct) },
      { type: 'line', name: '内存', smooth: true, data: points.map((point) => point.memoryUsagePct) },
      {
        type: 'bar',
        name: '下行流量',
        yAxisIndex: 1,
        data: points.map((point) => Math.round(point.rxBytesPerSec / 1024))
      },
      {
        type: 'bar',
        name: '上行流量',
        yAxisIndex: 1,
        data: points.map((point) => Math.round(point.txBytesPerSec / 1024))
      }
    ]
  };
});
</script>

<template>
  <PanelCard title="资源趋势" :tags="['处理器/内存/网络', '最新可信快照']" :min-height="360">
    <template #extra>
      <div class="range-group">
        <BaseButton
          v-for="item in ['1h', '6h', '24h'] as const"
          :key="item"
          :variant="item === range ? 'primary' : 'secondary'"
          @click="emit('changeRange', item)"
        >
          {{ item }}
        </BaseButton>
      </div>
    </template>

    <EChartWidget v-if="timeseries?.points.length" :option="chartOption" />
    <BaseEmpty v-else title="暂无趋势数据" description="等待主机持续上报多个采集点后展示趋势。" />
  </PanelCard>
</template>

<style scoped>
.range-group {
  display: inline-flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
</style>
