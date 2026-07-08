<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import type { IamAvailability, IamRoleDto, IamUserDto } from '@/types/iam';
import { computed, reactive, shallowRef, watch } from 'vue';

const props = defineProps<{
  users: IamUserDto[];
  roles: IamRoleDto[];
  availability: IamAvailability;
  busy: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canRequestDisable: boolean;
  canRequestEnable: boolean;
  canResetPassword: boolean;
  canBindRoles: boolean;
}>();

const emit = defineEmits<{
  create: [payload: { username: string; displayName: string; password: string; roleCodes: string[] }];
  update: [payload: { userId: number; displayName: string }];
  disable: [user: IamUserDto];
  enable: [user: IamUserDto];
  resetPassword: [payload: { user: IamUserDto; tempPassword: string; reason: string }];
  bindRoles: [payload: { user: IamUserDto; roleCodes: string[]; reason: string }];
}>();

const createForm = reactive({
  username: '',
  displayName: '',
  password: '',
  roleCodes: [] as string[]
});

const selectedUserId = shallowRef<number | null>(null);
const editDisplayName = shallowRef('');
const resetForm = reactive({
  tempPassword: '',
  reason: ''
});
const bindRoleForm = reactive({
  roleCodes: [] as string[],
  reason: ''
});

const selectedUser = computed(() => props.users.find((item) => item.id === selectedUserId.value) ?? null);

watch(() => props.users, (nextUsers) => {
  if (!nextUsers.length) {
    selectedUserId.value = null;
    return;
  }

  if (!selectedUserId.value || !nextUsers.some((item) => item.id === selectedUserId.value)) {
    selectedUserId.value = nextUsers[0].id;
  }
}, { immediate: true });

watch(selectedUser, (user) => {
  editDisplayName.value = user?.displayName ?? '';
  bindRoleForm.roleCodes = [...(user?.roleCodes ?? [])];
  bindRoleForm.reason = '';
  resetForm.tempPassword = '';
  resetForm.reason = '';
}, { immediate: true });

const isDemo = computed(() => props.availability === 'demo');

function toggleRoleSelection(roleCode: string, checked: boolean) {
  if (checked) {
    bindRoleForm.roleCodes = Array.from(new Set([...bindRoleForm.roleCodes, roleCode]));
    return;
  }

  bindRoleForm.roleCodes = bindRoleForm.roleCodes.filter((item) => item !== roleCode);
}

function toggleCreateRole(roleCode: string, checked: boolean) {
  if (checked) {
    createForm.roleCodes = Array.from(new Set([...createForm.roleCodes, roleCode]));
    return;
  }

  createForm.roleCodes = createForm.roleCodes.filter((item) => item !== roleCode);
}

function submitCreate() {
  emit('create', { ...createForm, roleCodes: [...createForm.roleCodes] });
  createForm.username = '';
  createForm.displayName = '';
  createForm.password = '';
  createForm.roleCodes = [];
}

function submitUpdate() {
  if (!selectedUser.value) {
    return;
  }

  emit('update', { userId: selectedUser.value.id, displayName: editDisplayName.value });
}

function submitResetPassword() {
  if (!selectedUser.value) {
    return;
  }

  emit('resetPassword', {
    user: selectedUser.value,
    tempPassword: resetForm.tempPassword,
    reason: resetForm.reason
  });
  resetForm.tempPassword = '';
  resetForm.reason = '';
}

function submitBindRoles() {
  if (!selectedUser.value) {
    return;
  }

  emit('bindRoles', {
    user: selectedUser.value,
    roleCodes: [...bindRoleForm.roleCodes],
    reason: bindRoleForm.reason
  });
  bindRoleForm.reason = '';
}
</script>

