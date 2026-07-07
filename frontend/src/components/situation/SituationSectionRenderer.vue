<template>
  <SituationMatrixPanel v-if="section.kind === 'matrix'" :section="section" />
  <SituationChartPanel v-else-if="section.kind === 'chart'" :section="section" />
  <SituationSignalPanel v-else-if="section.kind === 'signals'" :section="section" />
  <SituationSourcePanel v-else-if="section.kind === 'sources'" :section="section" />
  <SituationCardsPanel v-else-if="section.kind === 'cards'" :section="section" />
  <SituationTablePanel v-else-if="section.kind === 'table'" :section="section" />
  <SituationTimelinePanel v-else-if="section.kind === 'timeline'" :section="section" />
</template>

<script setup lang="ts">
import type { SituationSection } from '@/types/situation';
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
</script>
