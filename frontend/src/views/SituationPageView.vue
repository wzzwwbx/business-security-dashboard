<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import DetailDrawerShell from '@/components/common/DetailDrawerShell.vue';
import SituationHero from '@/components/situation/SituationHero.vue';
import SituationKpiGrid from '@/components/situation/SituationKpiGrid.vue';
import SituationSectionRenderer from '@/components/situation/SituationSectionRenderer.vue';
import SituationToolbar from '@/components/situation/SituationToolbar.vue';
import { useSituationPage } from '@/composables/useSituationPage';
import type { SituationInsight, SituationPageCode, SituationSection } from '@/types/situation';
import type { VisualAssetNode } from '@/types/visualization';
import { computed, ref, watch } from 'vue';
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

const selectedNode = ref<VisualAssetNode | null>(null);

watch([pageCode, activeFilter], () => {
  selectedNode.value = null;
  clearInsight();
});

const sceneKinds = new Set(['scene', 'relationMap', 'assetCluster']);

const primarySection = computed(() => visibleSections.value.find((section) => sceneKinds.has(section.kind)) ?? visibleSections.value[0] ?? null);

const supportSections = computed(() => visibleSections.value.filter((section) => section.code !== primarySection.value?.code));

function pickSections(predicate: (section: SituationSection) => boolean) {
  const matched = supportSections.value.filter(predicate);
  if (matched.length) {
    return matched;
  }

  return [];
}

const leftSections = computed(() => {
  const tagged = pickSections((section) => (section.tags ?? []).includes('左侧'));
  if (tagged.length) {
    return tagged;
  }

  return supportSections.value.filter((_, index) => index % 2 === 0).slice(0, 3);
});

const rightSections = computed(() => {
  const tagged = pickSections((section) => (section.tags ?? []).includes('右侧'));
  if (tagged.length) {
    return tagged;
  }

  return supportSections.value.filter((_, index) => index % 2 === 1).slice(0, 3);
});

const drawerOpen = computed(() => Boolean(selectedNode.value || selectedInsight.value));
const drawerTitle = computed(() => selectedNode.value?.name ?? selectedInsight.value?.title ?? '详情');
const drawerSubtitle = computed(() => selectedNode.value ? '节点下钻' : selectedInsight.value?.label ?? '态势洞察');
const drawerBadges = computed(() => selectedNode.value?.badges ?? []);

const defaultFilterKey = computed(() => filters.value[0]?.key ?? 'all');

function handleSelectNode(node: VisualAssetNode) {
  selectedNode.value = node;
  clearInsight();
}

function handleSelectInsight(insight: SituationInsight) {
  selectedNode.value = null;
  selectInsight(insight);
}

function closeDrawer() {
  selectedNode.value = null;
  clearInsight();
}
</script>

<template>
  <div v-if="loading" class="screen-page" aria-busy="true">
    <section class="glass-card skeleton-hero">
      <BaseSkeleton width="180px" height="14px" />
      <BaseSkeleton width="320px" height="30px" />
      <BaseSkeleton width="100%" height="16px" />
    </section>
    <section class="glass-card skeleton-toolbar">
      <BaseSkeleton width="220px" height="16px" />
      <BaseSkeleton width="100%" height="40px" />
    </section>
    <section class="screen-kpi-row">
      <article v-for="item in 6" :key="item" class="glass-card skeleton-kpi-card">
        <BaseSkeleton width="96px" height="14px" />
        <BaseSkeleton width="120px" height="26px" />
        <BaseSkeleton width="100%" height="14px" />
      </article>
    </section>
    <section class="screen-workbench">
      <article class="glass-card skeleton-side-card"><BaseSkeleton width="100%" height="100%" /></article>
      <article class="glass-card skeleton-center-card"><BaseSkeleton width="100%" height="100%" /></article>
      <article class="glass-card skeleton-side-card"><BaseSkeleton width="100%" height="100%" /></article>
    </section>
  </div>

  <div v-else-if="page" class="screen-page">
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
    <SituationKpiGrid :items="page.kpis" @select-insight="handleSelectInsight" />

    <section v-if="hasFilterResult" class="screen-workbench">
      <aside class="screen-support-column">
        <button
          v-for="item in page.highlights.slice(0, 2)"
          :key="item.title"
          type="button"
          class="highlight-card glass-card"
          :class="item.tone"
          @click="handleSelectInsight({
            id: `highlight-${item.title}`,
            label: '重点提示',
            title: item.title,
            description: item.description,
            tone: item.tone,
            metric: item.metric,
            meta: item.meta
          })"
        >
          <div class="highlight-top">
            <strong>{{ item.title }}</strong>
            <span class="badge" :class="item.tone">{{ item.metric }}</span>
          </div>
          <p>{{ item.description }}</p>
          <small>{{ item.meta }}</small>
        </button>

        <SituationSectionRenderer
          v-for="section in leftSections"
          :key="section.code"
          :section="section"
          @select-insight="handleSelectInsight"
          @select-node="handleSelectNode"
        />
      </aside>

      <main class="screen-center-column">
        <SituationSectionRenderer
          v-if="primarySection"
          :section="primarySection"
          @select-insight="handleSelectInsight"
          @select-node="handleSelectNode"
        />
        <div v-else class="glass-card screen-empty-state">
          <BaseEmpty title="暂无主视觉板块" description="当前过滤条件下未命中主视觉内容，请切换标签查看。" />
        </div>
      </main>

      <aside class="screen-support-column">
        <SituationSectionRenderer
          v-for="section in rightSections"
          :key="section.code"
          :section="section"
          @select-insight="handleSelectInsight"
          @select-node="handleSelectNode"
        />
      </aside>
    </section>

    <section v-else class="glass-card filter-empty-state" aria-live="polite">
      <div>
        <strong>当前过滤条件下暂无板块</strong>
        <p>可以切换到“全部板块”，或选择其他标签查看当前主题的更多内容。</p>
      </div>
      <BaseButton variant="secondary" @click="selectFilter(defaultFilterKey)">查看全部板块</BaseButton>
    </section>

    <DetailDrawerShell
      :open="drawerOpen"
      :title="drawerTitle"
      :subtitle="drawerSubtitle"
      :badges="drawerBadges"
      @close="closeDrawer"
    >
      <template v-if="selectedNode">
        <section class="drawer-section-stack">
          <article class="drawer-intro-card">
            <strong>{{ selectedNode.description || '可继续结合左右支撑面板查看该节点上下文。' }}</strong>
            <p>点击主视觉、支撑面板和关键指标，可在统一详情抽屉内完成下钻浏览。</p>
          </article>

          <div v-if="selectedNode.metrics?.length" class="drawer-fact-grid">
            <article v-for="metric in selectedNode.metrics" :key="metric.label" class="drawer-fact-card">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </article>
          </div>

          <div v-if="selectedNode.children?.length" class="drawer-related-list">
            <strong>关联子节点</strong>
            <button v-for="child in selectedNode.children" :key="child.id" type="button" class="drawer-related-item" @click="handleSelectNode(child)">
              <span>{{ child.name }}</span>
              <small>{{ child.description || '点击继续下钻' }}</small>
            </button>
          </div>
        </section>
      </template>

      <template v-else-if="selectedInsight">
        <section class="drawer-section-stack">
          <article class="drawer-intro-card">
            <strong>{{ selectedInsight.description }}</strong>
            <p>{{ selectedInsight.meta || '该洞察来源于当前页面的关键板块。' }}</p>
          </article>
          <div v-if="selectedInsight.metric" class="drawer-fact-grid">
            <article class="drawer-fact-card">
              <span>关键数值</span>
              <strong>{{ selectedInsight.metric }}</strong>
            </article>
          </div>
          <div v-if="selectedInsight.sourceSectionTitle" class="drawer-related-list">
            <strong>来源板块</strong>
            <div class="drawer-related-item static">
              <span>{{ selectedInsight.sourceSectionTitle }}</span>
              <small>{{ selectedInsight.sourceSectionCode }}</small>
            </div>
          </div>
        </section>
      </template>
    </DetailDrawerShell>
  </div>

  <BaseEmpty v-else title="态势页面加载失败" :description="errorDescription">
    <BaseButton class="retry-button" variant="secondary" @click="loadPage">重新加载</BaseButton>
  </BaseEmpty>
