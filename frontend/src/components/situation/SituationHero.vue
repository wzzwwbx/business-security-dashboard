<template>
  <section class="situation-hero glass-card">
    <div class="hero-main">
      <div class="hero-leading">
        <span class="hero-icon" :class="page.code" aria-hidden="true">
          <BaseIcon :name="iconName" />
        </span>
        <div>
          <h1 class="hero-title">{{ page.title }}</h1>
        </div>
      </div>

      <div v-if="page.heroTags.length" class="hero-tags" aria-label="页面态势标签">
        <div v-for="tag in page.heroTags.slice(0, 4)" :key="`${tag.label}-${tag.value}`" class="hero-tag" :class="tag.tone ?? 'info'">
          <span>{{ tag.label }}</span>
          <strong>{{ tag.value }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import type { SituationPage } from '@/types/situation';
import { computed } from 'vue';

const props = defineProps<{
  page: SituationPage;
}>();

const iconName = computed(() => props.page.code === 'overview' ? 'overview' : props.page.code);
</script>

<style scoped>
.situation-hero {
  min-height: var(--layout-hero-height);
  padding: 12px 16px;
  clip-path: polygon(0 18px, 18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px));
}

.hero-main {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-leading {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  font-size: 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 198, 82, 0.24), rgba(45, 226, 230, 0.12));
  color: #ffd96a;
  box-shadow: inset 0 0 20px rgba(255, 217, 106, 0.08), 0 0 18px rgba(49, 219, 255, 0.12);
}

.hero-title {
  margin: 0;
  font-size: clamp(22px, 2vw, 30px);
  color: #4df4ff;
  letter-spacing: 0.04em;
  text-shadow: 0 0 18px rgba(77, 244, 255, 0.18);
}

.hero-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hero-tag {
  min-width: 92px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(80, 228, 255, 0.26);
  background: linear-gradient(180deg, rgba(9, 37, 60, 0.88), rgba(6, 22, 40, 0.84));
  display: grid;
  gap: 4px;
}

.hero-tag span {
  color: #7ddff5;
  font-size: var(--font-size-12);
}

.hero-tag strong {
  font-size: var(--font-size-15);
  color: #effcff;
}

.hero-tag.success {
  border-color: var(--sys-color-status-success-border);
}

.hero-tag.warning {
  border-color: var(--sys-color-status-warning-border);
}

.hero-tag.danger {
  border-color: var(--sys-color-status-danger-border);
}

.hero-tag.info {
  border-color: var(--sys-color-status-info-border);
}

@media (max-width: 1280px) {
  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-tags {
    justify-content: flex-start;
  }
}
</style>
