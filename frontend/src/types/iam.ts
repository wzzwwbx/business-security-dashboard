export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: string;
}

export interface BootstrapStatusDto {
  enabled: boolean;
  initialized: boolean;
  defaultUsernames: string[];
}

export interface BootstrapInitRequest {
  systemAdminPassword: string;
  securityAdminPassword: string;
  auditAdminPassword: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CurrentUserDto {
  id: number;
  username: string;
  displayName: string;
  forcePasswordChange: boolean;
  roleCodes: string[];
  roleNames: string[];
  pagePermissions: string[];
  actionPermissions: string[];
  pageCodes: string[];
}

export interface IamUserDto {
  id: number;
  username: string;
  displayName: string;
  status: string;
  builtIn: boolean;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
  roleCodes: string[];
  roleNames: string[];
  pageCodes: string[];
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  password: string;
  roleCodes: string[];
}

export interface UpdateUserRequest {
  displayName: string;
}

export interface ResetPasswordRequest {
  tempPassword: string;
  reason: string;
}

export interface BindRolesRequest {
  roleCodes: string[];
  reason: string;
}

export interface IamRoleDto {
  code: string;
  name: string;
  type: string;
  enabled: boolean;
  description: string;
  permissions: string[];
  pageCodes: string[];
}

export interface IamPermissionDto {
  code: string;
  resourceType: string;
  action: string;
  description: string;
}

export interface IamApprovalTicketDto {
  id: number;
  ticketType: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  requesterUsername: string;
  reviewerUsername: string | null;
  status: string;
  summary: string;
  reason: string;
  reviewComment: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  executedAt: string | null;
}

export interface ApprovalDecisionRequest {
  reviewComment: string;
}

export interface IamLoginAuditDto {
  id: number;
  username: string;
  success: boolean;
  clientIp: string | null;
  userAgent: string | null;
  reason: string | null;
  loggedAt: string;
}

export interface IamOperationAuditDto {
  id: number;
  operatorUsername: string;
  operationType: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  result: string;
  traceId: string;
  detail: string | null;
  operatedAt: string;
}

export interface IamActionResultDto {
  action: string;
  status: string;
  targetId: number | null;
  approvalTicketId: number | null;
  message: string;
}

export type IamAvailability = 'pending' | 'enabled' | 'demo';
export type SystemTabKey = 'accounts' | 'roles' | 'approvals' | 'audit';
