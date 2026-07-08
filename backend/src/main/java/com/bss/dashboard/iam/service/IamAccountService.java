package com.bss.dashboard.iam.service;

import com.bss.dashboard.iam.domain.IamApprovalType;
import com.bss.dashboard.iam.dto.BindRolesRequest;
import com.bss.dashboard.iam.dto.CreateUserRequest;
import com.bss.dashboard.iam.dto.IamActionResultDto;
import com.bss.dashboard.iam.dto.IamUserDto;
import com.bss.dashboard.iam.dto.ResetPasswordRequest;
import com.bss.dashboard.iam.dto.UpdateUserRequest;
import com.bss.dashboard.iam.repository.IamRepository;
import com.bss.dashboard.iam.security.SessionPrincipal;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Profile("mysql")
public class IamAccountService {

    private final IamRepository repository;
    private final IamAuthService authService;
    private final PasswordEncoder passwordEncoder;

    public IamAccountService(IamRepository repository, IamAuthService authService, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    public List<IamUserDto> listUsers() {
        return repository.listUsers();
    }

    @Transactional
    public IamActionResultDto createUser(CreateUserRequest request) {
        SessionPrincipal principal = authService.extractPrincipal(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
        if (repository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("用户名已存在");
        }
        validateRoles(request.roleCodes());
        Long userId = repository.createUser(request.username(), request.displayName(), false, passwordEncoder.encode(request.password()), request.roleCodes());
        repository.insertOperationAudit(principal.userId(), principal.username(), "CREATE_USER", "USER", userId.toString(), request.displayName(), "SUCCESS", UUID.randomUUID().toString(), Map.of("roleCodes", request.roleCodes()));
        return new IamActionResultDto("CREATE_USER", "SUCCESS", userId, null, "用户已创建，首次登录需修改密码");
    }

    public IamActionResultDto updateUser(Long userId, UpdateUserRequest request) {
        SessionPrincipal principal = authService.extractPrincipal(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
        IamRepository.UserTargetRecord target = repository.findUserTarget(userId);
        repository.updateUserDisplayName(userId, request.displayName());
        repository.insertOperationAudit(principal.userId(), principal.username(), "UPDATE_USER", "USER", userId.toString(), target.displayName(), "SUCCESS", UUID.randomUUID().toString(), Map.of("displayName", request.displayName()));
        return new IamActionResultDto("UPDATE_USER", "SUCCESS", userId, null, "用户资料已更新");
    }

    public IamActionResultDto requestDisable(Long userId) {
        return requestStatusChange(userId, IamApprovalType.USER_DISABLE, "申请禁用用户", "DISABLED");
    }

    public IamActionResultDto requestEnable(Long userId) {
        return requestStatusChange(userId, IamApprovalType.USER_ENABLE, "申请启用用户", "ACTIVE");
    }

    public IamActionResultDto requestResetPassword(Long userId, ResetPasswordRequest request) {
        SessionPrincipal principal = authService.extractPrincipal(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
        IamRepository.UserTargetRecord target = repository.findUserTarget(userId);
        Long ticketId = repository.createApprovalTicket(
                IamApprovalType.USER_RESET_PASSWORD,
                "USER",
                userId.toString(),
                target.displayName(),
                principal.userId(),
                "申请重置账号密码",
                request.reason(),
                Map.of(
                        "userId", userId,
                        "passwordHash", passwordEncoder.encode(request.tempPassword()),
                        "forcePasswordChange", true
                )
        );
        repository.insertOperationAudit(principal.userId(), principal.username(), "SUBMIT_RESET_PASSWORD", "USER", userId.toString(), target.displayName(), "PENDING", UUID.randomUUID().toString(), Map.of("ticketId", ticketId));
        return new IamActionResultDto("RESET_PASSWORD", "PENDING_APPROVAL", userId, ticketId, "密码重置申请已提交，待安全管理员审批");
    }

    public IamActionResultDto requestBindRoles(Long userId, BindRolesRequest request) {
        SessionPrincipal principal = authService.extractPrincipal(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
        IamRepository.UserTargetRecord target = repository.findUserTarget(userId);
        validateRoles(request.roleCodes());
        Long ticketId = repository.createApprovalTicket(
                IamApprovalType.USER_ROLE_REBIND,
                "USER",
                userId.toString(),
                target.displayName(),
                principal.userId(),
                "申请调整账号角色",
                request.reason(),
                Map.of(
                        "userId", userId,
                        "roleCodes", request.roleCodes()
                )
        );
        repository.insertOperationAudit(principal.userId(), principal.username(), "SUBMIT_BIND_ROLE", "USER", userId.toString(), target.displayName(), "PENDING", UUID.randomUUID().toString(), Map.of("ticketId", ticketId, "roleCodes", request.roleCodes()));
        return new IamActionResultDto("BIND_ROLE", "PENDING_APPROVAL", userId, ticketId, "角色调整申请已提交，待安全管理员审批");
    }

    private IamActionResultDto requestStatusChange(Long userId, IamApprovalType ticketType, String summary, String targetStatus) {
        SessionPrincipal principal = authService.extractPrincipal(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
        IamRepository.UserTargetRecord target = repository.findUserTarget(userId);
        Long ticketId = repository.createApprovalTicket(
                ticketType,
                "USER",
                userId.toString(),
                target.displayName(),
                principal.userId(),
                summary,
                summary,
                Map.of(
                        "userId", userId,
                        "status", targetStatus
                )
        );
        repository.insertOperationAudit(principal.userId(), principal.username(), "SUBMIT_" + ticketType.name(), "USER", userId.toString(), target.displayName(), "PENDING", UUID.randomUUID().toString(), Map.of("ticketId", ticketId, "targetStatus", targetStatus));
        return new IamActionResultDto(ticketType.name(), "PENDING_APPROVAL", userId, ticketId, "关键操作申请已提交，待安全管理员审批");
    }

    private void validateRoles(List<String> roleCodes) {
        for (String roleCode : roleCodes) {
            if (!repository.roleExists(roleCode)) {
                throw new IllegalArgumentException("角色不存在或已停用: " + roleCode);
            }
        }
    }
}
