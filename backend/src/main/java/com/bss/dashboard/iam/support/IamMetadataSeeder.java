package com.bss.dashboard.iam.support;

import com.bss.dashboard.iam.config.IamProperties;
import com.bss.dashboard.iam.domain.IamBuiltinRoleCodes;
import com.bss.dashboard.iam.domain.IamRoleType;
import com.bss.dashboard.iam.repository.IamRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("mysql")
public class IamMetadataSeeder implements ApplicationRunner {

    private final IamRepository repository;
    private final IamProperties properties;

    public IamMetadataSeeder(IamRepository repository, IamProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        repository.ensureBootstrapStateRow();
        repository.ensureSessionPolicyRow(
                properties.getLogin().getMaxFailedAttempts(),
                properties.getLogin().getLockMinutes(),
                30
        );

        ensurePermissions();
        ensureRoles();
        ensureRolePermissions();
    }

    private void ensurePermissions() {
        repository.ensurePermission("page:overview:view", "page", "view", "查看综合态势页面");
        repository.ensurePermission("page:security:view", "page", "view", "查看安全态势页面");
        repository.ensurePermission("page:business:view", "page", "view", "查看业务态势页面");
        repository.ensurePermission("page:terminal:view", "page", "view", "查看终端态势页面");
        repository.ensurePermission("page:ops:view", "page", "view", "查看运维态势页面");
        repository.ensurePermission("page:system:view", "page", "view", "查看系统管理页面");

        repository.ensurePermission("account:view", "account", "view", "查看账号列表与详情");
        repository.ensurePermission("account:create", "account", "create", "创建账号");
        repository.ensurePermission("account:update", "account", "update", "修改账号基础资料");
        repository.ensurePermission("account:disable", "account", "disable", "申请禁用账号");
        repository.ensurePermission("account:enable", "account", "enable", "申请启用账号");
        repository.ensurePermission("account:reset-password", "account", "reset-password", "申请重置账号密码");
        repository.ensurePermission("account:bind-role", "account", "bind-role", "申请调整账号角色");
        repository.ensurePermission("role:view", "role", "view", "查看角色与权限矩阵");
        repository.ensurePermission("approval:view", "approval", "view", "查看审批单");
        repository.ensurePermission("approval:submit", "approval", "submit", "提交审批单");
        repository.ensurePermission("approval:review", "approval", "review", "审批关键操作");
        repository.ensurePermission("audit:view", "audit", "view", "查看审计日志");
        repository.ensurePermission("audit:export", "audit", "export", "导出审计日志");
        repository.ensurePermission("policy:update", "policy", "update", "修改安全策略");
        repository.ensurePermission("source-agent:update", "source-agent", "update", "修改探针与接入端凭据");
    }

    private void ensureRoles() {
        repository.ensureRole(IamBuiltinRoleCodes.SYSTEM_ADMIN, "系统管理员", IamRoleType.BUILT_IN, "负责账户创建、启停用、密码初始化与基础维护");
        repository.ensureRole(IamBuiltinRoleCodes.SECURITY_ADMIN, "安全管理员", IamRoleType.BUILT_IN, "负责授权策略、角色分配与关键操作审批");
        repository.ensureRole(IamBuiltinRoleCodes.AUDIT_ADMIN, "审计管理员", IamRoleType.BUILT_IN, "负责登录审计、操作审计与审批留痕核查");
        repository.ensureRole(IamBuiltinRoleCodes.OVERVIEW_VIEW, "综合态势查看", IamRoleType.TEMPLATE, "查看综合态势大盘");
        repository.ensureRole(IamBuiltinRoleCodes.SECURITY_VIEW, "安全态势查看", IamRoleType.TEMPLATE, "查看安全态势大盘");
        repository.ensureRole(IamBuiltinRoleCodes.BUSINESS_VIEW, "业务态势查看", IamRoleType.TEMPLATE, "查看业务态势大盘");
        repository.ensureRole(IamBuiltinRoleCodes.TERMINAL_VIEW, "终端态势查看", IamRoleType.TEMPLATE, "查看终端态势大盘");
        repository.ensureRole(IamBuiltinRoleCodes.OPS_VIEW, "运维态势查看", IamRoleType.TEMPLATE, "查看运维态势大盘");
    }

    private void ensureRolePermissions() {
        List<String> pagePermissions = List.of(
                "page:overview:view",
                "page:security:view",
                "page:business:view",
                "page:terminal:view",
                "page:ops:view"
        );

        for (String permission : pagePermissions) {
            repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, permission);
            repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, permission);
            repository.ensureRolePermission(IamBuiltinRoleCodes.AUDIT_ADMIN, permission);
        }

        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "page:system:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "account:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "account:create");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "account:update");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "account:disable");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "account:enable");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "account:reset-password");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "approval:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "approval:submit");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SYSTEM_ADMIN, "role:view");

        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "page:system:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "account:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "account:bind-role");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "approval:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "approval:review");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "role:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "policy:update");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_ADMIN, "source-agent:update");

        repository.ensureRolePermission(IamBuiltinRoleCodes.AUDIT_ADMIN, "page:system:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.AUDIT_ADMIN, "approval:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.AUDIT_ADMIN, "audit:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.AUDIT_ADMIN, "audit:export");
        repository.ensureRolePermission(IamBuiltinRoleCodes.AUDIT_ADMIN, "role:view");

        repository.ensureRolePermission(IamBuiltinRoleCodes.OVERVIEW_VIEW, "page:overview:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.SECURITY_VIEW, "page:security:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.BUSINESS_VIEW, "page:business:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.TERMINAL_VIEW, "page:terminal:view");
        repository.ensureRolePermission(IamBuiltinRoleCodes.OPS_VIEW, "page:ops:view");
    }
}
