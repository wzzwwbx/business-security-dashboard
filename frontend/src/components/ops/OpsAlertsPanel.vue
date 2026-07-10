<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import type { OpsAlertDto } from '@/types/ops';
import { formatDateTime, statusLabel, statusTone } from '@/utils/opsFormatters';

defineProps<{
  alerts: OpsAlertDto[];
}>();
</script>

<template>
  <PanelCard title="最新告警" :tags="['阈值告警', '按主机聚合']" :min-height="360">
    <div v-if="alerts.length" class="alert-list">
      <article v-for="alert in alerts" :key="alert.id" class="alert-item">
        <div class="alert-head">
          <strong>{{ alert.title }}</strong>
          <div class="alert-badges">
            <span class="badge" :class="statusTone(alert.severity)">{{ statusLabel(alert.severity) }}</span>
            <span class="badge" :class="statusTone(alert.status)">{{ statusLabel(alert.status) }}</span>
          </div>
        </div>
        <p>{{ alert.hostName }} · {{ alert.primaryIp }}</p>
        <p>{{ alert.detail }}</p>
        <div class="alert-meta">
          <span>首次：{{ formatDateTime(alert.firstSeenAt) }}</span>
          <span>最近：{{ formatDateTime(alert.lastSeenAt) }}</span>
        </div>
      </article>
    </div>
    <BaseEmpty v-else title="暂无告警" description="当前主机未触发处理器 / 内存 / 磁盘阈值告警。" />
  </PanelCard>
</template>

<style scoped>
.alert-list {
  display: grid;
  gap: var(--space-4);
}

.alert-item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
}

.alert-head,
.alert-meta,
.alert-badges {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.alert-item p {
  margin: var(--space-3) 0 0;
  color: var(--sys-color-text-secondary);
}

.alert-meta {
  margin-top: var(--space-4);
  font-size: var(--font-size-12);
}
</style>
