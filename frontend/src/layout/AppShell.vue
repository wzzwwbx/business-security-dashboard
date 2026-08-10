<template>
  <div class="app-grid app-shell">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true"><i class="brand-ring"></i><i class="brand-core"></i></div>
        <div class="brand-copy">
          <strong class="brand-title">业务安全态势系统</strong>
        </div>
      </div>

      <nav class="topbar-nav" aria-label="主导航">
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.code"
          :to="item.route"
          class="topbar-nav-item"
          active-class="active"
        >
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="topbar-actions">
        <span class="topbar-clock">{{ now }}</span>
        <button class="icon-button" type="button" aria-label="全屏显示" title="全屏显示" @click="toggleFullscreen">
          <BaseIcon name="fullscreen" />
        </button>
        <div class="user-menu-wrapper">
          <button
            class="user-trigger"
            type="button"
            :aria-expanded="String(userMenuOpen)"
            aria-haspopup="menu"
            @click="userMenuOpen = !userMenuOpen"
          >
            <span class="account-avatar"><BaseIcon name="user" /></span>
            <span class="user-name">{{ auth.currentUser.value?.displayName || 'Admin' }}</span>
            <BaseIcon name="chevron-down" />
          </button>
          <div v-if="userMenuOpen" class="user-menu" role="menu">
            <div class="user-menu-heading">
              <strong>{{ auth.currentUser.value?.displayName || '当前用户' }}</strong>
              <span>{{ auth.currentUser.value?.roleNames?.join(' / ') || auth.modeLabel.value }}</span>
            </div>
            <RouterLink v-if="systemRoute" class="user-menu-item" :to="systemRoute" role="menuitem" @click="userMenuOpen = false">
              <BaseIcon name="system" />
              <span>系统管理</span>
            </RouterLink>
            <button v-if="auth.availability.value === 'enabled' && auth.currentUser.value" class="user-menu-item" type="button" role="menuitem" @click="handleLogout">
              <BaseIcon name="logout" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="content-shell">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import { MAIN_NAV_ITEMS, VISIBLE_PAGE_CODES } from '@/constants/navigation';
import { useAuthSession } from '@/composables/useAuthSession';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

const auth = useAuthSession();
const route = useRoute();
const router = useRouter();
const now = ref('');
const userMenuOpen = ref(false);
let timer: number | undefined;

const isPreviewAuth = import.meta.env.VITE_PREVIEW_AUTH === 'preview';
const visibleNavItems = computed(() => MAIN_NAV_ITEMS.filter((item) => VISIBLE_PAGE_CODES.has(item.code) && auth.canAccessPage(item.code)));
const systemRoute = computed(() => VISIBLE_PAGE_CODES.has('system') && !isPreviewAuth ? auth.resolveFirstSystemRoute() : null);
function refreshClock() {
  now.value = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date()).replace(/\//g, '-');
}

async function toggleFullscreen() {
  if (typeof document === 'undefined') return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await document.documentElement.requestFullscreen?.();
}

async function handleLogout() {
  userMenuOpen.value = false;
  await auth.logout();
  await router.replace('/login');
}

watch(() => route.fullPath, () => {
  userMenuOpen.value = false;
});

onMounted(() => {
  refreshClock();
  timer = window.setInterval(refreshClock, 1000);
});

