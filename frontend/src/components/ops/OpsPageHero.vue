<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import type { OpsOverviewDto } from '@/types/ops';
import { formatDateTime, formatRelativeTime } from '@/utils/opsFormatters';
import { computed } from 'vue';

const props = defineProps<{
  overview: OpsOverviewDto | null;
  refreshing?: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const generatedAt = computed(() => formatDateTime(props.overview?.generatedAt));
const freshness = computed(() => formatRelativeTime(props.overview?.generatedAt));
</script>

<template>
  <section class="ops-hero glass-card">
    <div>
      <div class="hero-eyebrow">运维态势 · 多源接入</div>
      <h1>基础设施健康态势</h1>
      <p>
        统一汇聚 Probe、外部系统与手工注入数据，面向 1–20 台 Linux ARM 服务器提供主机健康、资源趋势、重点进程与告警态势。
      </p>
      <div class="hero-tags">
        <span class="tag">最近生成：{{ generatedAt }}</span>
        <span class="tag">刷新感知：{{ freshness }}</span>
      </div>
    </div>

    <div class="hero-actions">
      <div class="hero-status">
        <strong>{{ props.overview?.sourceCount ?? 0 }}</strong>
        <span>已接入来源</span>
      </div>
      <BaseButton variant="secondary" :disabled="refreshing" @click="emit('refresh')">
        {{ refreshing ? '刷新中…' : '刷新态势' }}
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.ops-hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-8);
  padding: var(--space-8);
  margin-bottom: var(--space-7);
}

.hero-eyebrow {
  color: var(--sys-color-brand-secondary);
  letter-spacing: var(--letter-spacing-wide);
  font-size: var(--font-size-12);
  text-transform: uppercase;
  margin-bottom: var(--space-3);
}

.ops-hero h1 {
  margin: 0;
  font-size: 34px;
}

.ops-hero p {
  margin: var(--space-5) 0;
  max-width: 860px;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hero-actions {
  min-width: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-6);
}

.hero-status {
  display: grid;
  gap: var(--space-2);
  justify-items: end;
}

.hero-status strong {
  font-size: var(--font-size-32);
}

.hero-status span {
  color: var(--sys-color-text-secondary);
}

@media (max-width: 960px) {
  .ops-hero {
    flex-direction: column;
  }

  .hero-actions,
  .hero-status {
    align-items: flex-start;
    justify-items: start;
  }
}
</style>
