package com.bss.dashboard.iam.service;

import com.bss.dashboard.iam.config.IamProperties;
import com.bss.dashboard.iam.domain.IamUserStatus;
import com.bss.dashboard.iam.dto.ChangePasswordRequest;
import com.bss.dashboard.iam.dto.CurrentUserDto;
import com.bss.dashboard.iam.dto.LoginRequest;
import com.bss.dashboard.iam.repository.IamRepository;
import com.bss.dashboard.iam.security.SessionPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Profile("mysql")
public class IamAuthService {

    private final IamRepository repository;
    private final IamProperties properties;
    private final PasswordEncoder passwordEncoder;

    public IamAuthService(IamRepository repository, IamProperties properties, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.properties = properties;
        this.passwordEncoder = passwordEncoder;
    }

    public CurrentUserDto login(LoginRequest requestBody, HttpServletRequest request, HttpServletResponse response) {
        IamRepository.AuthUserRecord user = repository.findAuthUser(requestBody.username())
                .orElseThrow(() -> loginFailure(requestBody.username(), null, request, "用户名或密码错误"));

        if (user.status() == IamUserStatus.DISABLED) {
            throw loginFailure(user.username(), user.id(), request, "账号已被禁用");
        }
        if (user.lockedUntil() != null && user.lockedUntil().isAfter(LocalDateTime.now())) {
            throw loginFailure(user.username(), user.id(), request, "账号已被锁定，请稍后再试");
        }
        if (!passwordEncoder.matches(requestBody.password(), user.passwordHash())) {
            throw loginFailure(user.username(), user.id(), request, "用户名或密码错误");
        }

        List<String> authorities = repository.findAuthoritiesByUserId(user.id());
        SessionPrincipal principal = new SessionPrincipal(user.id(), user.username(), user.displayName(), user.forcePasswordChange());
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                authorities.stream().map(SimpleGrantedAuthority::new).toList()
        );
        SecurityContext securityContext = new SecurityContextImpl(authentication);
        SecurityContextHolder.setContext(securityContext);
        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
        repository.markLoginSuccess(user.id(), session.getId(), clientIp(request), userAgent(request));
        repository.insertOperationAudit(user.id(), user.username(), "LOGIN", "SESSION", session.getId(), user.displayName(), "SUCCESS", UUID.randomUUID().toString(), List.of("LOGIN_SUCCESS"));
        return me(authentication);
    }

    public void logout(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof SessionPrincipal principal) {
            repository.insertOperationAudit(principal.userId(), principal.username(), "LOGOUT", "SESSION", request.getSession(false) == null ? "n/a" : request.getSession(false).getId(), principal.displayName(), "SUCCESS", UUID.randomUUID().toString(), List.of("LOGOUT"));
        }
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    public CurrentUserDto me(Authentication authentication) {
        SessionPrincipal principal = extractPrincipal(authentication);
        IamRepository.CurrentUserRecord record = repository.findCurrentUser(principal.userId());
        List<String> pagePermissions = record.permissions().stream().filter(item -> item.startsWith("page:")).toList();
        List<String> actionPermissions = record.permissions().stream().filter(item -> !item.startsWith("page:")).toList();
        List<String> pageCodes = pagePermissions.stream().map(item -> item.split(":")[1]).distinct().sorted().toList();
        return new CurrentUserDto(
                record.base().id(),
                record.base().username(),
                record.base().displayName(),
                record.base().forcePasswordChange(),
                record.roles().stream().map(IamRepository.RoleAssignment::roleCode).toList(),
                record.roles().stream().map(IamRepository.RoleAssignment::roleName).toList(),
                pagePermissions,
                actionPermissions,
                pageCodes
        );
    }

    public CurrentUserDto meRequired() {
        return me(SecurityContextHolder.getContext().getAuthentication());
    }

    public void changePassword(ChangePasswordRequest requestBody) {
        SessionPrincipal principal = extractPrincipal(SecurityContextHolder.getContext().getAuthentication());
        String passwordHash = repository.findUserPasswordHash(principal.userId())
                .orElseThrow(() -> new IllegalStateException("当前用户缺少密码凭据"));
        if (!passwordEncoder.matches(requestBody.currentPassword(), passwordHash)) {
            throw new IllegalArgumentException("当前密码校验失败");
        }
        repository.upsertPassword(principal.userId(), passwordEncoder.encode(requestBody.newPassword()), false);
        repository.clearForcePasswordChange(principal.userId());
        repository.insertOperationAudit(principal.userId(), principal.username(), "CHANGE_PASSWORD", "USER", principal.userId().toString(), principal.displayName(), "SUCCESS", UUID.randomUUID().toString(), List.of("SELF_SERVICE"));
    }

    public SessionPrincipal extractPrincipal(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof SessionPrincipal principal)) {
            throw new IllegalStateException("当前会话未登录");
        }
        return principal;
    }

    private IllegalArgumentException loginFailure(String username, Long userId, HttpServletRequest request, String reason) {
        repository.markLoginFailure(
                username,
                userId,
                clientIp(request),
                userAgent(request),
                reason,
                properties.getLogin().getMaxFailedAttempts(),
                properties.getLogin().getLockMinutes()
        );
        return new IllegalArgumentException(reason);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String userAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
