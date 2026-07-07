<template>
  <section class="insight-panel glass-card" :class="insight.tone" aria-label="当前聚焦信号">
    <div class="insight-header">
      <div>
        <div class="insight-label-row">
          <span class="insight-label">{{ insight.label }}</span>
          <span v-if="insight.sourceSectionTitle" class="tag">{{ insight.sourceSectionTitle }}</span>
        </div>
        <h2>{{ insight.title }}</h2>
      </div>

      <button type="button" class="close-button" aria-label="关闭聚焦详情" @click="emit('close')">
        ×
      </button>
    </div>

    <div class="insight-grid">
      <div class="insight-main">
        <p>{{ insight.description }}</p>
      </div>
      <div class="insight-side">
        <div v-if="insight.metric" class="insight-stat">
          <span>关键指标</span>
          <strong>{{ insight.metric }}</strong>
        </div>
        <div v-if="insight.meta" class="insight-stat">
          <span>补充信息</span>
          <strong>{{ insight.meta }}</strong>
        </div>
        <div class="insight-stat">
          <span>建议动作</span>
          <strong>{{ actionSuggestion }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SituationInsight } from '@/types/situation';
import { computed } from 'vue';

const props = defineProps<{
  insight: SituationInsight;
}>();

const emit = defineEmits<{
  close: [];
}>();

const actionSuggestion = computed(() => {
  switch (props.insight.tone) {
    case 'danger':
      return '优先升级并触发跨团队联动';
    case 'warning':
      return '纳入本轮值班重点关注';
    case 'success':
      return '保持观察并沉淀可复用经验';
    default:
      return '继续补齐上下文与数据来源';
  }
});
</script>

<style scoped>
.insight-panel {
  padding: var(--space-7);
  margin-bottom: var(--space-7);
  border: 1px solid var(--sys-color-border-secondary);
}

.insight-panel.success {
  border-color: var(--sys-color-status-success-border);
}

.insight-panel.warning {
  border-color: var(--sys-color-status-warning-border);
}

.insight-panel.danger {
  border-color: var(--sys-color-status-danger-border);
}

.insight-panel.info {
  border-color: var(--sys-color-status-info-border);
}

.insight-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-5);
}

.insight-label-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.insight-label {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--sys-color-brand-secondary-tint);
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
}

.insight-header h2 {
  margin: 0;
  font-size: clamp(20px, 2vw, 24px);
}

.close-button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--sys-color-border-primary);
  border-radius: 50%;
  background: transparent;
  color: var(--sys-color-text-secondary);
  cursor: pointer;
}

.insight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
  gap: var(--space-6);
  margin-top: var(--space-5);
}

.insight-main p {
  margin: 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.insight-side {
  display: grid;
  gap: var(--space-4);
}

.insight-stat {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  border: 1px solid var(--sys-color-border-secondary);
}

.insight-stat span {
  display: block;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
  margin-bottom: var(--space-2);
}

.insight-stat strong {
  font-size: var(--font-size-16);
}

@media (max-width: 960px) {
  .insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
