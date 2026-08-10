import {
  fetchBootstrapStatus,
  fetchCurrentUser,
  initializeBootstrap as initializeBootstrapRequest,
  isIamEndpointUnavailable,
  isIamUnauthorized,
  login as loginRequest,
  logout as logoutRequest
} from '@/api/iam';
import { DEFAULT_PAGE_ORDER, PAGE_PERMISSION_MAP, resolveFirstAccessibleSystemRoute, type AppPageCode } from '@/constants/navigation';
import { getDemoBootstrapStatus, getDemoCurrentUser } from '@/mocks/iam';
import type { BootstrapInitRequest, BootstrapStatusDto, CurrentUserDto, IamAvailability, LoginRequest } from '@/types/iam';
import { computed, readonly, shallowRef } from 'vue';

const availability = shallowRef<IamAvailability>('pending');
const bootstrapStatus = shallowRef<BootstrapStatusDto | null>(null);
const currentUser = shallowRef<CurrentUserDto | null>(null);
const ready = shallowRef(false);
const loading = shallowRef(false);
const actionInFlight = shallowRef(false);
const sessionMessage = shallowRef('');

let inflight: Promise<void> | null = null;

const authoritySet = computed(() => {
  const user = currentUser.value;
  return new Set([...(user?.pagePermissions ?? []), ...(user?.actionPermissions ?? [])]);
});

const pageCodeSet = computed(() => new Set(currentUser.value?.pageCodes ?? []));
const isAuthenticated = computed(() => availability.value === 'demo' || currentUser.value !== null);
const requiresBootstrap = computed(() => availability.value === 'enabled' && bootstrapStatus.value !== null && !bootstrapStatus.value.initialized);
const modeLabel = computed(() => (availability.value === 'enabled' ? '账户治理已启用' : availability.value === 'demo' ? '当前为预览数据' : '初始化中'));

function applyDemoFallback(message: string) {
  availability.value = 'demo';
  bootstrapStatus.value = getDemoBootstrapStatus();
  currentUser.value = getDemoCurrentUser();
  sessionMessage.value = message;
}

async function hydrateSession(force = false) {
  if (inflight && !force) {
    return inflight;
  }

  inflight = (async () => {
    loading.value = true;
    if (force) {
      ready.value = false;
    }

    // 演示预览模式：跳过登录与后端 IAM，直接使用内置演示账户。
    if (import.meta.env.VITE_PREVIEW_AUTH === 'preview') {
      applyDemoFallback('演示预览模式，已跳过登录。');
      return;
    }

    try {
      const status = await fetchBootstrapStatus();
      availability.value = 'enabled';
      bootstrapStatus.value = status;
      sessionMessage.value = '';

      if (!status.initialized) {
        currentUser.value = null;
        return;
      }

      try {
        currentUser.value = await fetchCurrentUser();
      } catch (error) {
        if (isIamUnauthorized(error)) {
          currentUser.value = null;
          return;
        }

        throw error;
      }
    } catch (error) {
      if (isIamEndpointUnavailable(error)) {
        applyDemoFallback('当前账户服务暂不可用，系统已切换到预览数据。');
      } else {
        const message = error instanceof Error ? error.message : '账户服务初始化失败，系统已切换到预览数据。';
        applyDemoFallback(message);
      }
    } finally {
      ready.value = true;
      loading.value = false;
    }
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

function hasAuthority(code: string) {
  return authoritySet.value.has(code);
}

function canAccessPage(pageCode: AppPageCode) {
  if (availability.value === 'pending') {
    return false;
  }

  if (pageCodeSet.value.has(pageCode)) {
    return true;
  }

  return hasAuthority(PAGE_PERMISSION_MAP[pageCode]);
}

function resolveFirstSystemRoute() {
  return resolveFirstAccessibleSystemRoute(hasAuthority);
}

function resolveFirstRoute() {
  if (availability.value === 'enabled' && bootstrapStatus.value && !bootstrapStatus.value.initialized) {
    return '/bootstrap';
  }

  if (availability.value === 'enabled' && !currentUser.value) {
    return '/login';
  }

  for (const pageCode of DEFAULT_PAGE_ORDER) {
    if (pageCode === 'system') {
      const systemRoute = resolveFirstSystemRoute();
      if (systemRoute) {
        return systemRoute;
      }
      continue;
    }

    if (canAccessPage(pageCode)) {
      return `/${pageCode}`;
    }
  }

  return '/forbidden';
}

async function ensureReady(force = false) {
  if (ready.value && !force) {
    return;
  }

  await hydrateSession(force);
}

async function login(payload: LoginRequest) {
  if (availability.value !== 'enabled') {
    currentUser.value = getDemoCurrentUser();
    return currentUser.value;
  }

  actionInFlight.value = true;
  try {
    const user = await loginRequest(payload);
    currentUser.value = user;
    sessionMessage.value = '';
    return user;
  } finally {
    actionInFlight.value = false;
  }
}

async function logout() {
  if (availability.value !== 'enabled') {
    sessionMessage.value = '当前页面为预览数据。';
    return;
  }

  actionInFlight.value = true;
  try {
    await logoutRequest();
  } finally {
    currentUser.value = null;
    actionInFlight.value = false;
  }
}

async function initializeBootstrap(payload: BootstrapInitRequest) {
  if (availability.value !== 'enabled') {
    bootstrapStatus.value = getDemoBootstrapStatus();
    currentUser.value = getDemoCurrentUser();
    return bootstrapStatus.value;
  }

  actionInFlight.value = true;
  try {
    const status = await initializeBootstrapRequest(payload);
    bootstrapStatus.value = status;
    currentUser.value = null;
    sessionMessage.value = '三员初始化完成，请使用管理员账户登录。';
    return status;
  } finally {
    actionInFlight.value = false;
  }
}

export function useAuthSession() {
  return {
    availability: readonly(availability),
    bootstrapStatus: readonly(bootstrapStatus),
    currentUser: readonly(currentUser),
    ready: readonly(ready),
    loading: readonly(loading),
    actionInFlight: readonly(actionInFlight),
    sessionMessage: readonly(sessionMessage),
    isAuthenticated,
    requiresBootstrap,
    modeLabel,
    ensureReady,
    login,
    logout,
    initializeBootstrap,
    hasAuthority,
    canAccessPage,
    resolveFirstRoute,
    resolveFirstSystemRoute
  };
}
