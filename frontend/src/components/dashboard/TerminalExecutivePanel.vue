<template>
  <section class="terminal-executive">
    <section class="terminal-hero glass-card">
      <div class="hero-main">
        <div class="hero-top">
          <span class="hero-badge">终端态势总览</span>
          <span class="hero-refresh">最近刷新：{{ lastUpdated }}</span>
        </div>
        <strong class="hero-title">境外保障终端整体在线稳定，当前重点关注离线缓存终端、链路抖动节点和密码钥匙复核情况</strong>
        <p class="hero-description">
          当前受管终端覆盖多区域保障节点，移动终端、签批终端和密码钥匙均处于统一监测范围。多数终端运行稳定，少量异常集中在链路波动区域和高频使用节点，整体保障能力保持可控。
        </p>

        <div class="hero-metrics">
          <article v-for="item in heroMetrics" :key="item.label" class="hero-metric">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </div>

      <aside class="hero-side">
        <article v-for="item in sideCards" :key="item.label" class="side-card" :class="item.tone">
          <div class="side-head">
            <span>{{ item.label }}</span>
            <i :class="item.tone"></i>
          </div>
          <strong>{{ item.value }}</strong>
          <p>{{ item.description }}</p>
        </article>
      </aside>
    </section>

    <section class="digest-grid">
      <article v-for="item in digestItems" :key="item.label" class="digest-card glass-card" :class="item.tone">
        <div class="digest-head">
          <span>{{ item.label }}</span>
          <i :class="item.tone"></i>
        </div>
        <strong>{{ item.value }}</strong>
        <p>{{ item.description }}</p>
      </article>
    </section>

    <section class="brief-grid">
      <article v-for="item in briefs" :key="item.title" class="brief-card glass-card" :class="item.tone">
        <div class="brief-head">
          <span class="brief-tag" :class="item.tone">{{ item.tag }}</span>
          <span class="brief-time">{{ item.meta }}</span>
        </div>
        <strong>{{ item.title }}</strong>
        <p>{{ item.description }}</p>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { OperationalFeedItem, SituationDigestItem } from '@/composables/useDashboardInsights';
import { computed } from 'vue';

const props = defineProps<{
  digestItems: SituationDigestItem[];
  feedItems: OperationalFeedItem[];
  lastUpdated: string;
}>();

const heroMetrics = computed(() => [
  {
    label: '在线终端',
    value: '129 台',
    description: '大部分保障终端处于持续在线状态'
  },
  {
    label: '离线缓存',
    value: '4 台',
    description: '均已启用授权缓存，待恢复后自动回传'
  },
  {
    label: '链路抖动',
    value: '2 个节点',
    description: '主要出现在卫星链路高负载时段'
  }
]);

const sideCards = computed(() => [
  {
    label: '在线率',
    value: '92.4%',
    description: '高峰时段整体保持稳定在线',
    tone: 'success' as const
  },
  {
    label: '密码钥匙',
    value: '5 项待复核',
    description: '认证失败与待复核均已进入核查流程',
    tone: 'warning' as const
  },
  {
    label: '终端健康',
    value: '总体良好',
    description: '驱动、补丁和外设限制策略覆盖完整',
    tone: 'info' as const
  }
]);

const briefs = computed(() => {
  if (props.feedItems.length >= 3) {
    return props.feedItems.slice(0, 3);
  }

  return [
    {
      tag: '链路',
      title: '境外链路整体平稳，个别卫星节点存在短时抖动',
      description: '抖动主要集中在高峰通联时段，当前已转入重点观察，未造成大面积终端掉线。',
      meta: '最近 10 分钟',
      tone: 'warning' as const
    },
    {
      tag: '认证',
      title: '密码钥匙认证成功率保持高位，待复核事项持续压降',
      description: '失败终端已完成初步排查，当前重点处理证书同步和介质识别异常。',
      meta: '最近 15 分钟',
      tone: 'info' as const
    },
    {
      tag: '保障',
      title: '离线缓存终端均处于授权模式，现场保障链路保持可用',
      description: '离线终端已具备本地业务连续能力，待网络恢复后补传运行记录和操作日志。',
      meta: '最近 20 分钟',
      tone: 'success' as const
    }
  ];
});
</script>

<style scoped>
.terminal-executive {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  margin-bottom: var(--space-7);
}

.terminal-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(320px, 0.95fr);
  gap: var(--space-6);
  padding: var(--space-7);
  background:
    radial-gradient(circle at 16% 22%, rgba(61, 220, 151, 0.13), transparent 26%),
    radial-gradient(circle at 88% 16%, rgba(33, 150, 243, 0.18), transparent 24%),
    linear-gradient(135deg, rgba(5, 18, 34, 0.98), rgba(9, 31, 51, 0.94));
}

.hero-top,
.digest-head,
.brief-head,
.side-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.hero-badge,
.hero-refresh,
.brief-tag {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: var(--font-size-12);
}

.hero-badge {
  color: var(--sys-color-brand-secondary);
  background: rgba(45, 226, 230, 0.12);
  letter-spacing: 0.14em;
}

.hero-refresh {
  color: var(--sys-color-text-secondary);
  background: rgba(255, 255, 255, 0.04);
}

.hero-title {
  display: block;
  max-width: 920px;
  margin-top: var(--space-5);
  font-size: clamp(28px, 2.5vw, 40px);
  line-height: 1.32;
}

.hero-description,
.hero-metric span,
.hero-metric p,
.side-card span,
.side-card p,
.digest-card span,
.digest-card p,
.brief-time,
.brief-card p {
  color: var(--sys-color-text-secondary);
}

.hero-description {
  max-width: 840px;
  margin: var(--space-4) 0 0;
  line-height: 1.85;
}

.hero-metrics,
.digest-grid,
.brief-grid {
  display: grid;
  gap: var(--layout-card-gap);
}

.hero-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--space-7);
}

.hero-metric,
.side-card,
.digest-card,
.brief-card {
  padding: var(--space-5);
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-xl);
  background: rgba(7, 21, 36, 0.72);
}

.hero-metric strong,
.side-card strong,
.digest-card strong {
  display: block;
  margin-top: var(--space-3);
  font-size: clamp(22px, 2vw, 30px);
}

.hero-side {
  display: grid;
  gap: var(--space-4);
}

.side-head i,
.digest-head i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.success {
  background: var(--sys-color-status-success);
}

.warning {
  background: var(--sys-color-status-warning);
}

.info {
  background: var(--sys-color-status-info);
}

.digest-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.brief-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.brief-tag {
  color: #06111f;
  font-weight: var(--font-weight-semibold);
}

.brief-card strong {
  display: block;
  margin-top: var(--space-4);
  line-height: var(--line-height-snug);
}

.hero-metric p,
.side-card p,
.digest-card p,
.brief-card p {
  margin: var(--space-2) 0 0;
  line-height: var(--line-height-relaxed);
}

@media (max-width: 1440px) {
  .terminal-hero {
    grid-template-columns: 1fr;
  }

  .digest-grid,
  .hero-metrics,
  .brief-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .hero-top,
  .digest-grid,
  .hero-metrics,
  .brief-grid {
    grid-template-columns: 1fr;
  }

  .hero-top,
  .brief-head,
  .digest-head,
  .side-head {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .terminal-hero,
  .hero-metric,
  .side-card,
  .digest-card,
  .brief-card {
    padding: var(--space-5);
  }
}
</style>
