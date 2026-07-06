<template>
  <div class="app-grid">
    <aside class="sidebar glass-card">
      <div class="brand-block">
        <div class="brand-mark">BS</div>
        <div>
          <div class="brand-title">业务安全态势系统</div>
          <div class="brand-subtitle">Business Security Situation</div>
        </div>
      </div>

      <div v-if="menuNotice" class="sidebar-notice" :class="menuNotice.tone">
        <strong>{{ menuNotice.title }}</strong>
        <p>{{ menuNotice.description }}</p>
      </div>

      <nav class="nav-list" aria-label="主导航">
        <RouterLink
          v-for="item in menu"
          :key="item.code"
          class="nav-item"
          :to="item.route"
          :aria-label="item.name"
          :title="item.name"
          active-class="active"
        >
          <span class="nav-icon" aria-hidden="true">
            <BaseIcon :name="iconMap[item.code] ?? 'overview'" />
          </span>
          <span class="nav-text">{{ item.name }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <span class="status-dot" :class="footerTone"></span>
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
import { DashboardApiError, fetchMenu, fetchRuntime, getDashboardDataSource } from '@/api/dashboard';
import { getMockMenu } from '@/mocks/dashboard';
import type { DashboardMenuItem, DashboardRuntimeInfo, DashboardStatusTone } from '@/types/dashboard';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { RouterLink } from 'vue-router';

interface SidebarNotice {
  title: string;
  description: string;
  tone: DashboardStatusTone;
}

const menu = ref<DashboardMenuItem[]>([]);
const runtimeInfo = shallowRef<DashboardRuntimeInfo | null>(null);
const now = shallowRef('');
const menuNotice = shallowRef<SidebarNotice | null>(null);
let timer: number | undefined;

const iconMap: Record<string, 'overview' | 'terminal' | 'business' | 'security' | 'ops'> = {
  overview: 'overview',
  terminal: 'terminal',
  business: 'business',
  security: 'security',
  ops: 'ops'
};

const footerTone = computed<DashboardStatusTone>(() => {
  if (menuNotice.value?.tone) {
    return menuNotice.value.tone;
  }

  return getDashboardDataSource() === 'integration' ? 'info' : 'success';
});

const footerLabel = computed(() => {
  if (runtimeInfo.value) {
    return runtimeInfo.value.dataSourceMode === 'mysql' ? 'MySQL 联调模式' : '后端 Mock 联调模式';
  }

  if (menuNotice.value) {
    return menuNotice.value.title;
  }

  return getDashboardDataSource() === 'integration' ? '接口联调模式' : '演示数据模式';
});

const refreshClock = () => {
  now.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
};

const buildRuntimeNotice = (runtime: DashboardRuntimeInfo): SidebarNotice => {
  const isMysql = runtime.dataSourceMode === 'mysql';

  return {
    title: isMysql ? '后端 MySQL 已接入' : '后端 Mock 已接入',
    description: `${runtime.applicationName} · profile=${runtime.activeProfile} · Java ${runtime.javaVersion}${
      isMysql ? ' · 已启用数据库初始化/灌数链路' : ' · 当前后端仍以演示数据返回接口'
    }`,
    tone: isMysql ? 'success' : 'info'
  };
};

const loadMenu = async () => {
  try {
    if (getDashboardDataSource() === 'integration') {
      const [menuData, runtime] = await Promise.all([fetchMenu(), fetchRuntime()]);
      menu.value = menuData;
      runtimeInfo.value = runtime;
      menuNotice.value = runtime ? buildRuntimeNotice(runtime) : {
        title: '后端接口已接入',
        description: '当前导航来自 Spring Boot API，可继续联调页面与数据库能力。',
        tone: 'info'
      };
      return;
    }

    menu.value = await fetchMenu();
    runtimeInfo.value = null;
    menuNotice.value = {
      title: '本地演示模式',
      description: '当前导航与页面均来自前端 mock 数据，适合视觉预览与原型演示。',
      tone: 'success'
    };
  } catch (error) {
    runtimeInfo.value = null;
    menu.value = await getMockMenu();
    menuNotice.value = {
      title: '联调未建立',
      description:
        error instanceof DashboardApiError
          ? `${error.message}，当前仅保留本地导航壳用于继续排查页面。`
          : '导航接口暂不可用，当前仅保留本地导航壳用于继续排查页面。',
      tone: 'warning'
    };
  }
};

onMounted(async () => {
  await loadMenu();
  refreshClock();
  timer = window.setInterval(refreshClock, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  height: calc(100vh - (var(--space-6) * 2));
  margin: var(--space-6);
  padding: var(--space-8) var(--space-6);
  overflow: auto;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  min-width: 0;
}

.brand-mark {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
  font-weight: var(--font-weight-black);
  letter-spacing: 1px;
  background: var(--sys-color-brand-gradient);
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

.sidebar-notice {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-muted);
}

.sidebar-notice strong {
  display: block;
  font-size: var(--font-size-14);
}

.sidebar-notice p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
  line-height: var(--line-height-base);
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

.sidebar-notice.danger {
  border-color: var(--sys-color-status-danger-border);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 48px;
  padding: var(--space-4) var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  color: var(--sys-color-text-secondary);
  transition: all var(--motion-duration-fast) var(--motion-ease-standard);
}

.nav-item:hover,
.nav-item.active {
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

.nav-badge {
  min-width: 24px;
  height: 24px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--sys-color-status-danger-soft);
  color: var(--sys-color-status-danger-text);
  display: grid;
  place-items: center;
  font-size: var(--font-size-12);
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
  .sidebar-footer span:not(.status-dot),
  .nav-badge,
  .sidebar-notice {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding-inline: var(--space-3);
  }

  .brand-block {
    justify-content: center;
  }
}

@media (max-width: 960px) {
  .sidebar {
    position: static;
    height: auto;
    margin: var(--space-4) var(--space-4) 0;
    padding: var(--space-6);
    gap: var(--space-6);
  }

  .brand-title,
  .brand-subtitle,
  .nav-text,
  .sidebar-footer span,
  .nav-badge,
  .sidebar-notice {
    display: initial;
  }

  .sidebar-notice {
    display: block;
  }

  .brand-block {
    justify-content: flex-start;
  }

  .nav-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .nav-item {
    flex: 1 1 calc(50% - 10px);
    justify-content: flex-start;
    padding-inline: var(--space-5);
  }

  .sidebar-footer {
    padding-inline: 0;
  }
}

@media (max-width: 640px) {
  .sidebar {
    margin: var(--space-3) var(--space-3) 0;
    padding: var(--space-5);
  }

  .brand-title {
    font-size: var(--font-size-16);
  }

  .nav-item {
    flex-basis: 100%;
  }

  .footer-time {
    display: none;
  }
}
</style>
