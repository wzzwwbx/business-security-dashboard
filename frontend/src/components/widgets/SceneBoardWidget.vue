<template>
  <section class="scene-board glass-card" :aria-label="title || '态势主视觉'">
    <header v-if="title || description || legend?.length" class="scene-header">
      <div>
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="legend?.length" class="scene-legend">
        <span v-for="item in legend" :key="item" class="tag">{{ item }}</span>
      </div>
    </header>

    <div class="scene-canvas">
      <svg class="scene-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g v-for="link in resolvedLinks" :key="link.id">
          <path
            class="scene-link"
            :class="link.tone ?? 'info'"
            :d="`M ${link.fromX} ${link.fromY} Q ${link.controlX} ${link.controlY} ${link.toX} ${link.toY}`"
            fill="none"
            stroke-width="0.4"
          />
        </g>
      </svg>

      <button
        v-for="node in nodes"
        :key="node.id"
        type="button"
        class="scene-node"
        :class="[node.status, { active: node.id === activeNodeId, core: isCoreNode(node) }]"
        :style="nodeStyle(node)"
        @click="emit('select-node', node)"
      >
        <span class="scene-node-icon"><BaseIcon :name="resolveIcon(node)" /></span>
        <span class="scene-node-name">{{ node.name }}</span>
        <span v-if="node.count && node.count > 1" class="scene-node-count">{{ node.count }}</span>
        <span v-if="node.description" class="scene-node-desc">{{ node.description }}</span>
        <span v-if="node.metrics?.[0]" class="scene-node-metric">{{ node.metrics[0].label }} {{ node.metrics[0].value }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import type { BaseIconName } from '@/components/common/BaseIcon.vue';
import type { VisualAssetNode, VisualLink } from '@/types/visualization';
import { assetTypeIcon } from '@/utils/visualization';
import { computed } from 'vue';

const props = defineProps<{
  nodes: VisualAssetNode[];
  links?: VisualLink[];
  title?: string;
  description?: string;
  legend?: string[];
  activeNodeId?: string;
}>();

const emit = defineEmits<{
  'select-node': [node: VisualAssetNode];
}>();

const resolvedLinks = computed(() => (props.links ?? []).map((link, index) => {
  const from = props.nodes.find((item) => item.id === link.from);
  const to = props.nodes.find((item) => item.id === link.to);
  return {
    ...link,
    id: link.id ?? `${link.from}-${link.to}-${index}`,
    fromX: from?.x ?? 50,
    fromY: from?.y ?? 50,
    toX: to?.x ?? 50,
    toY: to?.y ?? 50,
    controlX: ((from?.x ?? 50) + (to?.x ?? 50)) / 2,
    controlY: ((from?.y ?? 50) + (to?.y ?? 50)) / 2 - 7
  };
}));

function nodeStyle(node: VisualAssetNode) {
  return {
    left: `${node.x ?? 50}%`,
    top: `${node.y ?? 50}%`
  };
}

function resolveIcon(node: VisualAssetNode) {
  return (node.icon as BaseIconName | undefined) ?? assetTypeIcon(node.assetType);
}

function isCoreNode(node: VisualAssetNode) {
  return node.assetType === 'domain' || node.id.includes('center') || node.id.includes('hub');
}
</script>

<style scoped>
.scene-board {
  height: 100%;
  min-height: var(--layout-scene-height);
  padding: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scene-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.scene-header h3 {
  margin: 0;
  font-size: 18px;
}

.scene-header p {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.scene-legend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.scene-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--sys-color-border-secondary);
  background:
    radial-gradient(circle at 50% 50%, rgba(30, 136, 255, 0.2), transparent 20%),
    linear-gradient(var(--sys-color-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--sys-color-grid-line) 1px, transparent 1px),
    linear-gradient(180deg, rgba(10, 21, 36, 0.9), rgba(6, 15, 27, 0.95));
  background-size: auto, 42px 42px, 42px 42px, auto;
}

.scene-canvas::before {
  content: '';
  position: absolute;
  inset: 14% 24%;
  border-radius: 50%;
  border: 1px solid rgba(45, 226, 230, 0.12);
  box-shadow: inset 0 0 50px rgba(30, 136, 255, 0.08);
}

.scene-links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.scene-link {
  stroke: var(--sys-color-line-topology);
  opacity: 0.82;
}

.scene-link.success {
  stroke: var(--sys-color-status-success);
}

.scene-link.warning {
  stroke: var(--sys-color-status-warning);
}

.scene-link.danger {
  stroke: var(--sys-color-status-danger);
}

.scene-node {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 118px;
  max-width: 170px;
  padding: 12px 14px;
  display: grid;
  gap: 4px;
  border-radius: 18px;
  border: 1px solid var(--sys-color-border-primary);
  background: linear-gradient(180deg, rgba(14, 31, 54, 0.95), rgba(8, 19, 33, 0.95));
  color: var(--sys-color-text-primary);
  box-shadow: 0 12px 28px rgba(2, 10, 23, 0.28);
  cursor: pointer;
  text-align: left;
}

.scene-node:hover,
.scene-node.active {
  border-color: var(--sys-color-brand-secondary);
  box-shadow: 0 0 0 1px rgba(45, 226, 230, 0.16), 0 18px 36px rgba(2, 10, 23, 0.35);
}

.scene-node.core {
  min-width: 160px;
  max-width: 210px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(20, 54, 96, 0.95), rgba(10, 24, 43, 0.95));
}

.scene-node-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(30, 136, 255, 0.14);
  color: var(--sys-color-brand-secondary);
}

.scene-node-name {
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-semibold);
}

.scene-node-count,
.scene-node-desc,
.scene-node-metric {
  font-size: var(--font-size-12);
  color: var(--sys-color-text-secondary);
}

.scene-node.success {
  border-color: var(--sys-color-status-success-border);
}

.scene-node.warning {
  border-color: var(--sys-color-status-warning-border);
}

.scene-node.danger {
  border-color: var(--sys-color-status-danger-border);
}

@media (max-width: 1280px) {
  .scene-board {
    min-height: 480px;
  }
}

@media (max-width: 640px) {
  .scene-header {
    flex-direction: column;
  }

  .scene-node {
    min-width: 100px;
    padding: 10px;
  }
}
</style>
