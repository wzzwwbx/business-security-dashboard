<template>
  <div class="app-grid" :class="appGridClasses">
    <div v-if="isMobile && mobileNavOpen" class="sidebar-backdrop" @click="closeMobileNav"></div>

    <aside class="sidebar glass-card" :aria-hidden="isMobile ? String(!mobileNavOpen) : 'false'">
      <div class="sidebar-header">
        <div class="brand-block">
          <div class="brand-mark">态势</div>
          <div class="brand-copy">
            <div class="brand-title">业务安全态势系统</div>
            <div class="brand-subtitle">综合研判与联动处置</div>
          </div>
        </div>
        <button
          class="sidebar-toggle"
          type="button"
          :aria-expanded="String(isMobile ? mobileNavOpen : !sidebarCollapsed)"
          :aria-label="toggleLabel"
          @click="toggleNavigation"
        >
          <BaseIcon :name="sidebarToggleIcon" />
        </button>
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
          <strong>{{ auth.currentUser.value?.displayName ?? '当前用户' }}</strong>
          <span>{{ auth.currentUser.value?.roleNames?.join(' / ') || '未登录' }}</span>
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
        v-if="isMobile"
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
  ? '导航会按当前账号可用功能自动显示。'
  : '当前展示为预览数据。');

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

const sidebarToggleIcon = computed(() => {
  if (isMobile.value) {
    return mobileNavOpen.value ? 'close' : 'menu';
  }

  return sidebarCollapsed.value ? 'chevron-right' : 'chevron-left';
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
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(4, 17, 31, 0.98), rgba(4, 16, 27, 0.96)),
    linear-gradient(180deg, rgba(0, 217, 255, 0.08), transparent 22%);
  border: 1px solid rgba(76, 223, 255, 0.2);
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
  left: var(--space-4);
  z-index: calc(var(--z-overlay) + 1);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--sys-color-border-accent);
  border-radius: var(--radius-pill);
  color: var(--sys-color-text-primary);
  background: rgba(9, 21, 39, 0.88);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.content-nav-toggle:hover {
  background: rgba(14, 30, 55, 0.94);
  border-color: var(--sys-color-brand-secondary);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  min-width: 0;
}

.sidebar-toggle {
  width: 36px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-md);
  color: var(--sys-color-text-secondary);
  background: rgba(18, 40, 66, 0.42);
  cursor: pointer;
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.sidebar-toggle:hover {
  color: var(--sys-color-text-primary);
  background: rgba(18, 40, 66, 0.72);
  border-color: var(--sys-color-border-accent);
  transform: translateY(-1px);
}

.brand-mark {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: var(--font-weight-black);
  letter-spacing: 1px;
  color: #ffe082;
  background: linear-gradient(135deg, rgba(255, 214, 92, 0.28), rgba(27, 220, 255, 0.14));
  box-shadow: inset 0 0 20px rgba(255, 224, 130, 0.08), 0 0 20px rgba(32, 197, 255, 0.12);
}

.brand-copy {
  min-width: 0;
}

.brand-title {
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  color: #f2fbff;
}

.brand-subtitle {
  margin-top: var(--space-1);
  color: #62dcff;
  font-size: var(--font-size-12);
  letter-spacing: 0.08em;
}

.sidebar-notice,
.account-card {
  padding: var(--space-4) var(--space-5);
  border-radius: 14px;
  border: 1px solid rgba(65, 214, 255, 0.18);
  background: linear-gradient(180deg, rgba(7, 39, 61, 0.92), rgba(5, 26, 43, 0.88));
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
  min-height: 46px;
  padding: var(--space-4);
  border: 1px solid rgba(66, 220, 255, 0.08);
  border-radius: 14px;
  color: var(--sys-color-text-secondary);
  background: rgba(8, 26, 43, 0.34);
  transition:
    color var(--motion-duration-fast) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.nav-item:hover,
.nav-item.active,
.logout-button:hover {
  color: var(--sys-color-text-primary);
  border-color: rgba(76, 223, 255, 0.42);
  background: linear-gradient(90deg, rgba(18, 144, 255, 0.26), rgba(45, 226, 230, 0.12));
  transform: translateX(2px);
  box-shadow: inset 0 0 18px rgba(22, 196, 255, 0.14);
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
  color: #73e8ff;
  background: rgba(19, 157, 224, 0.2);
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

.app-grid.sidebar-collapsed .sidebar-header {
  width: 100%;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-3);
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

  .sidebar-toggle {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 640px) {
  .content-nav-toggle span:last-child {
    display: none;
  }
}
</style>
