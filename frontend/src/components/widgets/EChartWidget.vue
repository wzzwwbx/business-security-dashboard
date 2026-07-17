<template>
  <div v-if="hasData" class="chart-shell">
    <div ref="chartRef" class="chart-box" :class="{ 'chart-box--hidden': !chartReady || Boolean(chartError) }"></div>

    <div v-if="!chartReady && !chartError" class="chart-loading" aria-hidden="true">
      <BaseSkeleton width="100%" height="100%" />
    </div>

    <BaseEmpty
      v-if="chartError"
      class="chart-empty"
      icon="refresh"
      title="图表渲染失败"
      :description="chartError"
    >
      <BaseButton class="chart-retry" variant="secondary" @click="retryRender">
        <template #icon><BaseIcon name="refresh" /></template>
        重新渲染
      </BaseButton>
    </BaseEmpty>
  </div>

  <BaseEmpty
    v-else
    class="chart-empty"
    title="图表暂无数据"
    description="当前图表组件未获取到可视化数据，请检查数据源或稍后刷新。"
  />
</template>

<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseIcon from '@/components/common/BaseIcon.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ECharts, EChartsOption } from 'echarts';
import * as echartsCore from 'echarts/core';
import * as echartsCharts from 'echarts/charts';
import * as echartsComponents from 'echarts/components';
import * as echartsRenderers from 'echarts/renderers';

const props = defineProps<{
  option: Record<string, unknown>;
  mapDefinition?: {
    name: string;
    geoJson: Record<string, unknown>;
  };
}>();

const emit = defineEmits<{
  chartClick: [payload: Record<string, any>];
}>();

type EChartsModule = {
  init: typeof echartsCore.init;
  registerMap: typeof echartsCore.registerMap;
};

const chartRef = ref<HTMLDivElement | null>(null);
const hasData = computed(() => Object.keys(props.option ?? {}).length > 0);
const chartReady = ref(false);
const chartError = ref('');

let chart: ECharts | null = null;
const echartsModule: EChartsModule = { init: echartsCore.init, registerMap: echartsCore.registerMap };
let resizeObserver: ResizeObserver | null = null;

echartsCore.use([
  echartsCharts.LineChart,
  echartsCharts.BarChart,
  echartsCharts.PieChart,
  echartsCharts.RadarChart,
  echartsCharts.GaugeChart,
  echartsCharts.FunnelChart,
  echartsCharts.MapChart,
  echartsCharts.ScatterChart,
  echartsCharts.EffectScatterChart,
  echartsCharts.LinesChart,
  echartsCharts.GraphChart,
  echartsCharts.SankeyChart,
  echartsComponents.TitleComponent,
  echartsComponents.TooltipComponent,
  echartsComponents.LegendComponent,
  echartsComponents.GridComponent,
  echartsComponents.RadarComponent,
  echartsComponents.GeoComponent,
  echartsComponents.VisualMapComponent,
  echartsComponents.AriaComponent,
  echartsRenderers.CanvasRenderer
]);

const readToken = (name: string, fallback: string) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

const cloneOptionValue = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneOptionValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneOptionValue(item)])
    ) as T;
  }

  return value;
};

const ensureEcharts = async () => echartsModule;

const normalizeAxis = (axis: unknown, axisType: 'x' | 'y') => {
  if (!axis) {
    return axis;
  }

  const axisLineColor = readToken('--sys-color-border-secondary', 'rgba(89,145,226,0.18)');
  const axisLabelColor = readToken('--sys-color-text-secondary', '#90a4c3');
  const splitLineColor = readToken('--sys-color-border-table', 'rgba(91,151,255,0.14)');

  const applyAxisStyle = (item: Record<string, any>) => ({
    ...item,
    axisLine: {
      lineStyle: { color: axisLineColor },
      ...(item.axisLine ?? {})
    },
    axisTick: {
      show: false,
      ...(item.axisTick ?? {})
    },
    axisLabel: {
      color: axisLabelColor,
      ...(item.axisLabel ?? {})
    },
    splitLine:
      axisType === 'y'
        ? {
            lineStyle: { color: splitLineColor },
            ...(item.splitLine ?? {})
          }
        : item.splitLine
  });

  return Array.isArray(axis) ? axis.map(applyAxisStyle) : applyAxisStyle(axis as Record<string, any>);
};

