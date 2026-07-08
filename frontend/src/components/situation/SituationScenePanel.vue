<template>
  <SceneBoardWidget
    :title="section.title"
    :description="section.description"
    :nodes="section.nodes"
    :links="section.links"
    :legend="section.legend"
    @select-node="emit('select-node', $event)"
  />
</template>

<script setup lang="ts">
import SceneBoardWidget from '@/components/widgets/SceneBoardWidget.vue';
import type { SituationSceneSection } from '@/types/situation';
import type { VisualAssetNode } from '@/types/visualization';

defineProps<{
  section: SituationSceneSection;
}>();

const emit = defineEmits<{
  'select-node': [node: VisualAssetNode];
}>();
</script>