<template>
  <section class="panel-grid">
    <article class="glass-card card create-card">
      <div class="card-head">
        <div>
          <h2>创建账号</h2>
          <p>系统管理员负责账户建立，安全管理员与审计管理员拥有独立岗位账号。</p>
        </div>
        <span class="tag">{{ isDemo ? '可预览写操作' : '真实接口' }}</span>
      </div>

      <BaseEmpty v-if="!canCreate && !canUpdate" title="当前账号仅具备查看权限" description="如需创建或调整账户，请使用具备系统管理员权限的账户登录。" />

      <form v-else class="form-grid" @submit.prevent="submitCreate">
        <label>
          <span>登录名</span>
          <input v-model.trim="createForm.username" required placeholder="例如：ops.duty" />
        </label>
        <label>
          <span>显示名称</span>
          <input v-model.trim="createForm.displayName" required placeholder="例如：运维值班员" />
        </label>
        <label class="full-row">
          <span>初始密码</span>
          <input v-model="createForm.password" required type="password" minlength="8" placeholder="至少 8 位" />
        </label>
        <fieldset class="full-row role-fieldset">
          <legend>初始角色</legend>
          <label v-for="role in roles" :key="role.code" class="checkbox-item">
            <input
              :checked="createForm.roleCodes.includes(role.code)"
              type="checkbox"
              @change="toggleCreateRole(role.code, ($event.target as HTMLInputElement).checked)"
            />
            <div>
              <strong>{{ role.name }}</strong>
              <span>{{ role.description }}</span>
            </div>
          </label>
        </fieldset>
        <div class="actions full-row">
          <BaseButton :disabled="busy || !canCreate || !createForm.roleCodes.length" type="submit">创建账号</BaseButton>
        </div>
      </form>
    </article>

    <article class="glass-card card list-card">
      <div class="card-head">
        <div>
          <h2>账号列表</h2>
          <p>查看账户状态、角色归属与三员职责边界。</p>
        </div>
        <span class="tag">{{ users.length }} 个账户</span>
      </div>

      <div v-if="users.length" class="user-list">
        <button
          v-for="user in users"
          :key="user.id"
          class="user-item"
          :class="{ active: user.id === selectedUserId }"
          type="button"
          @click="selectedUserId = user.id"
        >
          <div>
            <strong>{{ user.displayName }}</strong>
            <span>{{ user.username }}</span>
          </div>
          <div class="user-meta">
            <span class="badge" :class="user.status === 'ACTIVE' ? 'success' : 'warning'">{{ user.status === 'ACTIVE' ? '启用' : '停用' }}</span>
            <span class="tag">{{ user.roleNames.join(' / ') || '未绑定角色' }}</span>
          </div>
        </button>
      </div>
      <BaseEmpty v-else title="暂无账号数据" description="当前尚未创建普通业务账户。" />
    </article>

    <article class="glass-card card detail-card">
      <div class="card-head">
        <div>
          <h2>账户维护</h2>
          <p>选中账号后，可调整显示名称、角色与临时密码申请。</p>
        </div>
        <span v-if="selectedUser" class="tag">{{ selectedUser.username }}</span>
      </div>

      <BaseEmpty v-if="!selectedUser" title="请选择一个账号" description="左侧选择目标账号后，可查看详情并发起治理操作。" />

      <template v-else>
        <section class="detail-summary">
          <div>
            <span>当前状态</span>
            <strong>{{ selectedUser.status === 'ACTIVE' ? '启用' : '停用' }}</strong>
          </div>
          <div>
            <span>已绑定角色</span>
            <strong>{{ selectedUser.roleNames.join(' / ') || '未绑定' }}</strong>
          </div>
          <div>
            <span>最近登录</span>
            <strong>{{ selectedUser.lastLoginAt || '暂无记录' }}</strong>
          </div>
        </section>

        <form class="mini-form" @submit.prevent="submitUpdate">
          <label>
            <span>显示名称</span>
            <input v-model.trim="editDisplayName" required :disabled="!canUpdate || busy" />
          </label>
          <div class="actions">
            <BaseButton :disabled="!canUpdate || busy" type="submit">保存名称</BaseButton>
            <BaseButton v-if="selectedUser.status === 'ACTIVE'" variant="secondary" :disabled="!canRequestDisable || busy" @click="emit('disable', selectedUser)">
              申请禁用
            </BaseButton>
            <BaseButton v-else variant="secondary" :disabled="!canRequestEnable || busy" @click="emit('enable', selectedUser)">
              申请启用
            </BaseButton>
          </div>
        </form>

        <form class="mini-form" @submit.prevent="submitBindRoles">
          <fieldset class="role-fieldset compact">
            <legend>角色绑定</legend>
            <label v-for="role in roles" :key="role.code" class="checkbox-item">
              <input
                :checked="bindRoleForm.roleCodes.includes(role.code)"
                type="checkbox"
                @change="toggleRoleSelection(role.code, ($event.target as HTMLInputElement).checked)"
              />
              <div>
                <strong>{{ role.name }}</strong>
                <span>{{ role.code }}</span>
              </div>
            </label>
          </fieldset>
          <label>
            <span>调整原因</span>
            <textarea v-model.trim="bindRoleForm.reason" rows="3" :disabled="!canBindRoles || busy" placeholder="说明岗位、值班或授权边界变化原因" />
          </label>
          <div class="actions">
            <BaseButton :disabled="!canBindRoles || busy || !bindRoleForm.roleCodes.length || !bindRoleForm.reason" type="submit">提交角色调整</BaseButton>
          </div>
        </form>

        <form class="mini-form" @submit.prevent="submitResetPassword">
          <label>
            <span>临时密码</span>
            <input v-model="resetForm.tempPassword" type="password" minlength="8" :disabled="!canResetPassword || busy" placeholder="用于口令重置审批" />
          </label>
          <label>
            <span>重置原因</span>
            <textarea v-model.trim="resetForm.reason" rows="3" :disabled="!canResetPassword || busy" placeholder="例如：交接班、账号疑似泄露、离岗回收后重发" />
          </label>
          <div class="actions">
            <BaseButton :disabled="!canResetPassword || busy || !resetForm.tempPassword || !resetForm.reason" type="submit">提交口令重置</BaseButton>
          </div>
        </form>
      </template>
    </article>
  </section>
