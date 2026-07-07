import { createRouter, createWebHistory } from 'vue-router';
import OpsPageView from '@/views/OpsPageView.vue';
import SituationPageView from '@/views/SituationPageView.vue';

const routes = [
  { path: '/', redirect: '/overview' },
  {
    path: '/overview',
    name: 'overview',
    component: SituationPageView,
    meta: { pageCode: 'overview' }
  },
  {
    path: '/terminal',
    name: 'terminal',
    component: SituationPageView,
    meta: { pageCode: 'terminal' }
  },
  {
    path: '/business',
    name: 'business',
    component: SituationPageView,
    meta: { pageCode: 'business' }
  },
  {
    path: '/security',
    name: 'security',
    component: SituationPageView,
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
