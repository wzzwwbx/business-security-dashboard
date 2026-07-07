<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import SituationHero from '@/components/situation/SituationHero.vue';
import SituationHighlights from '@/components/situation/SituationHighlights.vue';
import SituationInsightPanel from '@/components/situation/SituationInsightPanel.vue';
import SituationKpiGrid from '@/components/situation/SituationKpiGrid.vue';
import SituationSectionRenderer from '@/components/situation/SituationSectionRenderer.vue';
import SituationToolbar from '@/components/situation/SituationToolbar.vue';
import { useSituationPage } from '@/composables/useSituationPage';
import type { SituationPageCode } from '@/types/situation';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageCode = computed<SituationPageCode>(() => {
  const candidate = String(route.meta.pageCode ?? 'overview');
  return candidate === 'security' || candidate === 'business' || candidate === 'terminal' ? candidate : 'overview';
});

const {
  page,
  loading,
  errorDescription,
  warningMessage,
  resolvedSource,
  filters,
  activeFilter,
  visibleSections,
  hasFilterResult,
  filterSummary,
  selectedInsight,
  selectFilter,
  selectInsight,
  clearInsight,
  loadPage
} = useSituationPage(pageCode);

const defaultFilterKey = computed(() => filters.value[0]?.key ?? 'all');
</script>

<template>
  <div v-if="loading" class="situation-page" aria-busy="true">
    <section class="glass-card skeleton-hero">
      <BaseSkeleton width="160px" height="14px" />
      <BaseSkeleton width="360px" height="38px" />
      <BaseSkeleton width="100%" height="18px" />
      <div class="skeleton-chip-row">
        <BaseSkeleton v-for="item in 4" :key="item" width="100%" height="90px" />
      </div>
    </section>

    <section class="skeleton-kpi-grid">
      <article v-for="item in 6" :key="item" class="glass-card skeleton-kpi-card">
        <BaseSkeleton width="90px" height="14px" />
        <BaseSkeleton width="120px" height="34px" />
        <BaseSkeleton width="80%" height="14px" />
      </article>
    </section>

    <section class="skeleton-highlights-grid">
      <article v-for="item in 4" :key="item" class="glass-card skeleton-highlight-card">
        <BaseSkeleton width="100%" height="18px" />
        <BaseSkeleton width="72%" height="16px" />
        <BaseSkeleton width="48%" height="14px" />
      </article>
    </section>

    <section class="page-grid">
      <div v-for="item in 4" :key="item" class="grid-item" :style="{ gridColumn: 'span 6' }">
        <article class="glass-card skeleton-panel-card">
          <BaseSkeleton width="160px" height="18px" />
          <BaseSkeleton width="100%" height="260px" />
        </article>
      </div>
    </section>
  </div>

  <div v-else-if="page" class="situation-page">
    <SituationHero :page="page" />
    <SituationToolbar
      title="数据状态与视图过滤"
      :summary="filterSummary"
      :filters="filters"
      :active-filter="activeFilter"
      :resolved-source="resolvedSource"
      :warning-message="warningMessage"
      :selected-insight-title="selectedInsight?.title"
      @select-filter="selectFilter"
      @refresh="loadPage"
      @clear-focus="clearInsight"
    />
    <SituationKpiGrid :items="page.kpis" @select-insight="selectInsight" />
    <SituationHighlights :items="page.highlights" @select-insight="selectInsight" />

    <SituationInsightPanel v-if="selectedInsight" :insight="selectedInsight" @close="clearInsight" />

    <section v-if="hasFilterResult" class="page-grid">
      <div
        v-for="section in visibleSections"
        :key="section.code"
        class="grid-item"
        :style="{ gridColumn: `span ${section.colSpan}` }"
      >
        <SituationSectionRenderer :section="section" @select-insight="selectInsight" />
      </div>
    </section>

    <section v-else class="glass-card filter-empty-state" aria-live="polite">
      <div>
        <strong>当前过滤条件下暂无板块</strong>
        <p>可以切换到“全部板块”，或选择其他标签查看当前主题态势的更多内容。</p>
      </div>
      <BaseButton variant="secondary" @click="selectFilter(defaultFilterKey)">查看全部板块</BaseButton>
    </section>
  </div>

  <BaseEmpty v-else title="态势页面加载失败" :description="errorDescription">
    <BaseButton class="retry-button" variant="secondary" @click="loadPage">重新加载</BaseButton>
  </BaseEmpty>
</template>

<style scoped>
.situation-page {
  min-width: 0;
}

.skeleton-hero,
.skeleton-panel-card {
  padding: var(--space-8);
}

.skeleton-hero {
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-7);
}

.skeleton-chip-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.skeleton-kpi-grid,
.skeleton-highlights-grid {
  display: grid;
  gap: var(--layout-grid-gap);
  margin-bottom: var(--space-7);
}

.skeleton-kpi-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.skeleton-highlights-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.skeleton-kpi-card,
.skeleton-highlight-card,
.skeleton-panel-card {
  display: grid;
  gap: var(--space-4);
}

.filter-empty-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  padding: var(--space-7);
  border: 1px dashed var(--sys-color-border-primary);
}

.filter-empty-state strong {
  display: inline-block;
  margin-bottom: var(--space-2);
}

.filter-empty-state p {
  margin: 0;
  color: var(--sys-color-text-secondary);
}

.retry-button {
  margin-top: var(--space-4);
}

@media (max-width: 1440px) {
  .skeleton-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .filter-empty-state {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 960px) {
  .skeleton-chip-row,
  .skeleton-kpi-grid,
  .skeleton-highlights-grid {
    grid-template-columns: 1fr;
  }
}
</style>
