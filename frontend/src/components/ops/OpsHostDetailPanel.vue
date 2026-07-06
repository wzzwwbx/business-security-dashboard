<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import type { OpsHostDetailDto } from '@/types/ops';
import { formatBytes, formatDateTime, formatPercent, statusLabel, statusTone } from '@/utils/opsFormatters';

defineProps<{
  detail: OpsHostDetailDto | null;
}>();
</script>

<template>
  <PanelCard title="主机详情" :tags="['双标识', '可信最新快照']" :min-height="360">
    <div v-if="detail" class="detail-shell">
      <div class="detail-top">
        <div>
          <h3>{{ detail.displayName || detail.hostname }}</h3>
          <p>{{ detail.hostname }} · {{ detail.primaryIp }} · {{ detail.osName }} {{ detail.kernelVersion }}</p>
        </div>
        <span class="badge" :class="statusTone(detail.status)">{{ statusLabel(detail.status) }}</span>
      </div>

      <dl class="detail-grid">
        <div>
          <dt>Host Code</dt>
          <dd>{{ detail.hostCode }}</dd>
        </div>
        <div>
          <dt>架构 / 核心</dt>
          <dd>{{ detail.arch }} / {{ detail.cpuCores }} cores</dd>
        </div>
        <div>
          <dt>总内存</dt>
          <dd>{{ formatBytes(detail.memoryTotalBytes) }}</dd>
        </div>
        <div>
          <dt>最后观测</dt>
          <dd>{{ formatDateTime(detail.lastObservedAt) }}</dd>
        </div>
        <div>
          <dt>来源</dt>
          <dd>{{ statusLabel(detail.sourceType) }} / {{ detail.sourceSystem }}</dd>
        </div>
        <div>
          <dt>TCP 建连</dt>
          <dd>{{ detail.latestSnapshot.tcpEstablishedCount }}</dd>
        </div>
      </dl>

      <div class="snapshot-grid">
        <div class="snapshot-item">
          <span>CPU</span>
          <strong>{{ formatPercent(detail.latestSnapshot.cpuUsagePct) }}</strong>
        </div>
        <div class="snapshot-item">
          <span>内存</span>
          <strong>{{ formatPercent(detail.latestSnapshot.memoryUsagePct) }}</strong>
        </div>
        <div class="snapshot-item">
          <span>磁盘</span>
          <strong>{{ formatPercent(detail.latestSnapshot.diskUsagePct) }}</strong>
        </div>
        <div class="snapshot-item">
          <span>Load 1 / 5 / 15</span>
          <strong>{{ detail.latestSnapshot.load1.toFixed(2) }} / {{ detail.latestSnapshot.load5.toFixed(2) }} / {{ detail.latestSnapshot.load15.toFixed(2) }}</strong>
        </div>
      </div>

      <div v-if="detail.bindings.length" class="bindings-block">
        <strong>来源绑定</strong>
        <ul>
          <li v-for="binding in detail.bindings" :key="`${binding.sourceSystem}-${binding.externalAssetId}`">
            {{ binding.sourceSystem }} / {{ binding.externalAssetId }} / {{ binding.externalHostName || '未命名' }}
          </li>
        </ul>
      </div>
    </div>
    <BaseEmpty v-else title="请先选择主机" description="从左侧主机列表选择一台主机后查看详情。" />
  </PanelCard>
</template>

<style scoped>
.detail-shell {
  display: grid;
  gap: var(--space-5);
}

.detail-top {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.detail-top h3 {
  margin: 0;
}

.detail-top p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  margin: 0;
}

.detail-grid div,
.snapshot-item {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--sys-color-surface-panel);
  border: 1px solid var(--sys-color-border-secondary);
}

.detail-grid dt,
.snapshot-item span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.detail-grid dd,
.snapshot-item strong {
  margin: var(--space-2) 0 0;
  display: block;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.bindings-block ul {
  margin: var(--space-3) 0 0;
  padding-left: var(--space-6);
  color: var(--sys-color-text-secondary);
}

@media (max-width: 1280px) {
  .detail-grid,
  .snapshot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .detail-top,
  .detail-grid,
  .snapshot-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
