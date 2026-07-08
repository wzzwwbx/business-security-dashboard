import type {
  BootstrapStatusDto,
  CurrentUserDto,
  IamApprovalTicketDto,
  IamLoginAuditDto,
  IamOperationAuditDto,
  IamPermissionDto,
  IamRoleDto,
  IamUserDto
} from '@/types/iam';

const demoBootstrapStatus: BootstrapStatusDto = {
  enabled: true,
  initialized: true,
  defaultUsernames: ['sysadmin', 'secadmin', 'auditadmin']
};

const demoUser: CurrentUserDto = {
  id: 1,
  username: 'demo-admin',
  displayName: '演示管理员',
  forcePasswordChange: false,
  roleCodes: ['sys_admin', 'sec_admin', 'audit_admin'],
  roleNames: ['系统管理员', '安全管理员', '审计管理员'],
  pagePermissions: [
    'page:overview:view',
    'page:security:view',
    'page:business:view',
    'page:terminal:view',
    'page:ops:view',
    'page:system:view'
  ],
  actionPermissions: [
    'account:view',
    'account:create',
    'account:update',
    'account:disable',
    'account:enable',
    'account:reset-password',
    'account:bind-role',
    'role:view',
    'approval:view',
    'approval:submit',
    'approval:review',
    'audit:view',
    'audit:export',
    'policy:update',
    'source-agent:update'
  ],
  pageCodes: ['overview', 'security', 'business', 'terminal', 'ops', 'system']
};

const demoRoles: IamRoleDto[] = [
  {
    code: 'sys_admin',
    name: '系统管理员',
    type: 'BUILT_IN',
    enabled: true,
    description: '负责账户创建、启停用、密码初始化与基础维护。',
    permissions: ['page:system:view', 'account:view', 'account:create', 'account:update', 'account:disable', 'account:enable', 'account:reset-password', 'approval:view', 'approval:submit', 'role:view'],
    pageCodes: ['system']
  },
  {
    code: 'sec_admin',
    name: '安全管理员',
    type: 'BUILT_IN',
    enabled: true,
    description: '负责授权策略、角色分配与关键操作审批。',
    permissions: ['page:system:view', 'account:view', 'account:bind-role', 'approval:view', 'approval:review', 'role:view', 'policy:update', 'source-agent:update'],
    pageCodes: ['system']
  },
  {
    code: 'audit_admin',
    name: '审计管理员',
    type: 'BUILT_IN',
    enabled: true,
    description: '负责登录审计、操作审计与审批留痕核查。',
    permissions: ['page:system:view', 'approval:view', 'audit:view', 'audit:export', 'role:view'],
    pageCodes: ['system']
  },
  {
    code: 'overview_view',
    name: '综合态势查看',
    type: 'TEMPLATE',
    enabled: true,
    description: '允许查看综合态势主题页。',
    permissions: ['page:overview:view'],
    pageCodes: ['overview']
  },
  {
    code: 'ops_view',
    name: '运维态势查看',
    type: 'TEMPLATE',
    enabled: true,
    description: '允许查看运维态势主题页。',
    permissions: ['page:ops:view'],
    pageCodes: ['ops']
  }
];

const demoPermissions: IamPermissionDto[] = [
  { code: 'page:overview:view', resourceType: 'page', action: 'view', description: '查看综合态势页面' },
  { code: 'page:security:view', resourceType: 'page', action: 'view', description: '查看安全态势页面' },
  { code: 'page:business:view', resourceType: 'page', action: 'view', description: '查看业务态势页面' },
  { code: 'page:terminal:view', resourceType: 'page', action: 'view', description: '查看终端态势页面' },
  { code: 'page:ops:view', resourceType: 'page', action: 'view', description: '查看运维态势页面' },
  { code: 'page:system:view', resourceType: 'page', action: 'view', description: '查看系统管理页面' },
  { code: 'account:view', resourceType: 'account', action: 'view', description: '查看账号列表与详情' },
  { code: 'account:create', resourceType: 'account', action: 'create', description: '创建账号' },
  { code: 'account:update', resourceType: 'account', action: 'update', description: '修改账号基础资料' },
  { code: 'account:disable', resourceType: 'account', action: 'disable', description: '申请禁用账号' },
  { code: 'account:enable', resourceType: 'account', action: 'enable', description: '申请启用账号' },
  { code: 'account:reset-password', resourceType: 'account', action: 'reset-password', description: '申请重置密码' },
  { code: 'account:bind-role', resourceType: 'account', action: 'bind-role', description: '申请调整角色' },
  { code: 'approval:view', resourceType: 'approval', action: 'view', description: '查看审批单' },
  { code: 'approval:review', resourceType: 'approval', action: 'review', description: '审批关键操作' },
  { code: 'audit:view', resourceType: 'audit', action: 'view', description: '查看审计日志' }
];

