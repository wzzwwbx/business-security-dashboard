<template>
  <PanelCard :title="widget.title" :tags="widget.tags" :min-height="widget.minHeight">
    <div class="widget-body">
      <EChartWidget
        v-if="chartTypes.includes(widget.type)"
        :option="(widget.payload.option as Record<string, unknown>) || {}"
      />
      <StatusGridWidget
        v-else-if="widget.type === 'statusGrid'"
        :items="(widget.payload.items as never[]) || []"
      />
      <TopologyWidget
        v-else-if="widget.type === 'topology'"
        :nodes="(widget.payload.nodes as never[]) || []"
        :lines="(widget.payload.lines as never[]) || []"
      />
      <TableWidget
        v-else-if="widget.type === 'table'"
        :columns="(widget.payload.columns as never[]) || []"
        :rows="(widget.payload.rows as never[]) || []"
      />
      <TimelineWidget
        v-else-if="widget.type === 'timeline'"
        :items="(widget.payload.items as never[]) || []"
      />
      <AlertListWidget
        v-else-if="widget.type === 'alertList'"
        :items="(widget.payload.items as never[]) || []"
      />
      <RecommendationWidget
        v-else-if="widget.type === 'recommendationList'"
        :items="(widget.payload.items as never[]) || []"
      />
      <NodeMapWidget
        v-else-if="widget.type === 'nodeMap'"
        :regions="(widget.payload.regions as never[]) || []"
      />
      <BaseEmpty
        v-else
        title="暂未识别的组件类型"
        :description="`组件 ${widget.type} 尚未接入渲染器，请补充对应 Widget 实现。`"
      />
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import type { WidgetDefinition } from '@/types/dashboard';
import AlertListWidget from './AlertListWidget.vue';
import EChartWidget from './EChartWidget.vue';
import NodeMapWidget from './NodeMapWidget.vue';
import RecommendationWidget from './RecommendationWidget.vue';
import StatusGridWidget from './StatusGridWidget.vue';
import TableWidget from './TableWidget.vue';
import TimelineWidget from './TimelineWidget.vue';
import TopologyWidget from './TopologyWidget.vue';

const chartTypes = ['lineChart', 'barChart', 'pieChart', 'radarChart', 'gaugeChart'];

defineProps<{
  widget: WidgetDefinition;
}>();
</script>

<style scoped>
.widget-body {
  height: 100%;
  min-height: 0;
}

.widget-body > * {
  height: 100%;
}
</style>
