<template>
  <div class="app-grid">
    <aside class="sidebar glass-card">
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
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import { MAIN_NAV_ITEMS } from '@/constants/navigation';
import { useAuthSession } from '@/composables/useAuthSession';
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const auth = useAuthSession();
const router = useRouter();
const now = shallowRef('');
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

onMounted(() => {
  refreshClock();
  timer = window.setInterval(refreshClock, 1000);
});

onBeforeUnmount(() => {
  if (timer !== undefined) {
    window.clearInterval(timer);
  }
});
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  height: calc(100vh - (var(--space-6) * 2));
  margin: var(--space-6);
  padding: var(--space-8) var(--space-6);
  overflow: auto;
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

@media (max-width: 1280px) {
  .sidebar {
    align-items: center;
    gap: var(--space-7);
    margin: var(--space-5);
    padding: var(--space-7) var(--space-3);
  }

  .brand-title,
  .brand-subtitle,
  .nav-text,
  .sidebar-notice,
  .account-main,
  .logout-button span:last-child,
  .sidebar-footer {
    display: none;
  }

  .logout-button {
    justify-content: center;
    width: auto;
  }
}

@media (max-width: 960px) {
  .sidebar {
    position: static;
    height: auto;
    margin: var(--space-4);
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .nav-list {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .nav-item,
  .logout-button {
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .nav-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
