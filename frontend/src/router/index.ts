import { createRouter, createWebHistory } from 'vue-router';
import { useAuthSession } from '@/composables/useAuthSession';
import OpsPageView from '@/views/OpsPageView.vue';
import SituationPageView from '@/views/SituationPageView.vue';
import DemoSituationPageView from '@/views/DemoSituationPageView.vue';
import TerminalPageView from '@/views/TerminalPageView.vue';
import BootstrapPageView from '@/views/BootstrapPageView.vue';
import ForbiddenPageView from '@/views/ForbiddenPageView.vue';
import LoginPageView from '@/views/LoginPageView.vue';
import SystemPageView from '@/views/SystemPageView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/overview' },
    {
      path: '/login',
      name: 'login',
      component: LoginPageView,
      meta: { shell: false, publicRoute: true, publicOnly: true }
    },
    {
      path: '/bootstrap',
      name: 'bootstrap',
      component: BootstrapPageView,
      meta: { shell: false, publicRoute: true, publicOnly: true }
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: ForbiddenPageView,
      meta: { shell: false, publicRoute: true }
    },
    {
      path: '/overview',
      name: 'overview',
      component: DemoSituationPageView,
      meta: { pageCode: 'overview' }
    },
    {
      path: '/security',
      name: 'security',
      component: SituationPageView,
      meta: { pageCode: 'security' }
    },
    {
      path: '/business',
      name: 'business',
      component: DemoSituationPageView,
      meta: { pageCode: 'business' }
    },
    {
      path: '/terminal',
      name: 'terminal',
      component: TerminalPageView,
      meta: { pageCode: 'terminal' }
    },
    {
      path: '/ops',
      name: 'ops',
      component: OpsPageView,
      meta: { pageCode: 'ops' }
    },
    {
      path: '/system',
      redirect: '/system/accounts'
    },
    {
      path: '/system/accounts',
      name: 'system-accounts',
      component: SystemPageView,
      meta: { pageCode: 'system', systemTab: 'accounts', requiredAuthorities: ['account:view'] }
    },
    {
      path: '/system/roles',
      name: 'system-roles',
      component: SystemPageView,
      meta: { pageCode: 'system', systemTab: 'roles', requiredAuthorities: ['role:view'] }
    },
    {
      path: '/system/approvals',
      name: 'system-approvals',
      component: SystemPageView,
      meta: { pageCode: 'system', systemTab: 'approvals', requiredAuthorities: ['approval:view'] }
    },
    {
      path: '/system/audit',
      name: 'system-audit',
      component: SystemPageView,
      meta: { pageCode: 'system', systemTab: 'audit', requiredAuthorities: ['audit:view'] }
    }
  ]
});

router.beforeEach(async (to) => {
  const auth = useAuthSession();
  await auth.ensureReady();

  const isPublicRoute = Boolean(to.meta.publicRoute);
  const isPublicOnly = Boolean(to.meta.publicOnly);

  if (auth.requiresBootstrap.value && to.name !== 'bootstrap') {
    return { name: 'bootstrap' };
  }

  if (isPublicOnly) {
    if (to.name === 'bootstrap' && !auth.requiresBootstrap.value) {
      return auth.resolveFirstRoute();
    }

    if (to.name === 'login' && auth.isAuthenticated.value) {
      return auth.resolveFirstRoute();
    }
  }

  if (auth.availability.value === 'enabled' && !auth.isAuthenticated.value && !isPublicRoute) {
    return {
      name: 'login',
      query: { redirect: to.fullPath }
    };
  }

  if (to.meta.pageCode && !auth.canAccessPage(to.meta.pageCode)) {
    const fallback = auth.resolveFirstRoute();
    if (fallback !== to.fullPath && fallback !== '/forbidden') {
      return fallback;
    }

    if (to.name !== 'forbidden') {
      return { name: 'forbidden' };
    }
  }

  const requiredAuthorities = to.meta.requiredAuthorities ?? [];
  if (requiredAuthorities.some((item) => !auth.hasAuthority(item))) {
    const systemFallback = auth.resolveFirstSystemRoute();
    if (to.meta.pageCode === 'system' && systemFallback && systemFallback !== to.fullPath) {
      return systemFallback;
    }

    if (to.name !== 'forbidden') {
      return { name: 'forbidden' };
    }
  }

  return true;
});

export default router;
