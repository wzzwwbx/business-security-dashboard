<template>
  <PanelCard :title="section.title" :tags="section.tags" :min-height="section.minHeight ?? 320">
    <template #extra>
      <span v-if="section.description" class="panel-description">{{ section.description }}</span>
    </template>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th v-for="column in section.columns" :key="column.key">{{ column.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in section.rows"
            :key="rowIndex"
            class="interactive-row"
            tabindex="0"
            role="button"
            @click="handleSelect(row, rowIndex)"
            @keydown.enter.prevent="handleSelect(row, rowIndex)"
            @keydown.space.prevent="handleSelect(row, rowIndex)"
          >
            <td v-for="column in section.columns" :key="column.key">
              <span v-if="column.tone" class="table-pill" :class="row.tones?.[column.key] ?? 'info'">
                {{ row.cells[column.key] }}
              </span>
              <span v-else>{{ row.cells[column.key] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/components/common/PanelCard.vue';
import type { SituationInsight, SituationTableRow, SituationTableSection } from '@/types/situation';

const props = defineProps<{
  section: SituationTableSection;
}>();

const emit = defineEmits<{
  selectInsight: [insight: SituationInsight];
}>();

const handleSelect = (row: SituationTableRow, rowIndex: number) => {
  const values = props.section.columns
    .map((column) => row.cells[column.key])
    .filter((value): value is string => Boolean(value));

  emit('selectInsight', {
    id: `${props.section.code}-row-${rowIndex}`,
    label: '观察记录',
    title: values[1] ?? values[0] ?? `记录 ${rowIndex + 1}`,
    description: values.join(' · '),
    tone: row.tones?.status ?? row.tones?.level ?? 'info',
    meta: props.section.title,
    sourceSectionCode: props.section.code,
    sourceSectionTitle: props.section.title
  });
};
</script>

<style scoped>
.panel-description {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.table-shell {
  overflow-x: auto;
}

.table-shell table {
  width: 100%;
  border-collapse: collapse;
}

.table-shell th,
.table-shell td {
  padding: var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--sys-color-border-table);
  text-align: left;
  font-size: var(--font-size-13);
}

.table-shell th {
  color: var(--sys-color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.interactive-row {
  cursor: pointer;
  transition: background var(--motion-duration-fast) var(--motion-ease-standard);
}

.interactive-row:hover,
.interactive-row:focus-visible {
  background: rgba(30, 136, 255, 0.08);
  outline: none;
}

.table-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.table-pill.success {
  background: var(--sys-color-status-success-bg);
  color: var(--sys-color-status-success-text);
}

.table-pill.warning {
  background: var(--sys-color-status-warning-bg);
  color: var(--sys-color-status-warning-text);
}

.table-pill.danger {
  background: var(--sys-color-status-danger-bg);
  color: var(--sys-color-status-danger-text);
}

.table-pill.info {
  background: var(--sys-color-status-info-bg);
  color: var(--sys-color-status-info-text);
}
</style>
