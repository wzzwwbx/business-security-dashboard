import { deleteApiData, getApiData, isAxiosLikeError, patchApiData, postApiData, putApiData, UnexpectedHtmlResponseError } from '@/api/http';
import type {
  ApiEnvelope,
  ApprovalDecisionRequest,
  BindRolesRequest,
  BootstrapInitRequest,
  BootstrapStatusDto,
  ChangePasswordRequest,
  CreateUserRequest,
  CurrentUserDto,
  IamActionResultDto,
  IamApprovalTicketDto,
  IamLoginAuditDto,
  IamOperationAuditDto,
  IamPermissionDto,
  IamRoleDto,
  IamUserDto,
  LoginRequest,
  ResetPasswordRequest,
  UpdateUserRequest
} from '@/types/iam';

interface ApiErrorEnvelope {
  code?: number;
  message?: string;
  traceId?: string;
  timestamp?: string;
  details?: Record<string, unknown>;
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === 'object'
    && value !== null
    && typeof (value as ApiEnvelope<T>).code === 'number'
    && typeof (value as ApiEnvelope<T>).message === 'string'
    && 'data' in (value as ApiEnvelope<T>);
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return typeof value === 'object' && value !== null;
}

export class IamApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: number,
    public readonly traceId?: string,
    public readonly details?: Record<string, unknown>,
    options?: { cause?: unknown }
  ) {
    super(message);
    this.name = 'IamApiError';

    if (options?.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        configurable: true
      });
    }
  }
}

function unwrapEnvelope<T>(scope: string, payload: unknown): T {
  if (!isApiEnvelope<T>(payload)) {
    throw new IamApiError(`${scope}返回格式异常，请检查后端 IAM 接口。`);
  }

  if (payload.code !== 0) {
    throw new IamApiError(payload.message || `${scope}失败`, undefined, payload.code, payload.traceId);
  }

  return payload.data;
}

function normalizeIamError(scope: string, error: unknown): IamApiError {
  if (error instanceof IamApiError) {
    return error;
  }

  if (error instanceof UnexpectedHtmlResponseError) {
    return new IamApiError(`${scope}失败：接口返回了前端 HTML，而不是 IAM JSON。`, 404, undefined, undefined, undefined, { cause: error });
  }

  if (isAxiosLikeError(error)) {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (isApiErrorEnvelope(payload)) {
      return new IamApiError(
        typeof payload.message === 'string' ? payload.message : `${scope}失败`,
        status,
        typeof payload.code === 'number' ? payload.code : undefined,
        typeof payload.traceId === 'string' ? payload.traceId : undefined,
        payload.details,
        { cause: error }
      );
    }

    const message = status ? `${scope}失败（HTTP ${status}）` : `${scope}失败（后端不可达或代理未命中）`;
    return new IamApiError(message, status, undefined, undefined, undefined, { cause: error });
  }

  return new IamApiError(`${scope}失败，请检查 IAM 服务。`, undefined, undefined, undefined, undefined, { cause: error });
}

async function requestEnvelope<T>(scope: string, task: () => Promise<unknown>) {
  try {
    return unwrapEnvelope<T>(scope, await task());
  } catch (error) {
    throw normalizeIamError(scope, error);
  }
}

export function isIamEndpointUnavailable(error: unknown) {
  return error instanceof IamApiError && (error.status === 404 || error.status === undefined);
}

export function isIamUnauthorized(error: unknown) {
  return error instanceof IamApiError && error.status === 401;
}

export function isIamForbidden(error: unknown) {
  return error instanceof IamApiError && error.status === 403;
}

export function fetchBootstrapStatus() {
  return requestEnvelope<BootstrapStatusDto>('获取初始化状态', () => getApiData('/iam/bootstrap/status'));
}

export function initializeBootstrap(request: BootstrapInitRequest) {
  return requestEnvelope<BootstrapStatusDto>('初始化三员账户', () => postApiData('/iam/bootstrap/init', request));
}

export function login(request: LoginRequest) {
  return requestEnvelope<CurrentUserDto>('登录', () => postApiData('/iam/auth/login', request));
}

export function logout() {
  return requestEnvelope<void>('退出登录', () => postApiData('/iam/auth/logout'));
}

export function fetchCurrentUser() {
  return requestEnvelope<CurrentUserDto>('获取当前用户', () => getApiData('/iam/auth/me'));
}

export function changePassword(request: ChangePasswordRequest) {
  return requestEnvelope<void>('修改密码', () => postApiData('/iam/auth/change-password', request));
}

export function listUsers() {
  return requestEnvelope<IamUserDto[]>('获取账号列表', () => getApiData('/iam/users'));
}

export function createUser(request: CreateUserRequest) {
  return requestEnvelope<IamActionResultDto>('创建账号', () => postApiData('/iam/users', request));
}

export function updateUser(userId: number, request: UpdateUserRequest) {
  return requestEnvelope<IamActionResultDto>('修改账号', () => patchApiData(`/iam/users/${userId}`, request));
}

export function requestDisableUser(userId: number) {
  return requestEnvelope<IamActionResultDto>('申请禁用账号', () => postApiData(`/iam/users/${userId}/disable`));
}

export function requestEnableUser(userId: number) {
  return requestEnvelope<IamActionResultDto>('申请启用账号', () => postApiData(`/iam/users/${userId}/enable`));
}

export function requestResetPassword(userId: number, request: ResetPasswordRequest) {
  return requestEnvelope<IamActionResultDto>('申请重置密码', () => postApiData(`/iam/users/${userId}/reset-password`, request));
}

export function requestBindRoles(userId: number, request: BindRolesRequest) {
  return requestEnvelope<IamActionResultDto>('申请调整角色', () => putApiData(`/iam/users/${userId}/roles`, request));
}

export function listRoles() {
  return requestEnvelope<IamRoleDto[]>('获取角色列表', () => getApiData('/iam/roles'));
}

export function listPermissions() {
  return requestEnvelope<IamPermissionDto[]>('获取权限列表', () => getApiData('/iam/permissions'));
}

export function listApprovals() {
  return requestEnvelope<IamApprovalTicketDto[]>('获取审批单', () => getApiData('/iam/approvals'));
}

export function approveTicket(ticketId: number, request: ApprovalDecisionRequest) {
  return requestEnvelope<IamActionResultDto>('审批通过', () => postApiData(`/iam/approvals/${ticketId}/approve`, request));
}

export function rejectTicket(ticketId: number, request: ApprovalDecisionRequest) {
  return requestEnvelope<IamActionResultDto>('审批驳回', () => postApiData(`/iam/approvals/${ticketId}/reject`, request));
}

export function listLoginAudits(limit = 50) {
  return requestEnvelope<IamLoginAuditDto[]>('获取登录审计', () => getApiData('/iam/audit/logins', { params: { limit } }));
}

export function listOperationAudits(limit = 50) {
  return requestEnvelope<IamOperationAuditDto[]>('获取操作审计', () => getApiData('/iam/audit/operations', { params: { limit } }));
}
