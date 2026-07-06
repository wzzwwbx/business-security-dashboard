<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import type { OpsProcessDto } from '@/types/ops';
import { formatBytes, formatPercent, formatRelativeTime } from '@/utils/opsFormatters';

defineProps<{
  processes: OpsProcessDto[];
}>();
</script>

<template>
  <PanelCard title="TopN 进程与白名单服务" :tags="['Top 10 + 白名单', 'Linux ARM']" :min-height="360">
    <div v-if="processes.length" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>进程</th>
            <th>PID</th>
            <th>CPU</th>
            <th>RSS</th>
            <th>状态</th>
            <th>类别</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="process in processes" :key="`${process.pid}-${process.observedAt}`">
            <td>
              <strong>{{ process.processName }}</strong>
              <p>{{ process.commandLine || '-' }}</p>
            </td>
            <td>{{ process.pid }}</td>
            <td>{{ formatPercent(process.cpuUsagePct) }}</td>
            <td>{{ formatBytes(process.memoryRssBytes) }}</td>
            <td>{{ process.state }}</td>
            <td>
              <span class="tag">{{ process.whitelisted ? '白名单' : 'TopN' }}</span>
            </td>
            <td>{{ formatRelativeTime(process.observedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <BaseEmpty v-else title="暂无进程快照" description="等待主机上报 TopN 进程与白名单服务数据。" />
  </PanelCard>
</template>

<style scoped>
.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: var(--space-4);
  border-bottom: 1px solid var(--sys-color-border-table);
  vertical-align: top;
}

td p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  max-width: 280px;
  word-break: break-all;
}
</style>
