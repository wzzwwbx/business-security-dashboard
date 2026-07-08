<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import { useAuthSession } from '@/composables/useAuthSession';
import { reactive, shallowRef } from 'vue';
import { useRouter } from 'vue-router';

const auth = useAuthSession();
const router = useRouter();
const form = reactive({
  systemAdminPassword: '',
  securityAdminPassword: '',
  auditAdminPassword: ''
});
const errorMessage = shallowRef('');
const successMessage = shallowRef('');

async function submit() {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await auth.initializeBootstrap({ ...form });
    successMessage.value = '初始化完成，请使用管理员账户登录系统。';
    await router.replace('/login');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '初始化失败，请稍后重试。';
  }
}
</script>

<template>
  <main class="bootstrap-page">
    <section class="bootstrap-card glass-card">
      <div class="eyebrow">BOOTSTRAP / 三员初始化</div>
      <h1>首次启用系统账户治理</h1>
      <p class="subtitle">请一次性为系统管理员、安全管理员、审计管理员设置初始密码，后续再通过系统管理页面维护普通用户与角色权限。</p>

      <div v-if="errorMessage" class="notice danger">
        <strong>初始化失败</strong>
        <p>{{ errorMessage }}</p>
      </div>

      <div v-if="successMessage" class="notice success">
        <strong>初始化成功</strong>
        <p>{{ successMessage }}</p>
      </div>

      <form class="bootstrap-form" @submit.prevent="submit">
        <label>
          <span>系统管理员密码</span>
          <input v-model="form.systemAdminPassword" type="password" minlength="8" required placeholder="sysadmin 初始密码" />
        </label>
        <label>
          <span>安全管理员密码</span>
          <input v-model="form.securityAdminPassword" type="password" minlength="8" required placeholder="secadmin 初始密码" />
        </label>
        <label>
          <span>审计管理员密码</span>
          <input v-model="form.auditAdminPassword" type="password" minlength="8" required placeholder="auditadmin 初始密码" />
        </label>
        <BaseButton :disabled="auth.actionInFlight.value" type="submit">完成初始化</BaseButton>
      </form>

      <div class="tag-row">
        <span class="tag">三员分立：系统管理员 / 安全管理员 / 审计管理员</span>
        <span class="tag">建议首次登录后立即改密并分配普通岗位账户</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.bootstrap-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-10);
}

.bootstrap-card {
  width: min(620px, 100%);
  padding: var(--space-10);
}

.eyebrow {
  color: var(--sys-color-brand-secondary);
  font-size: var(--font-size-13);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

h1 {
  margin: var(--space-3) 0 var(--space-3);
  font-size: clamp(30px, 4vw, 40px);
}

.subtitle {
  margin: 0 0 var(--space-7);
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.bootstrap-form {
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

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