</template>

<style scoped>
.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: var(--space-7);
}

.card {
  padding: var(--space-8);
}

.create-card,
.detail-card {
  display: grid;
  gap: var(--space-6);
}

.list-card {
  grid-row: span 2;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
}

.card-head h2 {
  margin: 0;
  font-size: var(--font-size-18);
}

.card-head p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.form-grid,
.mini-form {
  display: grid;
  gap: var(--space-4);
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full-row {
  grid-column: 1 / -1;
}

label,
fieldset {
  display: grid;
  gap: var(--space-2);
}

label span,
legend {
  font-size: var(--font-size-13);
  color: var(--sys-color-text-secondary);
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  color: var(--sys-color-text-primary);
  padding: var(--space-4) var(--space-5);
}

textarea {
  resize: vertical;
}

.role-fieldset {
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-lg);
}

.role-fieldset.compact {
  padding: var(--space-5);
}

.checkbox-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: var(--space-3);
  padding: var(--space-3) 0;
}

.checkbox-item strong {
  display: block;
}

.checkbox-item span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.user-list {
  display: grid;
  gap: var(--space-3);
}

.user-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-5);
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-lg);
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.user-item.active {
  border-color: var(--sys-color-border-accent);
  background: linear-gradient(135deg, var(--sys-color-brand-primary-soft), var(--sys-color-brand-primary-weak));
}

.user-item span {
  display: block;
  margin-top: var(--space-2);
  color: var(--sys-color-text-secondary);
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.detail-summary div {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-muted);
}

.detail-summary span {
  display: block;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.detail-summary strong {
  display: block;
  margin-top: var(--space-3);
}

@media (max-width: 1280px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .list-card {
    grid-row: auto;
  }
}

@media (max-width: 720px) {
  .form-grid,
  .detail-summary {
    grid-template-columns: 1fr;
  }

  .user-item {
    flex-direction: column;
  }

  .user-meta {
    align-items: flex-start;
  }
}
</style>
