<template>
  <section class="asset-cluster glass-card">
    <header v-if="title || description" class="asset-cluster-header">
      <div>
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
      <slot name="extra" />
    </header>

    <div class="asset-grid">
      <article
        v-for="node in nodes"
        :key="node.id"
        class="asset-card"
        :class="[node.status, { active: node.id === selectedNodeId, cluster: isCluster(node) }]"
      >
        <button class="asset-card-main" type="button" @click="handleClick(node)">
          <span class="asset-icon"><BaseIcon :name="resolveIcon(node)" /></span>
          <div class="asset-copy">
            <strong>{{ node.name }}</strong>
            <p>{{ node.description || defaultDescription(node) }}</p>
          </div>
          <span v-if="node.count && node.count > 1" class="asset-count">{{ node.count }}</span>
        </button>

        <div v-if="node.badges?.length" class="asset-badges">
          <span v-for="badge in node.badges.slice(0, 3)" :key="badge.label" class="tag" :class="badge.tone ?? 'info'">{{ badge.label }}</span>
        </div>

        <div v-if="node.metrics?.length" class="asset-metrics">
          <span v-for="metric in node.metrics.slice(0, 2)" :key="metric.label">{{ metric.label }} {{ metric.value }}</span>
        </div>

        <div v-if="expandedClusterId === node.id && node.children?.length" class="asset-children">
          <button
            v-for="child in node.children"
            :key="child.id"
            type="button"
            class="asset-child"
            :class="[child.status, { active: child.id === selectedNodeId }]"
            @click="emit('select-node', child)"
          >
            <span class="asset-child-icon"><BaseIcon :name="resolveIcon(child)" /></span>
            <span class="asset-child-name">{{ child.name }}</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import type { BaseIconName } from '@/components/common/BaseIcon.vue';
import type { VisualAssetNode } from '@/types/visualization';
import { assetTypeIcon } from '@/utils/visualization';
import { ref } from 'vue';

const props = defineProps<{
  nodes: VisualAssetNode[];
  title?: string;
  description?: string;
  selectedNodeId?: string;
}>();

const emit = defineEmits<{
  'select-node': [node: VisualAssetNode];
}>();

const expandedClusterId = ref<string | null>(null);

function isCluster(node: VisualAssetNode) {
  return Boolean(node.children?.length) || (node.count ?? 0) > 1 || node.assetType === 'cluster';
}

function handleClick(node: VisualAssetNode) {
  if (isCluster(node) && node.children?.length) {
    expandedClusterId.value = expandedClusterId.value === node.id ? null : node.id;
    return;
  }

  emit('select-node', node);
}

function resolveIcon(node: VisualAssetNode) {
  return (node.icon as BaseIconName | undefined) ?? assetTypeIcon(node.assetType);
}

function defaultDescription(node: VisualAssetNode) {
  if (isCluster(node)) {
    return '点击展开资产明细';
  }

  return node.metrics?.map((item) => `${item.label}${item.value}`).join(' · ') || '点击查看详情';
}
</script>

<style scoped>
.asset-cluster {
  height: 100%;
  padding: 14px;
  display: flex;
  flex-direction: column;
}

.asset-cluster-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.asset-cluster-header h3 {
  margin: 0;
  font-size: 18px;
}

.asset-cluster-header p {
  margin: 6px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.asset-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
  overflow: auto;
  align-content: start;
}

.asset-card {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(9, 21, 37, 0.82);
}

.asset-card.active {
  border-color: var(--sys-color-brand-secondary);
}

.asset-card-main {
  width: 100%;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0;
}

.asset-icon,
.asset-child-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(30, 136, 255, 0.14);
  color: var(--sys-color-brand-secondary);
}

.asset-copy {
  min-width: 0;
}

.asset-copy strong {
  display: block;
  font-size: var(--font-size-14);
}

.asset-copy p,
.asset-metrics {
  margin: 4px 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.asset-count {
  min-width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(30, 136, 255, 0.14);
  color: var(--sys-color-text-primary);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.asset-badges,
.asset-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.asset-children {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--sys-color-border-secondary);
}

.asset-child {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(16, 34, 56, 0.82);
  color: var(--sys-color-text-primary);
  cursor: pointer;
}

.asset-child.active {
  border-color: var(--sys-color-brand-secondary);
}

.asset-child-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-card.success,
.asset-child.success {
  border-color: var(--sys-color-status-success-border);
}

.asset-card.warning,
.asset-child.warning {
  border-color: var(--sys-color-status-warning-border);
}

.asset-card.danger,
.asset-child.danger {
  border-color: var(--sys-color-status-danger-border);
}
</style>
