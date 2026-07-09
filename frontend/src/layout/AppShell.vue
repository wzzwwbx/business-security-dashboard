<template>
  <div class="app-grid" :class="appGridClasses">
    <div v-if="isMobile && mobileNavOpen" class="sidebar-backdrop" @click="closeMobileNav"></div>

    <aside class="sidebar glass-card" :aria-hidden="isMobile ? String(!mobileNavOpen) : 'false'">
      <div class="brand-block">
        <div class="brand-mark">态势</div>
        <div class="brand-copy">
          <div class="brand-title">业务安全态势系统</div>
          <div class="brand-subtitle">综合研判与联动处置</div>
        </div>
      </div>

      <div class="sidebar-notice" :class="modeTone">
        <strong>{{ auth.modeLabel.value }}</strong>
        <p>{{ auth.sessionMessage.value || noticeDescription }}</p>
      </div>

      <nav class="nav-list" aria-label="主导航">
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.code"
          class="nav-item"
          :to="item.route"
          :title="item.description"
          active-class="active"
        >
          <span class="nav-icon" aria-hidden="true">
            <BaseIcon :name="item.icon" />
          </span>
          <span class="nav-text">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="account-card">
        <div class="account-avatar">
          <BaseIcon name="user" />
        </div>
        <div class="account-main">
          <strong>{{ auth.currentUser.value?.displayName ?? '演示访客' }}</strong>
          <span>{{ auth.currentUser.value?.roleNames?.join(' / ') || '前端预览模式' }}</span>
        </div>
      </div>

      <button v-if="auth.availability.value === 'enabled' && auth.currentUser.value" class="logout-button" type="button" @click="handleLogout">
        <span class="nav-icon"><BaseIcon name="logout" /></span>
        <span>退出登录</span>
      </button>

      <div class="sidebar-footer">
        <span class="status-dot" :class="modeTone"></span>
        <span>{{ footerLabel }}</span>
        <span class="footer-time">{{ now }}</span>
      </div>
    </aside>

    <main class="content-shell">
      <button
        class="content-nav-toggle glass-card"
        type="button"
        :aria-expanded="String(isMobile ? mobileNavOpen : !sidebarCollapsed)"
        :aria-label="toggleLabel"
        @click="toggleNavigation"
      >
        <span class="nav-icon"><BaseIcon :name="toggleIcon" /></span>
        <span>{{ toggleLabel }}</span>
      </button>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import { MAIN_NAV_ITEMS } from '@/constants/navigation';
import { useAuthSession } from '@/composables/useAuthSession';
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

const DESKTOP_SIDEBAR_STORAGE_KEY = 'business-security-dashboard.sidebar-collapsed';

const auth = useAuthSession();
const route = useRoute();
const router = useRouter();
const now = shallowRef('');
const isMobile = shallowRef(false);
const sidebarCollapsed = shallowRef(true);
const mobileNavOpen = shallowRef(false);
let timer: number | undefined;

const visibleNavItems = computed(() => MAIN_NAV_ITEMS
  .map((item) => ({
    ...item,
    route: item.code === 'system' ? auth.resolveFirstSystemRoute() ?? item.route : item.route
  }))
  .filter((item) => item.code === 'system' ? Boolean(auth.resolveFirstSystemRoute()) : auth.canAccessPage(item.code)));

const modeTone = computed(() => {
  if (auth.availability.value === 'enabled') {
    return 'info';
  }

  if (auth.availability.value === 'demo') {
    return 'success';
  }

  return 'warning';
});

const noticeDescription = computed(() => auth.availability.value === 'enabled'
  ? '导航按页面权限实时裁剪，系统管理页再按动作权限细分页签。'
  : '当后端账号能力暂不可用时，系统自动回退到演示数据，便于前端继续联调。');

const footerLabel = computed(() => auth.currentUser.value?.username
  ? `${auth.currentUser.value.username} 已连接`
  : auth.modeLabel.value);

const appGridClasses = computed(() => ({
  'sidebar-collapsed': !isMobile.value && sidebarCollapsed.value,
  'sidebar-mobile': isMobile.value,
  'sidebar-mobile-open': isMobile.value && mobileNavOpen.value
}));

const toggleLabel = computed(() => {
  if (isMobile.value) {
    return mobileNavOpen.value ? '收起导航' : '展开导航';
  }

  return sidebarCollapsed.value ? '展开导航' : '收起导航';
});

const toggleIcon = computed(() => mobileNavOpen.value ? 'close' : 'menu');

function readDesktopSidebarPreference() {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY);
  if (stored === null) {
    return true;
  }

  return stored === '1';
}

function persistDesktopSidebarPreference() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, sidebarCollapsed.value ? '1' : '0');
}

function syncViewportState() {
  if (typeof window === 'undefined') {
    return;
  }

  const mobile = window.innerWidth <= 960;
  isMobile.value = mobile;

  if (!mobile) {
    mobileNavOpen.value = false;
  }
}

function toggleNavigation() {
  if (isMobile.value) {
    mobileNavOpen.value = !mobileNavOpen.value;
    return;
  }

  sidebarCollapsed.value = !sidebarCollapsed.value;
  persistDesktopSidebarPreference();
}

function closeMobileNav() {
  mobileNavOpen.value = false;
}

function refreshClock() {
  now.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
}

async function handleLogout() {
  await auth.logout();
  await router.replace('/login');
}

watch(() => route.fullPath, () => {
  if (isMobile.value) {
    mobileNavOpen.value = false;
  }
});

