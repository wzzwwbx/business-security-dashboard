package com.bss.dashboard.iam.repository;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.iam.domain.IamApprovalStatus;
import com.bss.dashboard.iam.domain.IamApprovalType;
import com.bss.dashboard.iam.domain.IamRoleType;
import com.bss.dashboard.iam.domain.IamUserStatus;
import com.bss.dashboard.iam.dto.IamApprovalTicketDto;
import com.bss.dashboard.iam.dto.IamLoginAuditDto;
import com.bss.dashboard.iam.dto.IamOperationAuditDto;
import com.bss.dashboard.iam.dto.IamPermissionDto;
import com.bss.dashboard.iam.dto.IamRoleDto;
import com.bss.dashboard.iam.dto.IamUserDto;
import com.bss.dashboard.iam.support.IamTimeFormats;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@Profile("mysql")
public class IamRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public IamRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public boolean isBootstrapInitialized() {
        Integer value = jdbcTemplate.queryForObject("SELECT initialized FROM iam_bootstrap_state WHERE id = 1", Integer.class);
        return value != null && value == 1;
    }

    public void ensureBootstrapStateRow() {
        jdbcTemplate.update("INSERT IGNORE INTO iam_bootstrap_state (id, initialized) VALUES (1, 0)");
    }

    public void ensureSessionPolicyRow(int maxFailedAttempts, int lockMinutes, int sessionTimeoutMinutes) {
        jdbcTemplate.update(
                "INSERT IGNORE INTO iam_session_policy (id, max_failed_attempts, lock_minutes, session_timeout_minutes) VALUES (1, ?, ?, ?)",
                maxFailedAttempts,
                lockMinutes,
                sessionTimeoutMinutes
        );
    }

    public void ensurePermission(String code, String resourceType, String actionCode, String description) {
        jdbcTemplate.update(
                "INSERT IGNORE INTO iam_permission (permission_code, resource_type, action_code, description) VALUES (?, ?, ?, ?)",
                code,
                resourceType,
                actionCode,
                description
        );
    }

    public void ensureRole(String roleCode, String roleName, IamRoleType roleType, String description) {
        jdbcTemplate.update(
                "INSERT IGNORE INTO iam_role (role_code, role_name, role_type, description, enabled) VALUES (?, ?, ?, ?, 1)",
                roleCode,
                roleName,
                roleType.name(),
                description
        );
    }

    public void ensureRolePermission(String roleCode, String permissionCode) {
        Long roleId = findRoleId(roleCode);
        Long permissionId = findPermissionId(permissionCode);
        jdbcTemplate.update(
                "INSERT IGNORE INTO iam_role_permission (role_id, permission_id) VALUES (?, ?)",
                roleId,
                permissionId
        );
    }

    public int countUsers() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM iam_user", Integer.class);
        return count == null ? 0 : count;
    }

    public boolean existsByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM iam_user WHERE username = ?", Integer.class, username);
        return count != null && count > 0;
    }

    @Transactional
    public void initializeBuiltInAdmins(String systemAdminUsername,
                                        String securityAdminUsername,
                                        String auditAdminUsername,
                                        String systemAdminPasswordHash,
                                        String securityAdminPasswordHash,
                                        String auditAdminPasswordHash) {
        createUser(systemAdminUsername, "系统管理员", true, systemAdminPasswordHash, List.of("sys_admin"));
        createUser(securityAdminUsername, "安全管理员", true, securityAdminPasswordHash, List.of("sec_admin"));
        createUser(auditAdminUsername, "审计管理员", true, auditAdminPasswordHash, List.of("audit_admin"));
        jdbcTemplate.update("UPDATE iam_bootstrap_state SET initialized = 1, initialized_at = CURRENT_TIMESTAMP WHERE id = 1");
    }

    @Transactional
    public Long createUser(String username, String displayName, boolean builtIn, String passwordHash, List<String> roleCodes) {
        jdbcTemplate.update(
                "INSERT INTO iam_user (username, display_name, status, built_in, force_password_change, failed_login_attempts) VALUES (?, ?, ?, ?, ?, 0)",
                username,
                displayName,
                IamUserStatus.ACTIVE.name(),
                builtIn ? 1 : 0,
                1
        );
        Long userId = jdbcTemplate.queryForObject("SELECT id FROM iam_user WHERE username = ?", Long.class, username);
        if (userId == null) {
            throw new IllegalStateException("创建用户失败");
        }
        upsertPassword(userId, passwordHash, true);
        replaceUserRoles(userId, roleCodes);
        return userId;
    }

    public Optional<AuthUserRecord> findAuthUser(String username) {
        List<AuthUserRecord> rows = jdbcTemplate.query(
                """
                SELECT u.id, u.username, u.display_name, u.status, u.built_in, u.force_password_change,
                       u.failed_login_attempts, u.locked_until, c.password_hash
                FROM iam_user u
                JOIN iam_password_credential c ON c.user_id = u.id
                WHERE u.username = ?
                """,
                (rs, rowNum) -> new AuthUserRecord(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("display_name"),
                        IamUserStatus.valueOf(rs.getString("status")),
                        rs.getBoolean("built_in"),
                        rs.getBoolean("force_password_change"),
                        rs.getInt("failed_login_attempts"),
                        toLocalDateTime(rs.getTimestamp("locked_until")),
                        rs.getString("password_hash")
                ),
                username
        );
        return rows.stream().findFirst();
    }

    public List<String> findAuthoritiesByUserId(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT DISTINCT p.permission_code
                FROM iam_permission p
                JOIN iam_role_permission rp ON rp.permission_id = p.id
                JOIN iam_user_role ur ON ur.role_id = rp.role_id
                JOIN iam_role r ON r.id = ur.role_id
                WHERE ur.user_id = ? AND r.enabled = 1
                ORDER BY p.permission_code
                """,
                (rs, rowNum) -> rs.getString(1),
                userId
        );
    }

    public CurrentUserRecord findCurrentUser(Long userId) {
        UserBaseRecord base = jdbcTemplate.query(
                "SELECT id, username, display_name, force_password_change FROM iam_user WHERE id = ?",
                (rs, rowNum) -> new UserBaseRecord(rs.getLong("id"), rs.getString("username"), rs.getString("display_name"), rs.getBoolean("force_password_change")),
                userId
        ).stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("当前登录用户不存在"));

        List<RoleAssignment> roles = findRolesForUsers(List.of(userId)).getOrDefault(userId, List.of());
        List<String> permissions = findAuthoritiesByUserId(userId);
        return new CurrentUserRecord(base, roles, permissions);
    }

    public List<IamUserDto> listUsers() {
        List<UserListRecord> users = jdbcTemplate.query(
                """
                SELECT id, username, display_name, status, built_in, force_password_change, last_login_at, created_at
                FROM iam_user
                ORDER BY built_in DESC, created_at ASC, id ASC
                """,
                (rs, rowNum) -> new UserListRecord(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("display_name"),
                        rs.getString("status"),
                        rs.getBoolean("built_in"),
                        rs.getBoolean("force_password_change"),
                        IamTimeFormats.format(rs.getTimestamp("last_login_at")),
                        IamTimeFormats.format(rs.getTimestamp("created_at"))
                )
        );
        Map<Long, List<RoleAssignment>> roleAssignments = findRolesForUsers(users.stream().map(UserListRecord::id).toList());
        return users.stream().map(user -> {
            List<RoleAssignment> roles = roleAssignments.getOrDefault(user.id(), List.of());
            return new IamUserDto(
                    user.id(),
                    user.username(),
                    user.displayName(),
                    user.status(),
                    user.builtIn(),
                    user.forcePasswordChange(),
                    user.lastLoginAt(),
                    roles.stream().map(RoleAssignment::roleCode).toList(),
                    roles.stream().map(RoleAssignment::roleName).toList(),
                    roles.stream().flatMap(item -> item.pageCodes().stream()).distinct().sorted().toList(),
                    user.createdAt()
            );
        }).toList();
    }

    public UserTargetRecord findUserTarget(Long userId) {
        return jdbcTemplate.query(
                "SELECT id, username, display_name, status, built_in FROM iam_user WHERE id = ?",
                (rs, rowNum) -> new UserTargetRecord(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("display_name"),
                        rs.getString("status"),
                        rs.getBoolean("built_in")
                ),
                userId
        ).stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    public void updateUserDisplayName(Long userId, String displayName) {
        int updated = jdbcTemplate.update("UPDATE iam_user SET display_name = ? WHERE id = ?", displayName, userId);
        if (updated == 0) {
            throw new ResourceNotFoundException("用户不存在");
        }
    }

    public void updateUserStatus(Long userId, IamUserStatus status) {
        int updated = jdbcTemplate.update(
                "UPDATE iam_user SET status = ?, locked_until = NULL, failed_login_attempts = CASE WHEN ? = 'ACTIVE' THEN 0 ELSE failed_login_attempts END WHERE id = ?",
                status.name(),
                status.name(),
                userId
        );
        if (updated == 0) {
            throw new ResourceNotFoundException("用户不存在");
        }
    }

    @Transactional
    public void replaceUserRoles(Long userId, List<String> roleCodes) {
        jdbcTemplate.update("DELETE FROM iam_user_role WHERE user_id = ?", userId);
        for (String roleCode : roleCodes) {
            Long roleId = findRoleId(roleCode);
            jdbcTemplate.update("INSERT IGNORE INTO iam_user_role (user_id, role_id) VALUES (?, ?)", userId, roleId);
        }
    }

    @Transactional
    public void upsertPassword(Long userId, String passwordHash, boolean forcePasswordChange) {
        jdbcTemplate.update(
                "INSERT INTO iam_password_history (user_id, password_hash) VALUES (?, ?)",
                userId,
                passwordHash
        );
        jdbcTemplate.update(
                """
                INSERT INTO iam_password_credential (user_id, password_hash, hash_algorithm)
                VALUES (?, ?, 'bcrypt')
                ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), hash_algorithm = VALUES(hash_algorithm), changed_at = CURRENT_TIMESTAMP
                """,
                userId,
                passwordHash
        );
        jdbcTemplate.update(
                "UPDATE iam_user SET force_password_change = ?, status = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?",
                forcePasswordChange ? 1 : 0,
                IamUserStatus.ACTIVE.name(),
                userId
        );
    }

    public void clearForcePasswordChange(Long userId) {
        jdbcTemplate.update("UPDATE iam_user SET force_password_change = 0 WHERE id = ?", userId);
    }

    public void markLoginSuccess(Long userId, String sessionId, String clientIp, String userAgent) {
        jdbcTemplate.update(
                "UPDATE iam_user SET failed_login_attempts = 0, locked_until = NULL, status = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
                IamUserStatus.ACTIVE.name(),
                userId
        );
        jdbcTemplate.update(
                "INSERT INTO iam_login_audit (user_id, username, login_success, session_id, client_ip, user_agent, logged_at) SELECT id, username, 1, ?, ?, ?, CURRENT_TIMESTAMP FROM iam_user WHERE id = ?",
                sessionId,
                clientIp,
                trim(userAgent, 255),
                userId
        );
    }

    public void markLoginFailure(String username, Long userId, String clientIp, String userAgent, String reason, int maxFailedAttempts, int lockMinutes) {
        if (userId != null) {
            AuthUserRecord user = findAuthUser(username).orElse(null);
            if (user != null) {
                int nextFailed = user.failedLoginAttempts() + 1;
                if (nextFailed >= maxFailedAttempts) {
                    jdbcTemplate.update(
                            "UPDATE iam_user SET failed_login_attempts = ?, locked_until = ?, status = ? WHERE id = ?",
                            nextFailed,
                            Timestamp.valueOf(LocalDateTime.now().plusMinutes(lockMinutes)),
                            IamUserStatus.LOCKED.name(),
                            userId
                    );
                } else {
                    jdbcTemplate.update("UPDATE iam_user SET failed_login_attempts = ? WHERE id = ?", nextFailed, userId);
                }
            }
        }
        jdbcTemplate.update(
                "INSERT INTO iam_login_audit (user_id, username, login_success, client_ip, user_agent, failure_reason, logged_at) VALUES (?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP)",
                userId,
                username,
                clientIp,
                trim(userAgent, 255),
                reason
        );
    }

    public void insertOperationAudit(Long operatorUserId,
                                     String operatorUsername,
                                     String operationType,
                                     String targetType,
                                     String targetId,
                                     String targetLabel,
                                     String resultStatus,
                                     String traceId,
                                     Object detail) {
        jdbcTemplate.update(
                "INSERT INTO iam_operation_audit (operator_user_id, operator_username, operation_type, target_type, target_id, target_label, result_status, trace_id, detail_json, operated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                operatorUserId,
                operatorUsername,
                operationType,
                targetType,
                targetId,
                trim(targetLabel, 255),
                resultStatus,
                traceId,
                toJson(detail)
        );
    }

    @Transactional
    public Long createApprovalTicket(IamApprovalType ticketType,
                                     String targetType,
                                     String targetId,
                                     String targetLabel,
                                     Long requesterUserId,
                                     String summary,
                                     String reason,
                                     Object payload) {
        jdbcTemplate.update(
                "INSERT INTO iam_approval_ticket (ticket_type, target_type, target_id, target_label, requester_user_id, status, summary, reason, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                ticketType.name(),
                targetType,
                targetId,
                trim(targetLabel, 255),
                requesterUserId,
                IamApprovalStatus.PENDING.name(),
                trim(summary, 255),
                trim(reason, 255)
        );
        Long ticketId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (ticketId == null) {
            throw new IllegalStateException("创建审批单失败");
        }
        jdbcTemplate.update(
                "INSERT INTO iam_approval_payload (ticket_id, payload_json) VALUES (?, ?)",
                ticketId,
                toJson(payload)
        );
        return ticketId;
    }

    public ApprovalTicketRecord findApprovalTicket(Long ticketId) {
        return jdbcTemplate.query(
                """
                SELECT t.id, t.ticket_type, t.target_type, t.target_id, t.target_label, t.status, t.summary, t.reason, t.review_comment,
                       t.submitted_at, t.reviewed_at, t.executed_at,
                       requester.username AS requester_username,
                       reviewer.username AS reviewer_username,
                       t.requester_user_id, t.reviewer_user_id
                FROM iam_approval_ticket t
                JOIN iam_user requester ON requester.id = t.requester_user_id
                LEFT JOIN iam_user reviewer ON reviewer.id = t.reviewer_user_id
                WHERE t.id = ?
                """,
                (rs, rowNum) -> new ApprovalTicketRecord(
                        rs.getLong("id"),
                        IamApprovalType.valueOf(rs.getString("ticket_type")),
                        rs.getString("target_type"),
                        rs.getString("target_id"),
                        rs.getString("target_label"),
                        IamApprovalStatus.valueOf(rs.getString("status")),
                        rs.getString("summary"),
                        rs.getString("reason"),
                        rs.getString("review_comment"),
                        IamTimeFormats.format(rs.getTimestamp("submitted_at")),
                        IamTimeFormats.format(rs.getTimestamp("reviewed_at")),
                        IamTimeFormats.format(rs.getTimestamp("executed_at")),
                        rs.getString("requester_username"),
                        rs.getString("reviewer_username"),
                        rs.getLong("requester_user_id"),
                        rs.getObject("reviewer_user_id") == null ? null : rs.getLong("reviewer_user_id")
                ),
                ticketId
        ).stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("审批单不存在"));
    }

    public Map<String, Object> findApprovalPayload(Long ticketId) {
        String json = jdbcTemplate.query(
                "SELECT payload_json FROM iam_approval_payload WHERE ticket_id = ?",
                (rs, rowNum) -> rs.getString(1),
                ticketId
        ).stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("审批单载荷不存在"));
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("解析审批单载荷失败", exception);
        }
    }

    public void approveTicket(Long ticketId, Long reviewerUserId, String reviewComment) {
        int updated = jdbcTemplate.update(
                "UPDATE iam_approval_ticket SET status = ?, reviewer_user_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP, executed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?",
                IamApprovalStatus.APPROVED.name(),
                reviewerUserId,
                trim(reviewComment, 255),
                ticketId,
                IamApprovalStatus.PENDING.name()
        );
        if (updated == 0) {
            throw new IllegalStateException("审批单当前状态不允许批准");
        }
    }

    public void rejectTicket(Long ticketId, Long reviewerUserId, String reviewComment) {
        int updated = jdbcTemplate.update(
                "UPDATE iam_approval_ticket SET status = ?, reviewer_user_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?",
                IamApprovalStatus.REJECTED.name(),
                reviewerUserId,
                trim(reviewComment, 255),
                ticketId,
                IamApprovalStatus.PENDING.name()
        );
        if (updated == 0) {
            throw new IllegalStateException("审批单当前状态不允许驳回");
        }
    }

    public List<IamApprovalTicketDto> listApprovalTickets() {
        return jdbcTemplate.query(
                """
                SELECT t.id, t.ticket_type, t.target_type, t.target_id, t.target_label, t.status, t.summary, t.reason, t.review_comment,
                       t.submitted_at, t.reviewed_at, t.executed_at,
                       requester.username AS requester_username,
                       reviewer.username AS reviewer_username
                FROM iam_approval_ticket t
                JOIN iam_user requester ON requester.id = t.requester_user_id
                LEFT JOIN iam_user reviewer ON reviewer.id = t.reviewer_user_id
                ORDER BY FIELD(t.status, 'PENDING', 'APPROVED', 'REJECTED'), t.submitted_at DESC, t.id DESC
                """,
                (rs, rowNum) -> new IamApprovalTicketDto(
                        rs.getLong("id"),
                        rs.getString("ticket_type"),
                        rs.getString("target_type"),
                        rs.getString("target_id"),
                        rs.getString("target_label"),
                        rs.getString("requester_username"),
                        rs.getString("reviewer_username"),
                        rs.getString("status"),
                        rs.getString("summary"),
                        rs.getString("reason"),
                        rs.getString("review_comment"),
                        IamTimeFormats.format(rs.getTimestamp("submitted_at")),
                        IamTimeFormats.format(rs.getTimestamp("reviewed_at")),
                        IamTimeFormats.format(rs.getTimestamp("executed_at"))
                )
        );
    }

    public List<IamRoleDto> listRoles() {
        List<RoleBaseRecord> roles = jdbcTemplate.query(
                "SELECT id, role_code, role_name, role_type, description, enabled FROM iam_role ORDER BY FIELD(role_type, 'BUILT_IN', 'TEMPLATE'), id ASC",
                (rs, rowNum) -> new RoleBaseRecord(
                        rs.getLong("id"),
                        rs.getString("role_code"),
                        rs.getString("role_name"),
                        rs.getString("role_type"),
                        rs.getString("description"),
                        rs.getBoolean("enabled")
                )
        );
        Map<Long, List<String>> permissionsByRoleId = findPermissionsByRoleIds(roles.stream().map(RoleBaseRecord::id).toList());
        return roles.stream().map(role -> {
            List<String> permissions = permissionsByRoleId.getOrDefault(role.id(), List.of());
            return new IamRoleDto(
                    role.code(),
                    role.name(),
                    role.type(),
                    role.enabled(),
                    role.description(),
                    permissions,
                    permissions.stream().filter(item -> item.startsWith("page:") && item.endsWith(":view")).map(item -> item.split(":")[1]).distinct().sorted().toList()
            );
        }).toList();
    }

    public List<IamPermissionDto> listPermissions() {
        return jdbcTemplate.query(
                "SELECT permission_code, resource_type, action_code, description FROM iam_permission ORDER BY permission_code",
                (rs, rowNum) -> new IamPermissionDto(
                        rs.getString("permission_code"),
                        rs.getString("resource_type"),
                        rs.getString("action_code"),
                        rs.getString("description")
                )
        );
    }

    public List<IamLoginAuditDto> listLoginAudits(int limit) {
        return jdbcTemplate.query(
                "SELECT id, username, login_success, client_ip, user_agent, failure_reason, logged_at FROM iam_login_audit ORDER BY logged_at DESC, id DESC LIMIT ?",
                (rs, rowNum) -> new IamLoginAuditDto(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getBoolean("login_success"),
                        rs.getString("client_ip"),
                        rs.getString("user_agent"),
                        rs.getString("failure_reason"),
                        IamTimeFormats.format(rs.getTimestamp("logged_at"))
                ),
                limit
        );
    }

    public List<IamOperationAuditDto> listOperationAudits(int limit) {
        return jdbcTemplate.query(
                "SELECT id, operator_username, operation_type, target_type, target_id, target_label, result_status, trace_id, detail_json, operated_at FROM iam_operation_audit ORDER BY operated_at DESC, id DESC LIMIT ?",
                (rs, rowNum) -> new IamOperationAuditDto(
                        rs.getLong("id"),
                        rs.getString("operator_username"),
                        rs.getString("operation_type"),
                        rs.getString("target_type"),
                        rs.getString("target_id"),
                        rs.getString("target_label"),
                        rs.getString("result_status"),
                        rs.getString("trace_id"),
                        rs.getString("detail_json"),
                        IamTimeFormats.format(rs.getTimestamp("operated_at"))
                ),
                limit
        );
    }

    public List<String> findRoleCodesByUserId(Long userId) {
        return findRolesForUsers(List.of(userId)).getOrDefault(userId, List.of()).stream().map(RoleAssignment::roleCode).toList();
    }

    public boolean roleExists(String roleCode) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM iam_role WHERE role_code = ? AND enabled = 1", Integer.class, roleCode);
        return count != null && count > 0;
    }

    public Optional<String> findUserPasswordHash(Long userId) {
        return jdbcTemplate.query(
                "SELECT password_hash FROM iam_password_credential WHERE user_id = ?",
                (rs, rowNum) -> rs.getString(1),
                userId
        ).stream().findFirst();
    }

    private Long findRoleId(String roleCode) {
        return jdbcTemplate.queryForObject("SELECT id FROM iam_role WHERE role_code = ?", Long.class, roleCode);
    }

    private Long findPermissionId(String permissionCode) {
        return jdbcTemplate.queryForObject("SELECT id FROM iam_permission WHERE permission_code = ?", Long.class, permissionCode);
    }

    private Map<Long, List<RoleAssignment>> findRolesForUsers(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        String placeholders = userIds.stream().map(item -> "?").collect(Collectors.joining(","));
        List<RoleJoinRecord> rows = jdbcTemplate.query(
                """
                SELECT ur.user_id, r.role_code, r.role_name, p.permission_code
                FROM iam_user_role ur
                JOIN iam_role r ON r.id = ur.role_id
                LEFT JOIN iam_role_permission rp ON rp.role_id = r.id
                LEFT JOIN iam_permission p ON p.id = rp.permission_id
                WHERE ur.user_id IN (%s)
                ORDER BY ur.user_id, r.id, p.permission_code
                """.formatted(placeholders),
                userIds.toArray(),
                (rs, rowNum) -> new RoleJoinRecord(
                        rs.getLong("user_id"),
                        rs.getString("role_code"),
                        rs.getString("role_name"),
                        rs.getString("permission_code")
                )
        );
        Map<Long, LinkedHashMap<String, MutableRoleAssignment>> grouped = new LinkedHashMap<>();
        for (RoleJoinRecord row : rows) {
            grouped.computeIfAbsent(row.userId(), key -> new LinkedHashMap<>());
            MutableRoleAssignment assignment = grouped.get(row.userId()).computeIfAbsent(
                    row.roleCode(),
                    key -> new MutableRoleAssignment(row.roleCode(), row.roleName())
            );
            if (row.permissionCode() != null && row.permissionCode().startsWith("page:") && row.permissionCode().endsWith(":view")) {
                assignment.pageCodes.add(row.permissionCode().split(":")[1]);
            }
        }
        Map<Long, List<RoleAssignment>> result = new LinkedHashMap<>();
        grouped.forEach((userId, roleMap) -> result.put(userId, roleMap.values().stream().map(MutableRoleAssignment::toImmutable).toList()));
        return result;
    }

    private Map<Long, List<String>> findPermissionsByRoleIds(List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            return Map.of();
        }
        String placeholders = roleIds.stream().map(item -> "?").collect(Collectors.joining(","));
        List<RolePermissionJoin> rows = jdbcTemplate.query(
                """
                SELECT rp.role_id, p.permission_code
                FROM iam_role_permission rp
                JOIN iam_permission p ON p.id = rp.permission_id
                WHERE rp.role_id IN (%s)
                ORDER BY rp.role_id, p.permission_code
                """.formatted(placeholders),
                roleIds.toArray(),
                (rs, rowNum) -> new RolePermissionJoin(rs.getLong("role_id"), rs.getString("permission_code"))
        );
        Map<Long, List<String>> result = new LinkedHashMap<>();
        for (RolePermissionJoin row : rows) {
            result.computeIfAbsent(row.roleId(), key -> new ArrayList<>()).add(row.permissionCode());
        }
        return result;
    }

    private LocalDateTime toLocalDateTime(Timestamp value) {
        return value == null ? null : value.toLocalDateTime();
    }

    private String trim(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Collections.emptyMap() : value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("JSON 序列化失败", exception);
        }
    }

    public record AuthUserRecord(
            Long id,
            String username,
            String displayName,
            IamUserStatus status,
            boolean builtIn,
            boolean forcePasswordChange,
            int failedLoginAttempts,
            LocalDateTime lockedUntil,
            String passwordHash
    ) {
    }

    public record CurrentUserRecord(UserBaseRecord base, List<RoleAssignment> roles, List<String> permissions) {
    }

    public record UserBaseRecord(Long id, String username, String displayName, boolean forcePasswordChange) {
    }

    public record UserTargetRecord(Long id, String username, String displayName, String status, boolean builtIn) {
    }

    private record UserListRecord(
            Long id,
            String username,
            String displayName,
            String status,
            boolean builtIn,
            boolean forcePasswordChange,
            String lastLoginAt,
            String createdAt
    ) {
    }

    public record RoleAssignment(String roleCode, String roleName, List<String> pageCodes) {
    }

    private static final class MutableRoleAssignment {
        private final String roleCode;
        private final String roleName;
        private final Set<String> pageCodes = new LinkedHashSet<>();

        private MutableRoleAssignment(String roleCode, String roleName) {
            this.roleCode = roleCode;
            this.roleName = roleName;
        }

        private RoleAssignment toImmutable() {
            return new RoleAssignment(roleCode, roleName, pageCodes.stream().sorted().toList());
        }
    }

    private record RoleJoinRecord(Long userId, String roleCode, String roleName, String permissionCode) {
    }

    private record RolePermissionJoin(Long roleId, String permissionCode) {
    }

    private record RoleBaseRecord(Long id, String code, String name, String type, String description, boolean enabled) {
    }

    public record ApprovalTicketRecord(
            Long id,
            IamApprovalType ticketType,
            String targetType,
            String targetId,
            String targetLabel,
            IamApprovalStatus status,
            String summary,
            String reason,
            String reviewComment,
            String submittedAt,
            String reviewedAt,
            String executedAt,
            String requesterUsername,
            String reviewerUsername,
            Long requesterUserId,
            Long reviewerUserId
    ) {
    }
}