onBeforeUnmount(() => {
  if (timer !== undefined) window.clearInterval(timer);
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: block;
  background: var(--sys-color-bg-page);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  min-height: 76px;
  padding: 0 28px;
  gap: 28px;
  border-bottom: 1px solid var(--sys-color-border-primary);
  background: rgba(10, 13, 22, 0.96);
  backdrop-filter: blur(18px);
}

.brand-block,
.topbar-actions,
.user-trigger,
.live-status {
  display: flex;
  align-items: center;
}

.brand-block { gap: 12px; min-width: 400px; }
.brand-mark {
  position: relative;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid rgba(130, 174, 255, .76);
  border-radius: 4px;
  background: #111a2c;
  box-shadow: inset 0 0 18px rgba(82, 141, 255, .16);
}
.brand-mark::before,
.brand-mark::after,
.brand-ring,
.brand-core { position: absolute; display: block; content: ''; }
.brand-mark::before { width: 31px; height: 31px; top: 7px; left: 7px; border: 1px solid #78a9ff; transform: rotate(45deg); }
.brand-mark::after { width: 6px; height: 6px; top: 6px; left: 6px; background: #63d7c5; box-shadow: 30px 0 #63d7c5, 0 30px #63d7c5, 30px 30px #63d7c5; }
.brand-ring { width: 19px; height: 19px; top: 14px; left: 14px; border: 1px solid rgba(175, 198, 255, .88); border-radius: 50%; }
.brand-core { width: 8px; height: 8px; top: 19px; left: 19px; border-radius: 50%; background: #dff1ff; box-shadow: 0 0 10px rgba(99, 215, 197, .85); }
.brand-copy { display: grid; min-width: 0; }
.brand-title { color: #f0f4ff; font-family: var(--font-family-display); font-size: 38px; font-weight: 700; line-height: 1; white-space: nowrap; }
.brand-subtitle { color: #8c96a8; font-size: 12px; }

.topbar-nav { display: flex; align-items: stretch; gap: 10px; height: 76px; }
.topbar-nav-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  color: #8c96a8;
  font-size: 25px;
  white-space: nowrap;
  transition: color 160ms ease;
}
.topbar-nav-item:hover,
.topbar-nav-item.active { color: #afc6ff; }
.topbar-nav-item.active::after {
  position: absolute;
  right: 12px;
  bottom: 0;
  left: 12px;
  height: 2px;
  content: '';
  background: #afc6ff;
  box-shadow: 0 0 8px rgba(175, 198, 255, .45);
}

.topbar-actions { margin-left: auto; gap: 14px; }
.live-status {
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: 4px;
  color: #c1c6d7;
  background: #141b2d;
  font: 11px var(--font-family-mono, monospace);
}
.live-status .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #52c41a; box-shadow: 0 0 8px rgba(82,196,26,.55); }
.live-status.warning .status-dot { background: #faad14; }
.live-status.info .status-dot { background: #528dff; }
.topbar-clock { color: #dce5f2; font: 24px var(--font-family-base); white-space: nowrap; }
.icon-button,
.user-trigger {
  border: 0;
  color: #c1c6d7;
  background: transparent;
  cursor: pointer;
}
.icon-button { width: 32px; height: 32px; display: grid; place-items: center; font-size: 18px; }
.icon-button:hover,
.user-trigger:hover { color: #afc6ff; }
.user-trigger { gap: 8px; padding: 4px 0; font-size: 18px; }
.account-avatar { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; color: #afc6ff; background: #1c1f28; }
.user-trigger > .base-icon { font-size: 12px; }
.user-menu-wrapper { position: relative; }
.user-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 220px;
  padding: 8px;
  border: 1px solid #414755;
  border-radius: 4px;
  background: #1c1f28;
  box-shadow: 0 12px 28px rgba(0,0,0,.4);
}
.user-menu-heading { display: grid; gap: 3px; padding: 10px; border-bottom: 1px solid #414755; }
.user-menu-heading span { color: #8c96a8; font-size: 11px; }
.user-menu-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 10px; border: 0; color: #c1c6d7; background: transparent; text-align: left; cursor: pointer; }
.user-menu-item:hover { color: #e0e2ed; background: #272a32; }
.user-menu-item .base-icon { width: 16px; height: 16px; }
.content-shell { width: 100%; max-width: none; min-width: 0; margin: 0; padding: 18px 22px 24px; }

@media (max-width: 1100px) {
  .topbar { gap: 12px; padding-inline: 16px; }
  .brand-block { min-width: auto; }
  .topbar-clock { display: none; }
  .topbar-nav { gap: 0; }
  .topbar-nav-item { padding-inline: 8px; }
}

@media (max-width: 760px) {
  .topbar { min-height: 64px; }
  .brand-title { font-size: 26px; }
  .topbar-nav { flex: 1; min-width: 0; gap: 0; height: 64px; overflow-x: auto; }
  .topbar-nav-item { min-height: 64px; padding-inline: 10px; }
  .topbar-nav-item.active::after { right: 10px; bottom: 0; left: 10px; }
  .topbar-actions { gap: 8px; }
  .live-status, .user-name { display: none; }
  .content-shell { padding: 12px; }
}
</style>
