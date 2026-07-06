<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import type { OpsSourceDto } from '@/types/ops';
import { formatRelativeTime, statusLabel, statusTone } from '@/utils/opsFormatters';

defineProps<{
  sources: OpsSourceDto[];
}>();
</script>

<template>
  <PanelCard title="来源概览" :tags="['多源汇聚', '统一态势域']" :min-height="240">
    <div v-if="sources.length" class="sources-grid">
      <article v-for="source in sources" :key="`${source.sourceType}-${source.sourceSystem}`" class="source-item">
        <div class="source-head">
          <strong>{{ source.sourceSystem }}</strong>
          <span class="badge" :class="statusTone(source.enabled ? source.status : 'OFFLINE')">
            {{ source.enabled ? statusLabel(source.status) : '停用' }}
          </span>
        </div>
        <div class="source-meta">
          <span class="tag">{{ statusLabel(source.sourceType) }}</span>
          <span class="tag">覆盖 {{ source.hostCount }} 台</span>
        </div>
        <p>最近同步：{{ formatRelativeTime(source.lastSeenAt) }}</p>
      </article>
    </div>
    <BaseEmpty v-else title="暂无来源" description="当前尚未接收到 Probe 或外部系统数据。" />
  </PanelCard>
</template>

<style scoped>
.sources-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--layout-grid-gap);
}

.source-item {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  border: 1px solid var(--sys-color-border-secondary);
}

.source-head,
.source-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.source-item p {
  margin: var(--space-4) 0 0;
  color: var(--sys-color-text-secondary);
}

@media (max-width: 1280px) {
  .sources-grid {
    grid-template-columns: 1fr;
  }
}
</style>
