<script setup lang="ts">
import type { SituationInsight, SituationSection } from '@/types/situation';
import type { VisualAssetNode } from '@/types/visualization';
import SituationAssetClusterPanel from './SituationAssetClusterPanel.vue';
import SituationCardsPanel from './SituationCardsPanel.vue';
import SituationChartPanel from './SituationChartPanel.vue';
import SituationDrilldownSummaryPanel from './SituationDrilldownSummaryPanel.vue';
import SituationMatrixPanel from './SituationMatrixPanel.vue';
import SituationMiniTrendPanel from './SituationMiniTrendPanel.vue';
import SituationScenePanel from './SituationScenePanel.vue';
import SituationSignalPanel from './SituationSignalPanel.vue';
import SituationSourcePanel from './SituationSourcePanel.vue';
import SituationTablePanel from './SituationTablePanel.vue';
import SituationTimelinePanel from './SituationTimelinePanel.vue';

defineProps<{
  section: SituationSection;
}>();

const emit = defineEmits<{
  'select-insight': [insight: SituationInsight];
  'select-node': [node: VisualAssetNode];
}>();
</script>

<template>
  <SituationScenePanel
    v-if="section.kind === 'scene' || section.kind === 'relationMap'"
    :section="section"
    @select-node="emit('select-node', $event)"
  />
  <SituationAssetClusterPanel
    v-else-if="section.kind === 'assetCluster'"
    :section="section"
    @select-node="emit('select-node', $event)"
  />
  <SituationMiniTrendPanel
    v-else-if="section.kind === 'miniTrendGroup'"
    :section="section"
  />
  <SituationDrilldownSummaryPanel
    v-else-if="section.kind === 'drilldownSummary'"
    :section="section"
    @select-insight="emit('select-insight', $event)"
  />
  <SituationMatrixPanel
    v-else-if="section.kind === 'matrix'"
    :section="section"
    @select-insight="emit('select-insight', $event)"
  />
  <SituationChartPanel v-else-if="section.kind === 'chart'" :section="section" />
  <SituationSignalPanel
    v-else-if="section.kind === 'signals'"
    :section="section"
    @select-insight="emit('select-insight', $event)"
  />
  <SituationSourcePanel
    v-else-if="section.kind === 'sources'"
    :section="section"
    @select-insight="emit('select-insight', $event)"
  />
  <SituationCardsPanel
    v-else-if="section.kind === 'cards'"
    :section="section"
    @select-insight="emit('select-insight', $event)"
  />
  <SituationTablePanel
    v-else-if="section.kind === 'table'"
    :section="section"
    @select-insight="emit('select-insight', $event)"
  />
  <SituationTimelinePanel
    v-else-if="section.kind === 'timeline'"
    :section="section"
    @select-insight="emit('select-insight', $event)"
  />
</template>
