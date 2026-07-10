<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import { useAuthSession } from '@/composables/useAuthSession';
import { computed, reactive, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const auth = useAuthSession();
const route = useRoute();
const router = useRouter();
const form = reactive({ username: '', password: '' });
const errorMessage = shallowRef('');

const redirectTarget = computed(() => typeof route.query.redirect === 'string' ? route.query.redirect : auth.resolveFirstRoute());
const isDemo = computed(() => auth.availability.value === 'demo');

async function submit() {
  errorMessage.value = '';

  try {
    await auth.login({ username: form.username, password: form.password });
    await router.replace(redirectTarget.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。';
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card glass-card">
      <div class="eyebrow">账户登录</div>
      <h1>业务安全态势系统</h1>

      <div v-if="isDemo" class="notice success">
        <strong>当前展示为预览数据</strong>
        <p>{{ auth.sessionMessage.value || '当前账户服务暂不可用。' }}</p>
      </div>

      <div v-if="errorMessage" class="notice danger">
        <strong>登录失败</strong>
        <p>{{ errorMessage }}</p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>用户名</span>
          <input v-model.trim="form.username" autocomplete="username" required placeholder="请输入用户名" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="form.password" type="password" autocomplete="current-password" required placeholder="请输入管理员密码" />
        </label>
        <BaseButton :disabled="auth.actionInFlight.value" type="submit">登录</BaseButton>
      </form>

      <div class="hint-row">
        <span class="tag">未初始化时将自动跳转到三员初始化页</span>
        <span class="tag">登录成功后按权限进入首个可访问页面</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-10);
}

.auth-card {
  width: min(520px, 100%);
  padding: var(--space-10);
}

.eyebrow {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-13);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

h1 {
  margin: var(--space-3) 0 var(--space-7);
  font-size: clamp(30px, 4vw, 40px);
}

.auth-form {
  display: grid;
  gap: var(--space-5);
}

label {
  display: grid;
  gap: var(--space-2);
}

label span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

input {
  width: 100%;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  color: var(--sys-color-text-primary);
  padding: var(--space-4) var(--space-5);
}

.notice {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  margin-bottom: var(--space-6);
}

.notice.success {
  border-color: var(--sys-color-status-success-border);
  background: var(--sys-color-status-success-bg);
}

.notice.danger {
  border-color: var(--sys-color-status-danger-border);
  background: var(--sys-color-status-danger-bg);
}

.notice p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
}

.hint-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
