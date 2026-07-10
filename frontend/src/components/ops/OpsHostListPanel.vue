<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import type { OpsHostSummaryDto } from '@/types/ops';
import { formatPercent, formatRelativeTime, statusLabel, statusTone } from '@/utils/opsFormatters';

const props = defineProps<{
  hosts: OpsHostSummaryDto[];
  selectedHostId: number | null;
}>();

const emit = defineEmits<{
  select: [hostId: number];
}>();
</script>

<template>
  <PanelCard title="主机列表" :tags="['真实快照', '1-20 台规模']" :min-height="360">
    <div v-if="props.hosts.length" class="host-list">
      <button
        v-for="host in props.hosts"
        :key="host.id"
        class="host-row"
        :class="{ active: host.id === props.selectedHostId }"
        type="button"
        @click="emit('select', host.id)"
      >
        <div class="host-title-row">
          <div>
            <strong>{{ host.displayName || host.hostname }}</strong>
            <p>{{ host.primaryIp }} · {{ host.sourceSystem }}</p>
          </div>
          <span class="badge" :class="statusTone(host.status)">{{ statusLabel(host.status) }}</span>
        </div>
        <div class="host-metrics">
          <span>处理器 {{ formatPercent(host.cpuUsagePct) }}</span>
          <span>内存 {{ formatPercent(host.memoryUsagePct) }}</span>
          <span>Load {{ host.load1.toFixed(2) }}</span>
          <span>告警 {{ host.openAlertCount }}</span>
        </div>
        <div class="host-foot">
          <span class="tag">{{ statusLabel(host.sourceType) }}</span>
          <span>最近：{{ formatRelativeTime(host.lastObservedAt) }}</span>
        </div>
      </button>
    </div>
    <BaseEmpty v-else title="暂无主机" description="当前未获取到主机清单，请稍后刷新查看。" />
  </PanelCard>
</template>

<style scoped>
.host-list {
  display: grid;
  gap: var(--space-4);
}

.host-row {
  width: 100%;
  text-align: left;
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
  color: inherit;
  cursor: pointer;
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard);
}

.host-row:hover,
.host-row.active {
  transform: translateY(-1px);
  border-color: var(--sys-color-border-strong);
  background: var(--sys-color-brand-primary-weak);
}

.host-title-row,
.host-foot,
.host-metrics {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.host-title-row p,
.host-foot {
  color: var(--sys-color-text-secondary);
}

.host-title-row p {
  margin: var(--space-2) 0 0;
}

.host-metrics {
  margin: var(--space-4) 0;
}
</style>
