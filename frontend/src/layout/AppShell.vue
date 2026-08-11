<template>
  <div class="app-grid app-shell">
    <header class="topbar">
      <div class="topbar-spacer" aria-hidden="true" />
      <div class="brand-block">
        <strong class="brand-title">业务安全态势系统</strong>
      </div>

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
const systemRoute = computed(() => !isPreviewAuth ? auth.resolveFirstSystemRoute() : null);
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
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: var(--topbar-height);
  height: var(--topbar-height);
  padding: 0 20px;
  gap: 12px;
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

.brand-block {
  justify-self: center;
  gap: 10px;
  min-width: 0;
}
.brand-title {
  color: #f0f4ff;
  font-family: var(--font-family-display);
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 2px;
  white-space: nowrap;
}

.topbar-actions {
  justify-self: end;
  gap: 12px;
}
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
.topbar-clock { color: #dce5f2; font: 18px var(--font-family-base); white-space: nowrap; }
.icon-button,
.user-trigger {
  border: 0;
  color: #c1c6d7;
  background: transparent;
  cursor: pointer;
}
.icon-button { width: 30px; height: 30px; display: grid; place-items: center; font-size: 16px; }
.icon-button:hover,
.user-trigger:hover { color: #afc6ff; }
.user-trigger { gap: 8px; padding: 2px 0; font-size: 15px; }
.account-avatar { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; color: #afc6ff; background: #1c1f28; }
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
.content-shell { width: 100%; max-width: none; min-width: 0; margin: 0; padding: 10px 14px 12px; }

@media (max-width: 1100px) {
  .topbar { gap: 8px; padding-inline: 12px; }
  .topbar-clock { display: none; }
}

@media (max-width: 760px) {
  .topbar { min-height: 56px; }
  .brand-title { font-size: 20px; }
  .topbar-actions { gap: 8px; }
  .live-status, .user-name { display: none; }
  .content-shell { padding: 12px; }
}
</style>
