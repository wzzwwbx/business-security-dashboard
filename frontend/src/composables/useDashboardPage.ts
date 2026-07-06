import { fetchPage } from '@/api/dashboard';
import type { DashboardPage } from '@/types/dashboard';
import { readonly, ref, shallowRef, watch } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

export function useDashboardPage(route: RouteLocationNormalizedLoaded) {
  const page = ref<DashboardPage | null>(null);
  const loading = shallowRef(true);
  const errorMessage = shallowRef('');

  const loadPage = async () => {
    loading.value = true;
    errorMessage.value = '';

    try {
      const pageCode = String(route.meta.pageCode ?? 'overview');
      page.value = await fetchPage(pageCode);
    } catch (error) {
      page.value = null;
      errorMessage.value = error instanceof Error ? error.message : '页面加载失败';
    } finally {
      loading.value = false;
    }
  };

  watch(() => route.meta.pageCode, loadPage, { immediate: true });

  return {
    page: readonly(page),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    loadPage
  };
}
