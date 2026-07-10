import { fetchSituationPage, getSituationDataSource } from '@/api/situations';
import { SITUATION_PAGE_META } from '@/config/situationPageMeta';
import type {
  SituationFilterChip,
  SituationInsight,
  SituationPage,
  SituationPageCode,
  SituationSection
} from '@/types/situation';
import { computed, shallowRef, watch, type Ref } from 'vue';

const allFilterKey = 'all';

function collectFilters(page: SituationPage | null): SituationFilterChip[] {
  if (!page) {
    return [{ key: allFilterKey, label: '全部板块', count: 0 }];
  }

  const counts = new Map<string, number>();
  page.sections.forEach((section) => {
    (section.tags ?? []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  const dynamicFilters = Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'))
    .map(([label, count]) => ({ key: label, label, count }));

  return [{ key: allFilterKey, label: '全部板块', count: page.sections.length }, ...dynamicFilters];
}

function matchesFilter(section: SituationSection, activeFilter: string) {
  if (activeFilter === allFilterKey) {
    return true;
  }

  return (section.tags ?? []).includes(activeFilter);
}

function normalizePageCopy(page: SituationPage): SituationPage {
  const meta = SITUATION_PAGE_META[page.code];

  return {
    ...page,
    name: meta.name,
    title: meta.title,
    subtitle: meta.subtitle,
    location: meta.location
  };
}

export function useSituationPage(pageCode: Ref<SituationPageCode>) {
  const page = shallowRef<SituationPage | null>(null);
  const loading = shallowRef(true);
  const error = shallowRef('');
  const warningMessage = shallowRef('');
  const resolvedSource = shallowRef(getSituationDataSource());
  const activeFilter = shallowRef(allFilterKey);
  const selectedInsight = shallowRef<SituationInsight | null>(null);

  const loadPage = async () => {
    loading.value = true;
    error.value = '';
    warningMessage.value = '';

    try {
      const result = await fetchSituationPage(pageCode.value);
      page.value = normalizePageCopy(result.page);
      resolvedSource.value = result.source;
      warningMessage.value = result.warningMessage ?? '';
      selectedInsight.value = null;
    } catch (err) {
      page.value = null;
      selectedInsight.value = null;
      error.value = err instanceof Error ? err.message : '态势页面加载失败，请稍后重试。';
    } finally {
      loading.value = false;
    }
  };

  watch(pageCode, () => {
    activeFilter.value = allFilterKey;
    void loadPage();
  }, { immediate: true });

  const filters = computed(() => collectFilters(page.value));

  watch(filters, (nextFilters) => {
    if (!nextFilters.some((filter) => filter.key === activeFilter.value)) {
      activeFilter.value = allFilterKey;
    }
  });

  const visibleSections = computed(() => {
    if (!page.value) {
      return [];
    }

    return page.value.sections.filter((section) => matchesFilter(section, activeFilter.value));
  });

  const errorDescription = computed(() => error.value || '未获取到页面数据，请检查配置后重试。');
  const hasFilterResult = computed(() => visibleSections.value.length > 0);
  const filterSummary = computed(() => {
    if (!page.value) {
      return '';
    }

    if (activeFilter.value === allFilterKey) {
      return `当前展示全部 ${page.value.sections.length} 个态势板块。`;
    }

    return `当前仅展示标签“${activeFilter.value}”下的 ${visibleSections.value.length} 个板块。`;
  });

  const selectFilter = (filterKey: string) => {
    activeFilter.value = filterKey;
  };

  const selectInsight = (insight: SituationInsight) => {
    selectedInsight.value = insight;
  };

  const clearInsight = () => {
    selectedInsight.value = null;
  };

  return {
    page,
    loading,
    error,
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
  };
}
