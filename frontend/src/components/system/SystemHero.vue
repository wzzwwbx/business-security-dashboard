<script setup lang="ts">
import type { IamAvailability, CurrentUserDto } from '@/types/iam';
import { computed } from 'vue';

const props = defineProps<{
  availability: IamAvailability;
  currentUser: CurrentUserDto | null;
  sessionMessage: string;
  pendingApprovalCount: number;
  accountCount: number;
}>();

const modeTone = computed(() => {
  if (props.availability === 'enabled') {
    return 'info';
  }

  if (props.availability === 'demo') {
    return 'success';
  }

  return 'warning';
});

const modeLabel = computed(() => {
  if (props.availability === 'enabled') {
    return '账户治理已启用';
  }

  if (props.availability === 'demo') {
    return '当前为预览数据';
  }

  return '初始化中';
});
</script>

<template>
  <section class="hero glass-card">
    <div class="hero-copy">
      <div class="eyebrow">账户与权限治理</div>
      <h1>系统账户与权限治理</h1>
      <p>
        面向系统管理员、安全管理员、审计管理员实现职责分离、关键操作审批与审计留痕，支持账户初始化、权限查看、审批流与日志核查。
      </p>
      <div class="tag-row">
        <span class="tag">当前模式：{{ modeLabel }}</span>
        <span class="tag">账户总数：{{ accountCount }}</span>
        <span class="tag">待审审批：{{ pendingApprovalCount }}</span>
      </div>
    </div>

    <div class="hero-side">
      <article class="hero-card" :class="modeTone">
        <strong>当前操作者</strong>
        <div class="hero-value">{{ currentUser?.displayName ?? '未登录' }}</div>
        <p>{{ currentUser?.roleNames?.join(' / ') || '请先完成初始化并登录。' }}</p>
      </article>
      <article class="hero-card subtle">
        <strong>安全提示</strong>
        <div class="hero-value">双人复核</div>
        <p>{{ sessionMessage || '账号禁用、启用、口令重置和角色调整默认进入审批链。' }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: var(--space-8);
  padding: var(--space-10);
  margin-bottom: var(--space-7);
}

.eyebrow {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-13);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: var(--space-3) 0 var(--space-4);
  font-size: clamp(28px, 2.6vw, 38px);
  line-height: 1.2;
}

.hero-copy p {
  margin: 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.hero-side {
  display: grid;
  gap: var(--space-4);
}

.hero-card {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
}

.hero-card.info {
  border-color: var(--sys-color-status-info-border);
  background: var(--sys-color-status-info-bg);
}

.hero-card.success {
  border-color: var(--sys-color-status-success-border);
  background: var(--sys-color-status-success-bg);
}

.hero-card.warning {
  border-color: var(--sys-color-status-warning-border);
  background: var(--sys-color-status-warning-bg);
}

.hero-card.subtle {
  background: var(--sys-color-surface-muted);
}

.hero-card strong {
  display: block;
  font-size: var(--font-size-13);
}

.hero-value {
  margin-top: var(--space-3);
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
}

.hero-card p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

@media (max-width: 1180px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
