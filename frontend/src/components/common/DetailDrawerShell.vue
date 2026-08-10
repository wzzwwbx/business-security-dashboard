<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="open" class="drawer-backdrop" :class="{ centered }" @click.self="emit('close')">
        <aside class="drawer-panel glass-card" :class="{ centered }" role="dialog" aria-modal="true" :aria-label="title">
          <header class="drawer-header">
            <div class="drawer-title-block">
              <div v-if="subtitle" class="drawer-subtitle">{{ subtitle }}</div>
              <div class="drawer-title-row">
                <h2>{{ title }}</h2>
                <button class="drawer-close" type="button" aria-label="关闭详情" @click="emit('close')">
                  <BaseIcon name="close" />
                </button>
              </div>
              <div v-if="badges?.length" class="drawer-badges">
                <span v-for="badge in badges" :key="badge.label" class="tag" :class="badge.tone ?? 'info'">{{ badge.label }}</span>
              </div>
            </div>
          </header>

          <nav v-if="tabs?.length" class="drawer-tabs" aria-label="详情标签页">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="drawer-tab"
              :class="{ active: tab.key === activeTab }"
              @click="emit('select-tab', tab.key)"
            >
              {{ tab.label }}
            </button>
          </nav>

          <div class="drawer-body">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue';
import type { VisualBadgeItem } from '@/types/visualization';

interface DrawerTabItem {
  key: string;
  label: string;
}

defineProps<{
  open: boolean;
  title: string;
  subtitle?: string;
  badges?: VisualBadgeItem[];
  tabs?: DrawerTabItem[];
  activeTab?: string;
  centered?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  'select-tab': [key: string];
}>();
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  background: rgba(4, 10, 20, 0.32);
  backdrop-filter: blur(4px);
}

.drawer-backdrop.centered {
  justify-content: center;
  align-items: flex-start;
  padding: 12vh 24px 24px;
}

.drawer-panel {
  width: min(440px, 34vw);
  min-width: 360px;
  height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-panel.centered {
  width: min(1060px, 86vw);
  min-width: 0;
  height: auto;
  max-height: 78vh;
  border: 1px solid rgba(122, 164, 255, .4);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(2, 10, 26, .6);
}

.drawer-header {
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--sys-color-border-secondary);
}

.drawer-subtitle {
  color: var(--sys-color-text-secondary);
  font-size: 14px;
  letter-spacing: 0.04em;
}

.drawer-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}

.drawer-title-row h2 {
  margin: 0;
  font-size: 24px;
}

.drawer-close {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: 12px;
  background: rgba(8, 19, 35, 0.72);
  color: var(--sys-color-text-primary);
  cursor: pointer;
}

.drawer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.drawer-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--sys-color-border-secondary);
  overflow: auto;
}

.drawer-tab {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--sys-color-border-secondary);
  background: transparent;
  color: var(--sys-color-text-secondary);
  font-size: 15px;
  cursor: pointer;
}

.drawer-tab.active {
  border-color: var(--sys-color-brand-secondary);
  color: var(--sys-color-text-primary);
  background: linear-gradient(90deg, rgba(30, 136, 255, 0.16), rgba(45, 226, 230, 0.08));
}

.drawer-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity var(--motion-duration-base) var(--motion-ease-standard);
}

.drawer-fade-enter-active .drawer-panel,
.drawer-fade-leave-active .drawer-panel {
  transition: transform var(--motion-duration-base) var(--motion-ease-standard);
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-from .drawer-panel,
.drawer-fade-leave-to .drawer-panel {
  transform: translateX(18px);
}

@media (max-width: 960px) {
  .drawer-backdrop {
    padding: 0;
  }

  .drawer-panel {
    width: 100%;
    min-width: 0;
    height: 100vh;
    border-radius: 0;
  }
}
</style>
