<script setup lang="ts">
import type { SituationInsight, SituationSection } from '@/types/situation';
import SituationCardsPanel from './SituationCardsPanel.vue';
import SituationChartPanel from './SituationChartPanel.vue';
import SituationMatrixPanel from './SituationMatrixPanel.vue';
import SituationSignalPanel from './SituationSignalPanel.vue';
import SituationSourcePanel from './SituationSourcePanel.vue';
import SituationTablePanel from './SituationTablePanel.vue';
import SituationTimelinePanel from './SituationTimelinePanel.vue';

defineProps<{
  section: SituationSection;
}>();

const emit = defineEmits<{
  selectInsight: [insight: SituationInsight];
}>();
</script>

<template>
  <SituationMatrixPanel
    v-if="section.kind === 'matrix'"
    :section="section"
    @select-insight="emit('selectInsight', $event)"
  />
  <SituationChartPanel v-else-if="section.kind === 'chart'" :section="section" />
  <SituationSignalPanel
    v-else-if="section.kind === 'signals'"
    :section="section"
    @select-insight="emit('selectInsight', $event)"
  />
  <SituationSourcePanel
    v-else-if="section.kind === 'sources'"
    :section="section"
    @select-insight="emit('selectInsight', $event)"
  />
  <SituationCardsPanel
    v-else-if="section.kind === 'cards'"
    :section="section"
    @select-insight="emit('selectInsight', $event)"
  />
  <SituationTablePanel
    v-else-if="section.kind === 'table'"
    :section="section"
    @select-insight="emit('selectInsight', $event)"
  />
  <SituationTimelinePanel
    v-else-if="section.kind === 'timeline'"
    :section="section"
    @select-insight="emit('selectInsight', $event)"
  />
</template>
