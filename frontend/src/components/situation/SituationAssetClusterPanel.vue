<template>
  <AssetClusterWidget
    :title="section.title"
    :description="section.description"
    :nodes="section.nodes"
    @select-node="emit('select-node', $event)"
  />
</template>

<script setup lang="ts">
import AssetClusterWidget from '@/components/widgets/AssetClusterWidget.vue';
import type { SituationAssetClusterSection } from '@/types/situation';
import type { VisualAssetNode } from '@/types/visualization';

defineProps<{
  section: SituationAssetClusterSection;
}>();

const emit = defineEmits<{
  'select-node': [node: VisualAssetNode];
}>();
</script>
