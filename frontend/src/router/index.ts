import { createRouter, createWebHistory } from 'vue-router';
import DashboardPageView from '@/views/DashboardPageView.vue';
import OpsPageView from '@/views/OpsPageView.vue';

const routes = [
  { path: '/', redirect: '/overview' },
  {
    path: '/overview',
    name: 'overview',
    component: DashboardPageView,
    meta: { pageCode: 'overview' }
  },
  {
    path: '/terminal',
    name: 'terminal',
    component: DashboardPageView,
    meta: { pageCode: 'terminal' }
  },
  {
    path: '/business',
    name: 'business',
    component: DashboardPageView,
    meta: { pageCode: 'business' }
  },
  {
    path: '/security',
    name: 'security',
    component: DashboardPageView,
    meta: { pageCode: 'security' }
  },
  {
    path: '/ops',
    name: 'ops',
    component: OpsPageView,
    meta: { pageCode: 'ops' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