onMounted(() => {
  sidebarCollapsed.value = readDesktopSidebarPreference();
  syncViewportState();
  refreshClock();
  timer = window.setInterval(refreshClock, 1000);
  window.addEventListener('resize', syncViewportState, { passive: true });
});

onBeforeUnmount(() => {
  if (timer !== undefined) {
    window.clearInterval(timer);
  }

  window.removeEventListener('resize', syncViewportState);
});
</script>

<style scoped>
.app-grid {
  position: relative;
  grid-template-columns: var(--layout-sidebar-width) minmax(0, 1fr);
  transition: grid-template-columns var(--motion-duration-base) var(--motion-ease-standard);
}

.app-grid.sidebar-collapsed {
  grid-template-columns: var(--layout-sidebar-width-collapsed) minmax(0, 1fr);
}

.sidebar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  height: calc(100vh - (var(--space-6) * 2));
  margin: var(--space-6);
  padding: var(--space-8) var(--space-6);
  overflow: auto;
  transition:
    transform var(--motion-duration-base) var(--motion-ease-standard),
    opacity var(--motion-duration-base) var(--motion-ease-standard),
    padding var(--motion-duration-fast) var(--motion-ease-standard);
}

.content-shell {
  position: relative;
}

.content-nav-toggle {
  position: fixed;
  top: 18px;
  left: calc(var(--layout-sidebar-width) + 28px);
  z-index: calc(var(--z-overlay) + 1);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 42px;
  padding: 0 var(--space-4);
  border: 1px solid var(--sys-color-border-accent);
  color: var(--sys-color-text-primary);
  background: rgba(9, 21, 39, 0.82);
  cursor: pointer;
  transition:
    left var(--motion-duration-base) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.content-nav-toggle:hover {
  background: rgba(14, 30, 55, 0.94);
  border-color: var(--sys-color-brand-secondary);
}

.app-grid.sidebar-collapsed .content-nav-toggle {
  left: calc(var(--layout-sidebar-width-collapsed) + 28px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
  font-weight: var(--font-weight-black);
  letter-spacing: 1px;
  background: var(--sys-color-brand-gradient);
}

.brand-copy {
  min-width: 0;
}

.brand-title {
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
}

.brand-subtitle {
  margin-top: var(--space-1);
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.sidebar-notice,
.account-card {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-muted);
}

.sidebar-notice.success {
  border-color: var(--sys-color-status-success-border);
}

.sidebar-notice.info {
  border-color: var(--sys-color-status-info-border);
}

.sidebar-notice.warning {
  border-color: var(--sys-color-status-warning-border);
}

.sidebar-notice p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
  line-height: var(--line-height-base);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.nav-item,
.logout-button {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 48px;
  padding: var(--space-4) var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  color: var(--sys-color-text-secondary);
  background: transparent;
  transition: all var(--motion-duration-fast) var(--motion-ease-standard);
}

.nav-item:hover,
.nav-item.active,
.logout-button:hover {
  color: var(--sys-color-text-primary);
  border-color: var(--sys-color-border-accent);
  background: linear-gradient(90deg, var(--sys-color-brand-primary-soft), var(--sys-color-brand-primary-weak));
}

.nav-icon {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  font-size: var(--icon-size-md);
  flex: 0 0 auto;
}

.nav-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.account-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.account-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--sys-color-brand-secondary);
  background: var(--sys-color-brand-secondary-tint);
}

.account-main {
  min-width: 0;
}

.account-main strong,
.account-main span {
  display: block;
}

.account-main span {
  margin-top: var(--space-2);
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.logout-button {
  width: 100%;
  cursor: pointer;
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3) 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.footer-time {
  margin-left: auto;
  color: var(--sys-color-text-tertiary);
}

.app-grid.sidebar-collapsed .sidebar {
  align-items: center;
  padding-inline: var(--space-3);
}

.app-grid.sidebar-collapsed .brand-copy,
.app-grid.sidebar-collapsed .sidebar-notice,
.app-grid.sidebar-collapsed .account-main,
.app-grid.sidebar-collapsed .nav-text,
.app-grid.sidebar-collapsed .logout-button span:last-child,
.app-grid.sidebar-collapsed .sidebar-footer {
  display: none;
}

.app-grid.sidebar-collapsed .brand-block,
.app-grid.sidebar-collapsed .account-card {
  justify-content: center;
}

.app-grid.sidebar-collapsed .nav-list {
  width: 100%;
}

.app-grid.sidebar-collapsed .nav-item,
.app-grid.sidebar-collapsed .logout-button {
  justify-content: center;
  padding-inline: 0;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: rgba(2, 8, 20, 0.58);
  backdrop-filter: blur(4px);
}

@media (max-width: 1280px) {
  .content-nav-toggle {
    padding-inline: var(--space-3);
  }
}

@media (max-width: 960px) {
  .app-grid,
  .app-grid.sidebar-collapsed,
  .app-grid.sidebar-mobile,
  .app-grid.sidebar-mobile-open {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    top: var(--space-4);
    left: var(--space-4);
    bottom: var(--space-4);
    width: min(320px, calc(100vw - (var(--space-4) * 2)));
    height: auto;
    margin: 0;
    transform: translateX(calc(-100% - var(--space-6)));
    opacity: 0;
    pointer-events: none;
    overflow: auto;
    z-index: calc(var(--z-overlay) + 1);
  }

  .app-grid.sidebar-mobile-open .sidebar {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  .content-nav-toggle,
  .app-grid.sidebar-collapsed .content-nav-toggle {
    top: var(--space-4);
    left: var(--space-4);
  }
}

@media (max-width: 640px) {
  .content-nav-toggle span:last-child {
    display: none;
  }
}
</style>
