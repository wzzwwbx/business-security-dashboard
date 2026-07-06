<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="index">
          <td v-for="column in columns" :key="column.key">
            <span v-if="column.type === 'status'" class="status-chip" :class="String(row[column.key])">
              {{ row[column.key] }}
            </span>
            <span v-else>{{ row[column.key] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string;
  label: string;
  type?: string;
}

defineProps<{
  columns: Column[];
  rows: Record<string, string | number>[];
}>();
</script>

<style scoped>
.table-wrap {
  overflow: auto;
  height: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-14);
}

th,
td {
  padding: var(--space-4) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--sys-color-border-table);
  white-space: nowrap;
}

th {
  color: var(--sys-color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.status-chip {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
}

.status-chip.成功,
.status-chip.正常,
.status-chip.已执行,
.status-chip.已恢复 {
  background: var(--sys-color-status-success-bg);
  color: var(--sys-color-status-success-text);
}

.status-chip.处理中,
.status-chip.待确认,
.status-chip.执行中 {
  background: var(--sys-color-status-warning-bg);
  color: var(--sys-color-status-warning-text);
}

.status-chip.失败,
.status-chip.高风险,
.status-chip.告警,
.status-chip.已拒绝 {
  background: var(--sys-color-status-danger-bg);
  color: var(--sys-color-status-danger-text);
}
</style>
