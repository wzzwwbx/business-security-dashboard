import type { DashboardPage, WidgetDefinition } from '@/types/dashboard';
import { computed, type Ref } from 'vue';

export function useDashboardLayout(page: Ref<DashboardPage | null>) {
  const heroWidget = computed<WidgetDefinition | null>(() => {
    if (page.value?.code !== 'overview') {
      return null;
    }

    return page.value.widgets.find((widget) => widget.type === 'topology') ?? null;
  });

  const pageWidgets = computed(() => {
    if (!page.value) {
      return [];
    }

    return page.value.widgets.filter((widget) => widget.code !== heroWidget.value?.code);
  });

  return {
    heroWidget,
    pageWidgets
  };
}
