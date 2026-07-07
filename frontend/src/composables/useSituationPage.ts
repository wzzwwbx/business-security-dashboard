import { fetchSituationPage, SituationApiError } from '@/api/situations';
import type { SituationPage, SituationPageCode } from '@/types/situation';
import { computed, shallowRef, watch, type Ref } from 'vue';

export function useSituationPage(pageCode: Ref<SituationPageCode>) {
  const page = shallowRef<SituationPage | null>(null);
  const loading = shallowRef(true);
  const error = shallowRef('');

  const loadPage = async () => {
    loading.value = true;
    error.value = '';

    try {
      page.value = await fetchSituationPage(pageCode.value);
    } catch (err) {
      page.value = null;
      error.value = err instanceof SituationApiError ? err.message : '态势页面加载失败，请稍后重试。';
    } finally {
      loading.value = false;
    }
  };

  watch(pageCode, () => {
    void loadPage();
  }, { immediate: true });

  const errorDescription = computed(() => error.value || '未获取到页面数据，请检查配置后重试。');

  return {
    page,
    loading,
    error,
    errorDescription,
    loadPage
  };
}
