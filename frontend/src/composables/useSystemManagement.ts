import {
  approveTicket as approveTicketRequest,
  createUser as createUserRequest,
  listApprovals as listApprovalsRequest,
  listLoginAudits as listLoginAuditsRequest,
  listOperationAudits as listOperationAuditsRequest,
  listPermissions as listPermissionsRequest,
  listRoles as listRolesRequest,
  listUsers as listUsersRequest,
  rejectTicket as rejectTicketRequest,
  requestBindRoles as requestBindRolesRequest,
  requestDisableUser as requestDisableUserRequest,
  requestEnableUser as requestEnableUserRequest,
  requestResetPassword as requestResetPasswordRequest,
  updateUser as updateUserRequest
} from '@/api/iam';
import { getDemoApprovals, getDemoLoginAudits, getDemoOperationAudits, getDemoPermissions, getDemoRoles, getDemoUsers } from '@/mocks/iam';
import type {
  ApprovalDecisionRequest,
  BindRolesRequest,
  CreateUserRequest,
  IamActionResultDto,
  IamApprovalTicketDto,
  IamLoginAuditDto,
  IamOperationAuditDto,
  IamPermissionDto,
  IamRoleDto,
  IamUserDto,
  ResetPasswordRequest,
  SystemTabKey,
  UpdateUserRequest
} from '@/types/iam';
import { computed, reactive, shallowRef, watch, type Ref } from 'vue';
import { useAuthSession } from './useAuthSession';

interface ActionFeedback {
  tone: 'success' | 'warning' | 'danger' | 'info';
  message: string;
}

const demoReviewer = 'demo-admin';