const themedOption = computed<EChartsOption>(() => {
  const option = cloneOptionValue(props.option ?? {}) as EChartsOption & Record<string, any>;
  const tooltipBg = readToken('--sys-color-tooltip-bg', 'rgba(9,21,39,0.96)');
  const tooltipBorder = readToken('--sys-color-tooltip-border', 'rgba(91,151,255,0.22)');
  const textPrimary = readToken('--sys-color-text-primary', '#f3f8ff');
  const textSecondary = readToken('--sys-color-text-secondary', '#90a4c3');
  const animationDuration = prefersReducedMotion() ? 0 : 240;

  option.color = option.color ?? [
    readToken('--chart-1', '#2de2e6'),
    readToken('--chart-2', '#1e88ff'),
    readToken('--chart-3', '#ffb547'),
    readToken('--chart-4', '#ff6b7d'),
    readToken('--chart-5', '#3ddc97')
  ];

  option.backgroundColor = 'transparent';
  option.animationDuration = option.animationDuration ?? animationDuration;
  option.animationDurationUpdate = option.animationDurationUpdate ?? animationDuration;
  option.textStyle = {
    color: textPrimary,
    fontFamily: readToken('--font-family-base', 'PingFang SC, sans-serif'),
    ...(option.textStyle ?? {})
  };
  option.tooltip = {
    backgroundColor: tooltipBg,
    borderColor: tooltipBorder,
    borderWidth: 1,
    textStyle: { color: textPrimary },
    ...(option.tooltip ?? {})
  };
  option.legend = option.legend
    ? {
        textStyle: {
          color: textSecondary,
          ...((option.legend as Record<string, any>).textStyle ?? {})
        },
        ...(option.legend as Record<string, any>)
      }
    : option.legend;
  option.title = option.title
    ? {
        textStyle: {
          color: textPrimary,
          ...((option.title as Record<string, any>).textStyle ?? {})
        },
        subtextStyle: {
          color: textSecondary,
          ...((option.title as Record<string, any>).subtextStyle ?? {})
        },
        ...(option.title as Record<string, any>)
      }
    : option.title;
  option.xAxis = normalizeAxis(option.xAxis, 'x');
  option.yAxis = normalizeAxis(option.yAxis, 'y');
  option.radar = option.radar
    ? {
        axisName: {
          color: textSecondary,
          ...((option.radar as Record<string, any>).axisName ?? {})
        },
        splitLine: {
          lineStyle: { color: readToken('--sys-color-border-table', 'rgba(91,151,255,0.14)') },
          ...((option.radar as Record<string, any>).splitLine ?? {})
        },
        axisLine: {
          lineStyle: { color: readToken('--sys-color-border-table', 'rgba(91,151,255,0.14)') },
          ...((option.radar as Record<string, any>).axisLine ?? {})
        },
        ...(option.radar as Record<string, any>)
      }
    : option.radar;

  if (Array.isArray(option.series)) {
    option.series = option.series.map((series) => {
      if (typeof series !== 'object' || series === null) {
        return series;
      }

      const typedSeries = series as Record<string, any>;
      const seriesType = typedSeries.type;

      if (seriesType === 'pie') {
        return {
          ...typedSeries,
          label: {
            color: textSecondary,
            ...(typedSeries.label ?? {})
          }
        };
      }

      if (seriesType === 'gauge') {
        return {
          ...typedSeries,
          title: {
            color: textSecondary,
            ...(typedSeries.title ?? {})
          },
          detail: {
            color: textPrimary,
            ...(typedSeries.detail ?? {})
          }
        };
      }

      return series;
    });
  }

  return option;
});

const disposeChart = () => {
  chart?.dispose();
  chart = null;
  chartReady.value = false;
};

const bindResizeObserver = () => {
  if (resizeObserver || !chartRef.value || typeof ResizeObserver === 'undefined') {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    chart?.resize();
  });
  resizeObserver.observe(chartRef.value);
};

const renderChart = async () => {
  await nextTick();

  if (!chartRef.value || !hasData.value) {
    disposeChart();
    chartError.value = '';
    return;
  }

  chartError.value = '';

  try {
    const echarts = await ensureEcharts();

    if (props.mapDefinition) {
      echarts.registerMap(props.mapDefinition.name, props.mapDefinition.geoJson as never);
    }

    if (!chartRef.value) {
      return;
    }

    bindResizeObserver();

    if (!chart) {
      chart = echarts.init(chartRef.value);
      chart.on('click', (payload) => emit('chartClick', payload as Record<string, any>));
    }

    chart.setOption(themedOption.value, true);
    chart.resize();
    chartReady.value = true;
  } catch (error) {
    disposeChart();
    chartError.value = error instanceof Error ? error.message : '图表模块加载异常，请稍后重试。';
  }
};

const resizeChart = () => {
  chart?.resize();
};

const retryRender = async () => {
  chartReady.value = false;
  await renderChart();
};

onMounted(() => {
  renderChart();
  window.addEventListener('resize', resizeChart);
});

watch(
  [() => props.option, () => props.mapDefinition, themedOption, hasData],
  async ([, , , available]) => {
    if (!available) {
      disposeChart();
      chartError.value = '';
      return;
    }

    chartReady.value = false;
    await renderChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  resizeObserver?.disconnect();
  resizeObserver = null;
  disposeChart();
});
</script>

<style scoped>
.chart-shell {
  position: relative;
  min-height: 240px;
  height: 100%;
}

.chart-box {
  width: 100%;
  height: 100%;
  min-height: 240px;
  transition: opacity var(--motion-duration-fast) var(--motion-ease-standard);
}

.chart-box--hidden {
  opacity: 0;
}

.chart-loading,
.chart-empty {
  position: absolute;
  inset: 0;
}

.chart-loading :deep(.base-skeleton) {
  display: block;
  height: 100%;
  min-height: 240px;
}

.chart-empty {
  min-height: 240px;
}

.chart-retry {
  margin-top: var(--space-4);
}

@media (prefers-reduced-motion: reduce) {
  .chart-box {
    transition: none;
  }
}
</style>