</template>

<style scoped>
.screen-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.screen-kpi-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--layout-card-gap);
}

.screen-workbench {
  display: grid;
  grid-template-columns: minmax(250px, 0.9fr) minmax(0, 1.45fr) minmax(250px, 0.9fr);
  gap: var(--layout-card-gap);
  align-items: start;
}

.screen-support-column,
.screen-center-column {
  display: grid;
  gap: var(--space-3);
}

.skeleton-hero,
.skeleton-toolbar,
.skeleton-kpi-card,
.skeleton-side-card,
.skeleton-center-card,
.highlight-card,
.filter-empty-state,
.screen-empty-state {
  padding: 14px;
}

.skeleton-hero,
.skeleton-toolbar,
.skeleton-kpi-card {
  display: grid;
  gap: 10px;
}

.skeleton-side-card,
.skeleton-center-card {
  min-height: 0;
}

.highlight-card {
  display: grid;
  gap: 6px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 35, 0.72);
  text-align: left;
  cursor: pointer;
}

.highlight-card p,
.highlight-card small {
  margin: 0;
  color: var(--sys-color-text-secondary);
}

.highlight-card.success {
  border-color: var(--sys-color-status-success-border);
}

.highlight-card.warning {
  border-color: var(--sys-color-status-warning-border);
}

.highlight-card.danger {
  border-color: var(--sys-color-status-danger-border);
}

.highlight-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.filter-empty-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.filter-empty-state p {
  margin: 8px 0 0;
  color: var(--sys-color-text-secondary);
}

.drawer-section-stack {
  display: grid;
  gap: 14px;
}

.drawer-intro-card {
  padding: 14px;
  border-radius: 16px;
  background: rgba(10, 20, 36, 0.74);
  border: 1px solid var(--sys-color-border-secondary);
}

.drawer-intro-card p {
  margin: 8px 0 0;
  color: var(--sys-color-text-secondary);
}

.drawer-fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.drawer-fact-card {
  padding: 12px;
  border-radius: 14px;
  background: rgba(12, 28, 48, 0.72);
  border: 1px solid var(--sys-color-border-secondary);
  display: grid;
  gap: 6px;
}

.drawer-fact-card span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.drawer-related-list {
  display: grid;
  gap: 10px;
}

.drawer-related-list strong {
  font-size: var(--font-size-14);
}

.drawer-related-item {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--sys-color-border-secondary);
  background: rgba(10, 20, 36, 0.72);
  display: grid;
  gap: 4px;
  text-align: left;
  color: inherit;
}

.drawer-related-item.static {
  cursor: default;
}

.drawer-related-item small {
  color: var(--sys-color-text-secondary);
}

@media (max-width: 1280px) {
  .screen-kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .screen-workbench {
    grid-template-columns: 1fr;
  }

  .filter-empty-state {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .screen-kpi-row {
    grid-template-columns: 1fr;
  }

  .drawer-fact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