export function useSystemManagement(activeTab: Ref<SystemTabKey>) {
  const auth = useAuthSession();
  const users = shallowRef<IamUserDto[]>([]);
  const roles = shallowRef<IamRoleDto[]>([]);
  const permissions = shallowRef<IamPermissionDto[]>([]);
  const approvals = shallowRef<IamApprovalTicketDto[]>([]);
  const loginAudits = shallowRef<IamLoginAuditDto[]>([]);
  const operationAudits = shallowRef<IamOperationAuditDto[]>([]);
  const loading = shallowRef(false);
  const actionLoading = shallowRef(false);
  const errorMessage = shallowRef('');
  const feedback = shallowRef<ActionFeedback | null>(null);
  const loaded = reactive<Record<SystemTabKey, boolean>>({
    accounts: false,
    roles: false,
    approvals: false,
    audit: false
  });

  const pendingApprovalCount = computed(() => approvals.value.filter((item) => item.status === 'PENDING').length);
  const isDemo = computed(() => auth.availability.value === 'demo');

  function setFeedback(message: string, tone: ActionFeedback['tone'] = 'success') {
    feedback.value = { message, tone };
  }

  function clearFeedback() {
    feedback.value = null;
  }

  function markLoaded(tab: SystemTabKey) {
    loaded[tab] = true;
  }

  function createDemoResult(action: string, message: string, targetId: number | null = null): IamActionResultDto {
    return {
      action,
      status: 'SKIPPED',
      targetId,
      approvalTicketId: null,
      message
    };
  }

  async function loadAccounts(force = false) {
    if (loaded.accounts && !force) {
      return;
    }

    if (isDemo.value) {
      users.value = getDemoUsers();
      roles.value = getDemoRoles();
      markLoaded('accounts');
      return;
    }

    const nextUsers = await listUsersRequest();
    users.value = nextUsers;

    if (auth.hasAuthority('role:view')) {
      roles.value = await listRolesRequest();
    }

    markLoaded('accounts');
  }

  async function loadRoles(force = false) {
    if (loaded.roles && !force) {
      return;
    }

    if (isDemo.value) {
      roles.value = getDemoRoles();
      permissions.value = getDemoPermissions();
      markLoaded('roles');
      return;
    }

    const [nextRoles, nextPermissions] = await Promise.all([listRolesRequest(), listPermissionsRequest()]);
    roles.value = nextRoles;
    permissions.value = nextPermissions;
    markLoaded('roles');
  }

  async function loadApprovals(force = false) {
    if (loaded.approvals && !force) {
      return;
    }

    if (isDemo.value) {
      approvals.value = getDemoApprovals();
      markLoaded('approvals');
      return;
    }

    approvals.value = await listApprovalsRequest();
    markLoaded('approvals');
  }

  async function loadAudit(force = false) {
    if (loaded.audit && !force) {
      return;
    }

    if (isDemo.value) {
      loginAudits.value = getDemoLoginAudits();
      operationAudits.value = getDemoOperationAudits();
      markLoaded('audit');
      return;
    }

    const [nextLoginAudits, nextOperationAudits] = await Promise.all([listLoginAuditsRequest(80), listOperationAuditsRequest(80)]);
    loginAudits.value = nextLoginAudits;
    operationAudits.value = nextOperationAudits;
    markLoaded('audit');
  }

  async function loadTab(tab = activeTab.value, force = false) {
    loading.value = true;
    errorMessage.value = '';

    try {
      if (tab === 'accounts') {
        await loadAccounts(force);
      } else if (tab === 'roles') {
        await loadRoles(force);
      } else if (tab === 'approvals') {
        await loadApprovals(force);
      } else {
        await loadAudit(force);
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '系统管理数据加载失败。';
    } finally {
      loading.value = false;
    }
  }

  async function withAction(scope: string, task: () => Promise<IamActionResultDto>, after?: () => Promise<void>) {
    actionLoading.value = true;
    clearFeedback();

    try {
      const result = await task();
      setFeedback(result.message || `${scope}已提交。`, result.status === 'SKIPPED' ? 'info' : 'success');
      if (after) {
        await after();
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : `${scope}失败。`;
      setFeedback(message, 'danger');
      throw error;
    } finally {
      actionLoading.value = false;
    }
  }

  function appendDemoApproval(ticketType: string, targetId: number, targetLabel: string, summary: string, reason: string) {
    approvals.value = [
      {
        id: Date.now(),
        ticketType,
        targetType: 'USER',
        targetId: String(targetId),
        targetLabel,
        requesterUsername: auth.currentUser.value?.username ?? demoReviewer,
        reviewerUsername: null,
        status: 'PENDING',
        summary,
        reason,
        reviewComment: null,
        submittedAt: new Date().toLocaleString('zh-CN'),
        reviewedAt: null,
        executedAt: null
      },
      ...approvals.value
    ];
  }

  async function createUser(payload: CreateUserRequest) {
    return withAction('创建账号', async () => {
      if (isDemo.value) {
        const nextRoleNames = roles.value.filter((item) => payload.roleCodes.includes(item.code)).map((item) => item.name);
        users.value = [
          {
            id: Date.now(),
            username: payload.username,
            displayName: payload.displayName,
            status: 'ACTIVE',
            builtIn: false,
            forcePasswordChange: true,
            lastLoginAt: null,
            roleCodes: payload.roleCodes,
            roleNames: nextRoleNames,
            pageCodes: roles.value.filter((item) => payload.roleCodes.includes(item.code)).flatMap((item) => item.pageCodes),
            createdAt: new Date().toLocaleString('zh-CN')
          },
          ...users.value
        ];
        return createDemoResult('CREATE_USER', '演示模式下已创建本地预览账号。');
      }

      return createUserRequest(payload);
    }, async () => {
      await loadAccounts(true);
    });
  }

  async function updateUser(userId: number, payload: UpdateUserRequest) {
    return withAction('修改账号', async () => {
      if (isDemo.value) {
        users.value = users.value.map((item) => (item.id === userId ? { ...item, displayName: payload.displayName } : item));
        return createDemoResult('UPDATE_USER', '演示模式下已更新显示名称。', userId);
      }

      return updateUserRequest(userId, payload);
    }, async () => {
      await loadAccounts(true);
    });
  }

  async function disableUser(user: IamUserDto) {
    return withAction('申请禁用账号', async () => {
      if (isDemo.value) {
        users.value = users.value.map((item) => (item.id === user.id ? { ...item, status: 'DISABLED' } : item));
        appendDemoApproval('USER_DISABLE', user.id, user.displayName, `申请禁用 ${user.displayName}`, '演示模式下生成的审批单。');
        return createDemoResult('DISABLE_USER', '演示模式下已生成禁用审批预览。', user.id);
      }

      return requestDisableUserRequest(user.id);
    }, async () => {
      await Promise.all([loadAccounts(true), loadApprovals(true)]);
    });
  }

  async function enableUser(user: IamUserDto) {
    return withAction('申请启用账号', async () => {
      if (isDemo.value) {
        users.value = users.value.map((item) => (item.id === user.id ? { ...item, status: 'ACTIVE' } : item));
        appendDemoApproval('USER_ENABLE', user.id, user.displayName, `申请启用 ${user.displayName}`, '演示模式下生成的审批单。');
        return createDemoResult('ENABLE_USER', '演示模式下已生成启用审批预览。', user.id);
      }

      return requestEnableUserRequest(user.id);
    }, async () => {
      await Promise.all([loadAccounts(true), loadApprovals(true)]);
    });
  }

  async function resetPassword(user: IamUserDto, payload: ResetPasswordRequest) {
    return withAction('申请重置密码', async () => {
      if (isDemo.value) {
        appendDemoApproval('USER_RESET_PASSWORD', user.id, user.displayName, `申请重置 ${user.displayName} 密码`, payload.reason);
        return createDemoResult('RESET_PASSWORD', '演示模式下已生成密码重置审批预览。', user.id);
      }

      return requestResetPasswordRequest(user.id, payload);
    }, async () => {
      await loadApprovals(true);
    });
  }

  async function bindRoles(user: IamUserDto, payload: BindRolesRequest) {
    return withAction('申请角色调整', async () => {
      if (isDemo.value) {
        const nextRoles = roles.value.filter((item) => payload.roleCodes.includes(item.code));
        users.value = users.value.map((item) => (item.id === user.id
          ? {
              ...item,
              roleCodes: nextRoles.map((role) => role.code),
              roleNames: nextRoles.map((role) => role.name),
              pageCodes: nextRoles.flatMap((role) => role.pageCodes)
            }
          : item));
        appendDemoApproval('USER_BIND_ROLE', user.id, user.displayName, `申请调整 ${user.displayName} 角色`, payload.reason);
        return createDemoResult('BIND_ROLE', '演示模式下已更新本地角色并生成审批预览。', user.id);
      }

      return requestBindRolesRequest(user.id, payload);
    }, async () => {
      await Promise.all([loadAccounts(true), loadApprovals(true)]);
    });
  }

  async function approveTicket(ticketId: number, payload: ApprovalDecisionRequest) {
    return withAction('审批通过', async () => {
      if (isDemo.value) {
        approvals.value = approvals.value.map((item) => (item.id === ticketId
          ? {
              ...item,
              status: 'APPROVED',
              reviewerUsername: demoReviewer,
              reviewComment: payload.reviewComment,
              reviewedAt: new Date().toLocaleString('zh-CN'),
              executedAt: new Date().toLocaleString('zh-CN')
            }
          : item));
        return createDemoResult('APPROVE_TICKET', '演示模式下已更新审批状态。', ticketId);
      }

      return approveTicketRequest(ticketId, payload);
    }, async () => {
      await Promise.all([loadApprovals(true), loadAccounts(true)]);
    });
  }

  async function rejectTicket(ticketId: number, payload: ApprovalDecisionRequest) {
    return withAction('审批驳回', async () => {
      if (isDemo.value) {
        approvals.value = approvals.value.map((item) => (item.id === ticketId
          ? {
              ...item,
              status: 'REJECTED',
              reviewerUsername: demoReviewer,
              reviewComment: payload.reviewComment,
              reviewedAt: new Date().toLocaleString('zh-CN'),
              executedAt: null
            }
          : item));
        return createDemoResult('REJECT_TICKET', '演示模式下已更新审批状态。', ticketId);
      }

      return rejectTicketRequest(ticketId, payload);
    }, async () => {
      await loadApprovals(true);
    });
  }

  watch(activeTab, (tab) => {
    void loadTab(tab);
  }, { immediate: true });

  return {
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
    loadTab,
    clearFeedback,
    createUser,
    updateUser,
    disableUser,
    enableUser,
    resetPassword,
    bindRoles,
    approveTicket,
    rejectTicket
  };
}
