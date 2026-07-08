<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import SystemAccountsPanel from '@/components/system/SystemAccountsPanel.vue';
import SystemApprovalsPanel from '@/components/system/SystemApprovalsPanel.vue';
import SystemAuditPanel from '@/components/system/SystemAuditPanel.vue';
import SystemHero from '@/components/system/SystemHero.vue';
import SystemRolesPanel from '@/components/system/SystemRolesPanel.vue';
import SystemTabs from '@/components/system/SystemTabs.vue';
import { SYSTEM_TAB_ITEMS } from '@/constants/navigation';
import { useAuthSession } from '@/composables/useAuthSession';
import { useSystemManagement } from '@/composables/useSystemManagement';
import type { SystemTabKey } from '@/types/iam';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const auth = useAuthSession();

const activeTab = computed<SystemTabKey>(() => {
  const candidate = route.meta.systemTab;
  return candidate === 'roles' || candidate === 'approvals' || candidate === 'audit' ? candidate : 'accounts';
});

const {
  users,
  roles,
  permissions,
  approvals,
  loginAudits,
  operationAudits,
  loading,
  actionLoading,
  errorMessage,
  feedback,
  pendingApprovalCount,
  createUser,
  updateUser,
  disableUser,
  enableUser,
  resetPassword,
  bindRoles,
  approveTicket,
  rejectTicket
} = useSystemManagement(activeTab);

const visibleTabs = computed(() => SYSTEM_TAB_ITEMS.filter((item) => item.requiredAuthorities.every((code) => auth.hasAuthority(code))));
</script>

<template>
  <div class="system-page">
    <SystemHero
      :availability="auth.availability.value"
      :current-user="auth.currentUser.value"
      :session-message="auth.sessionMessage.value"
      :pending-approval-count="pendingApprovalCount"
      :account-count="users.length"
    />

    <SystemTabs :tabs="visibleTabs" :active-tab="activeTab" />

    <section v-if="feedback" class="inline-notice" :class="feedback.tone">
      <strong>{{ feedback.tone === 'danger' ? '操作失败' : '操作结果' }}</strong>
      <p>{{ feedback.message }}</p>
    </section>

    <section v-if="errorMessage" class="inline-notice danger">
      <strong>数据加载失败</strong>
      <p>{{ errorMessage }}</p>
    </section>

    <SystemAccountsPanel
      v-if="activeTab === 'accounts' && !loading"
      :users="users"
      :roles="roles"
      :availability="auth.availability.value"
      :busy="actionLoading"
      :can-create="auth.hasAuthority('account:create')"
      :can-update="auth.hasAuthority('account:update')"
      :can-request-disable="auth.hasAuthority('account:disable') && auth.hasAuthority('approval:submit')"
      :can-request-enable="auth.hasAuthority('account:enable') && auth.hasAuthority('approval:submit')"
      :can-reset-password="auth.hasAuthority('account:reset-password') && auth.hasAuthority('approval:submit')"
      :can-bind-roles="auth.hasAuthority('account:bind-role') && auth.hasAuthority('approval:submit')"
      @create="createUser"
      @update="({ userId, displayName }) => updateUser(userId, { displayName })"
      @disable="disableUser"
      @enable="enableUser"
      @reset-password="({ user, tempPassword, reason }) => resetPassword(user, { tempPassword, reason })"
      @bind-roles="({ user, roleCodes, reason }) => bindRoles(user, { roleCodes, reason })"
    />

    <SystemRolesPanel v-else-if="activeTab === 'roles' && !loading" :roles="roles" :permissions="permissions" />

    <SystemApprovalsPanel
      v-else-if="activeTab === 'approvals' && !loading"
      :approvals="approvals"
      :busy="actionLoading"
      :can-review="auth.hasAuthority('approval:review')"
      @approve="({ ticketId, reviewComment }) => approveTicket(ticketId, { reviewComment })"
      @reject="({ ticketId, reviewComment }) => rejectTicket(ticketId, { reviewComment })"
    />

    <SystemAuditPanel v-else-if="activeTab === 'audit' && !loading" :login-audits="loginAudits" :operation-audits="operationAudits" />

    <BaseEmpty v-else title="系统管理数据加载中" description="正在获取当前页签所需的账户、审批或审计数据。" icon="refresh" />
  </div>
</template>

<style scoped>
.system-page {
  min-width: 0;
}

.inline-notice {
  margin-bottom: var(--space-7);
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
}

.inline-notice.success,
.inline-notice.info {
  border-color: var(--sys-color-status-info-border);
  background: var(--sys-color-status-info-bg);
}

.inline-notice.danger {
  border-color: var(--sys-color-status-danger-border);
  background: var(--sys-color-status-danger-bg);
}

.inline-notice p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
}
</style>