const demoUsers: IamUserDto[] = [
  {
    id: 1,
    username: 'sysadmin',
    displayName: '系统管理员',
    status: 'ACTIVE',
    builtIn: true,
    forcePasswordChange: false,
    lastLoginAt: '2026-07-08 10:21:36',
    roleCodes: ['sys_admin'],
    roleNames: ['系统管理员'],
    pageCodes: ['system'],
    createdAt: '2026-07-01 09:00:00'
  },
  {
    id: 2,
    username: 'secadmin',
    displayName: '安全管理员',
    status: 'ACTIVE',
    builtIn: true,
    forcePasswordChange: false,
    lastLoginAt: '2026-07-08 09:40:11',
    roleCodes: ['sec_admin'],
    roleNames: ['安全管理员'],
    pageCodes: ['system'],
    createdAt: '2026-07-01 09:00:00'
  },
  {
    id: 3,
    username: 'auditadmin',
    displayName: '审计管理员',
    status: 'ACTIVE',
    builtIn: true,
    forcePasswordChange: false,
    lastLoginAt: '2026-07-08 08:55:43',
    roleCodes: ['audit_admin'],
    roleNames: ['审计管理员'],
    pageCodes: ['system'],
    createdAt: '2026-07-01 09:00:00'
  },
  {
    id: 11,
    username: 'ops.viewer',
    displayName: '运维态势值班员',
    status: 'ACTIVE',
    builtIn: false,
    forcePasswordChange: true,
    lastLoginAt: '2026-07-07 22:18:10',
    roleCodes: ['ops_view'],
    roleNames: ['运维态势查看'],
    pageCodes: ['ops'],
    createdAt: '2026-07-03 14:20:00'
  },
  {
    id: 12,
    username: 'biz.owner',
    displayName: '业务主题负责人',
    status: 'DISABLED',
    builtIn: false,
    forcePasswordChange: false,
    lastLoginAt: '2026-07-05 17:34:27',
    roleCodes: ['overview_view'],
    roleNames: ['综合态势查看'],
    pageCodes: ['overview'],
    createdAt: '2026-07-02 11:18:00'
  }
];

const demoApprovals: IamApprovalTicketDto[] = [
  {
    id: 1001,
    ticketType: 'USER_DISABLE',
    targetType: 'USER',
    targetId: '12',
    targetLabel: '业务主题负责人',
    requesterUsername: 'sysadmin',
    reviewerUsername: 'secadmin',
    status: 'APPROVED',
    summary: '申请禁用离岗用户',
    reason: '人员岗位调整，需立即回收访问权限。',
    reviewComment: '已核验离岗流程，批准执行。',
    submittedAt: '2026-07-07 18:10:00',
    reviewedAt: '2026-07-07 18:22:00',
    executedAt: '2026-07-07 18:22:00'
  },
  {
    id: 1002,
    ticketType: 'USER_RESET_PASSWORD',
    targetType: 'USER',
    targetId: '11',
    targetLabel: '运维态势值班员',
    requesterUsername: 'sysadmin',
    reviewerUsername: null,
    status: 'PENDING',
    summary: '运维值班员口令重置',
    reason: '巡检交接，需重新下发临时口令。',
    reviewComment: null,
    submittedAt: '2026-07-08 08:20:00',
    reviewedAt: null,
    executedAt: null
  }
];

const demoLoginAudits: IamLoginAuditDto[] = [
  { id: 1, username: 'sysadmin', success: true, clientIp: '10.10.0.15', userAgent: 'Chrome / macOS', reason: null, loggedAt: '2026-07-08 10:21:36' },
  { id: 2, username: 'auditadmin', success: true, clientIp: '10.10.0.18', userAgent: 'Edge / Windows', reason: null, loggedAt: '2026-07-08 08:55:43' },
  { id: 3, username: 'ops.viewer', success: false, clientIp: '10.10.0.24', userAgent: 'Firefox / Ubuntu', reason: '用户名或密码错误', loggedAt: '2026-07-07 22:15:02' }
];

const demoOperationAudits: IamOperationAuditDto[] = [
  {
    id: 201,
    operatorUsername: 'sysadmin',
    operationType: 'SUBMIT_RESET_PASSWORD',
    targetType: 'USER',
    targetId: '11',
    targetLabel: '运维态势值班员',
    result: 'PENDING',
    traceId: 'trace-demo-201',
    detail: '{"ticketId":1002}',
    operatedAt: '2026-07-08 08:20:00'
  },
  {
    id: 202,
    operatorUsername: 'secadmin',
    operationType: 'APPROVE_USER_DISABLE',
    targetType: 'APPROVAL',
    targetId: '1001',
    targetLabel: '申请禁用离岗用户',
    result: 'SUCCESS',
    traceId: 'trace-demo-202',
    detail: '{"targetUserId":12}',
    operatedAt: '2026-07-07 18:22:00'
  }
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getDemoBootstrapStatus() {
  return clone(demoBootstrapStatus);
}

export function getDemoCurrentUser() {
  return clone(demoUser);
}

export function getDemoUsers() {
  return clone(demoUsers);
}

export function getDemoRoles() {
  return clone(demoRoles);
}

export function getDemoPermissions() {
  return clone(demoPermissions);
}

export function getDemoApprovals() {
  return clone(demoApprovals);
}

export function getDemoLoginAudits() {
  return clone(demoLoginAudits);
}

export function getDemoOperationAudits() {
  return clone(demoOperationAudits);
}
