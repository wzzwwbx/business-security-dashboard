package com.bss.dashboard.terminal.repository;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.terminal.domain.TerminalDeviceStatus;
import com.bss.dashboard.terminal.domain.TerminalOwnershipStatus;
import com.bss.dashboard.terminal.domain.TerminalRiskLevel;
import com.bss.dashboard.terminal.domain.TerminalSourceType;
import com.bss.dashboard.terminal.dto.TerminalBindingDto;
import com.bss.dashboard.terminal.dto.TerminalDeviceDetailDto;
import com.bss.dashboard.terminal.dto.TerminalDevicePayload;
import com.bss.dashboard.terminal.dto.TerminalDeviceSummaryDto;
import com.bss.dashboard.terminal.dto.TerminalEventDto;
import com.bss.dashboard.terminal.dto.TerminalEventPayload;
import com.bss.dashboard.terminal.dto.TerminalPeripheralEventDto;
import com.bss.dashboard.terminal.dto.TerminalPeripheralPayload;
import com.bss.dashboard.terminal.dto.TerminalSecurityPayload;
import com.bss.dashboard.terminal.dto.TerminalSoftwareChangeDto;
import com.bss.dashboard.terminal.dto.TerminalSoftwareChangePayload;
import com.bss.dashboard.terminal.dto.TerminalSourceDto;
import com.bss.dashboard.terminal.dto.TerminalTimeseriesPointDto;
import com.bss.dashboard.terminal.support.TerminalTimeFormats;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * 终端域数据访问层。
 *
 * <p>约束：</p>
 * <ul>
 *     <li>仅负责数据库读写与对象映射</li>
 *     <li>人员归一顺序遵循 person_profile / person_phone 规则</li>
 *     <li>不在仓储层堆叠跨领域业务规则</li>
 * </ul>
 */
@Repository
@Profile("mysql")
public class TerminalRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public TerminalRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate, "jdbcTemplate must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
    }

    /**
     * 确保人员主数据存在。
     *
     * @param personCode 人员编码
     * @param externalPersonId 外部人员编码
     * @param employeeNo 工号
     * @param fullName 姓名
     * @param displayName 展示名
     * @param departmentName 部门
     * @param organizationPath 组织路径
     * @param jobTitle 岗位
     * @param email 邮箱
     * @param sourceSystem 来源系统
     */
    public void ensurePersonProfile(String personCode, String externalPersonId, String employeeNo, String fullName,
                                    String displayName, String departmentName, String organizationPath,
                                    String jobTitle, String email, String sourceSystem) {
        Long personId = findPersonIdByCode(personCode).orElse(null);
        if (personId == null) {
            jdbcTemplate.update(
                    """
                    INSERT INTO person_profile (
                        person_code, external_person_id, employee_no, full_name, display_name,
                        department_name, organization_path, job_title, email, source_system
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    personCode,
                    externalPersonId,
                    employeeNo,
                    fullName,
                    displayName,
                    departmentName,
                    organizationPath,
                    jobTitle,
                    email,
                    sourceSystem
            );
            return;
        }
        jdbcTemplate.update(
                """
                UPDATE person_profile
                SET external_person_id = COALESCE(?, external_person_id),
                    employee_no = COALESCE(?, employee_no),
                    full_name = ?,
                    display_name = COALESCE(?, display_name),
                    department_name = COALESCE(?, department_name),
                    organization_path = COALESCE(?, organization_path),
                    job_title = COALESCE(?, job_title),
                    email = COALESCE(?, email),
                    source_system = COALESCE(?, source_system)
                WHERE id = ?
                """,
                externalPersonId,
                employeeNo,
                fullName,
                displayName,
                departmentName,
                organizationPath,
                jobTitle,
                email,
                sourceSystem,
                personId
        );
    }

    /**
     * 确保人员手机号映射存在。
     *
     * @param personCode 人员编码
     * @param phoneNumber 手机号
     * @param phoneNumberMasked 脱敏手机号
     * @param sourceSystem 来源系统
     */
    public void ensurePersonPhone(String personCode, String phoneNumber, String phoneNumberMasked, String sourceSystem) {
        Long personId = findPersonIdByCode(personCode)
                .orElseThrow(() -> new IllegalArgumentException("人员不存在，无法绑定手机号"));
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM person_phone WHERE phone_number = ?",
                Integer.class,
                phoneNumber
        );
        if (count != null && count > 0) {
            jdbcTemplate.update(
                    """
                    UPDATE person_phone
                    SET person_id = ?,
                        phone_number_masked = COALESCE(?, phone_number_masked),
                        source_system = COALESCE(?, source_system),
                        status = 'ACTIVE'
                    WHERE phone_number = ?
                    """,
                    personId,
                    phoneNumberMasked,
                    sourceSystem,
                    phoneNumber
            );
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO person_phone (
                    person_id, phone_number, phone_number_masked, phone_type, is_primary, verified, status, source_system
                ) VALUES (?, ?, ?, 'MOBILE', 1, 1, 'ACTIVE', ?)
                """,
                personId,
                phoneNumber,
                phoneNumberMasked,
                sourceSystem
        );
    }

    /**
     * 查询终端总量。
     *
     * @return 终端总量
     */
    public int countDevices() {
        Integer value = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM terminal_device", Integer.class);
        return value == null ? 0 : value;
    }

    /**
     * 判断接入请求是否已存在。
     *
     * @param sourceSystem 来源系统
     * @param requestId 请求编号
     * @return 是否存在
     */
    public boolean existsIngestRequest(String sourceSystem, String requestId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM terminal_ingest_event WHERE source_system = ? AND request_id = ?",
                Integer.class,
                sourceSystem,
                requestId
        );
        return count != null && count > 0;
    }

    /**
     * 按人员优先规则解析终端所属人员。
     *
     * @param payload 人员线索
     * @return 解析到的人员
     */
    public Optional<PersonRecord> resolvePerson(com.bss.dashboard.terminal.dto.TerminalPersonPayload payload) {
        if (payload == null) {
            return Optional.empty();
        }

        if (hasText(payload.personCode())) {
            return queryPerson(
                    """
                    SELECT p.id, p.person_code, p.full_name, p.display_name, p.employee_no, p.department_name,
                           p.organization_path, p.job_title, p.email, ph.phone_number_masked
                    FROM person_profile p
                    LEFT JOIN person_phone ph ON ph.person_id = p.id AND ph.is_primary = 1 AND ph.status = 'ACTIVE'
                    WHERE p.person_code = ?
                    LIMIT 1
                    """,
                    payload.personCode()
            );
        }
        if (hasText(payload.employeeNo())) {
            return queryPerson(
                    """
                    SELECT p.id, p.person_code, p.full_name, p.display_name, p.employee_no, p.department_name,
                           p.organization_path, p.job_title, p.email, ph.phone_number_masked
                    FROM person_profile p
                    LEFT JOIN person_phone ph ON ph.person_id = p.id AND ph.is_primary = 1 AND ph.status = 'ACTIVE'
                    WHERE p.employee_no = ?
                    LIMIT 1
                    """,
                    payload.employeeNo()
            );
        }
        if (hasText(payload.externalPersonId())) {
            return queryPerson(
                    """
                    SELECT p.id, p.person_code, p.full_name, p.display_name, p.employee_no, p.department_name,
                           p.organization_path, p.job_title, p.email, ph.phone_number_masked
                    FROM person_profile p
                    LEFT JOIN person_phone ph ON ph.person_id = p.id AND ph.is_primary = 1 AND ph.status = 'ACTIVE'
                    WHERE p.external_person_id = ?
                    LIMIT 1
                    """,
                    payload.externalPersonId()
            );
        }
        if (hasText(payload.phoneNumber())) {
            return queryPerson(
                    """
                    SELECT p.id, p.person_code, p.full_name, p.display_name, p.employee_no, p.department_name,
                           p.organization_path, p.job_title, p.email, ph.phone_number_masked
                    FROM person_phone pp
                    JOIN person_profile p ON p.id = pp.person_id
                    LEFT JOIN person_phone ph ON ph.person_id = p.id AND ph.is_primary = 1 AND ph.status = 'ACTIVE'
                    WHERE pp.phone_number = ? AND pp.status = 'ACTIVE'
                    LIMIT 1
                    """,
                    payload.phoneNumber()
            );
        }
        return Optional.empty();
    }

    /**
     * 归一并创建/更新终端主记录。
     *
     * @param upsert 终端归一参数
     * @return 终端主键与编码
     */
    @Transactional
    public DeviceUpsertResult resolveOrCreateDevice(ResolvedDeviceUpsert upsert) {
        Objects.requireNonNull(upsert, "upsert must not be null");

        DeviceRecord existing = null;
        if (hasText(upsert.externalDeviceId()) && hasText(upsert.sourceSystem())) {
            existing = findDeviceByBinding(upsert.sourceSystem(), upsert.externalDeviceId()).orElse(null);
        }
        if (existing == null && hasText(upsert.deviceCode())) {
            existing = findDeviceByCode(upsert.deviceCode()).orElse(null);
        }
        if (existing == null && hasText(upsert.imei())) {
            existing = findDeviceByImei(upsert.imei()).orElse(null);
        }
        if (existing == null && hasText(upsert.meid())) {
            existing = findDeviceByMeid(upsert.meid()).orElse(null);
        }

        if (existing == null) {
            jdbcTemplate.update(
                    """
                    INSERT INTO terminal_device (
                        device_code, device_name, display_name, person_id, person_name_snapshot, employee_no_snapshot,
                        department_name_snapshot, phone_number_last_reported, phone_number_masked_last_reported,
                        primary_ip, os_version, imei, meid, plmn,
                        password_module_status, password_module_version, password_suite_status,
                        risk_level, status, last_observed_at, last_source_type, last_source_system
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    upsert.deviceCode(),
                    upsert.deviceName(),
                    upsert.displayName(),
                    upsert.personId(),
                    upsert.personNameSnapshot(),
                    upsert.employeeNoSnapshot(),
                    upsert.departmentNameSnapshot(),
                    upsert.phoneNumberLastReported(),
                    upsert.phoneNumberMaskedLastReported(),
                    upsert.primaryIp(),
                    upsert.osVersion(),
                    upsert.imei(),
                    upsert.meid(),
                    upsert.plmn(),
                    upsert.passwordModuleStatus(),
                    upsert.passwordModuleVersion(),
                    upsert.passwordSuiteStatus(),
                    upsert.riskLevel().name(),
                    upsert.status().name(),
                    Timestamp.valueOf(upsert.observedAt()),
                    upsert.sourceType().name(),
                    upsert.sourceSystem()
            );
            Long deviceId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            return new DeviceUpsertResult(deviceId == null ? 0L : deviceId, upsert.deviceCode());
        }

        jdbcTemplate.update(
                """
                UPDATE terminal_device
                SET device_name = ?,
                    display_name = ?,
                    person_id = ?,
                    person_name_snapshot = ?,
                    employee_no_snapshot = ?,
                    department_name_snapshot = ?,
                    phone_number_last_reported = ?,
                    phone_number_masked_last_reported = ?,
                    primary_ip = ?,
                    os_version = ?,
                    imei = ?,
                    meid = ?,
                    plmn = ?,
                    password_module_status = ?,
                    password_module_version = ?,
                    password_suite_status = ?,
                    risk_level = ?,
                    status = ?,
                    last_observed_at = ?,
                    last_source_type = ?,
                    last_source_system = ?
                WHERE id = ?
                """,
                chooseText(upsert.deviceName(), existing.deviceName()),
                chooseText(upsert.displayName(), existing.displayName()),
                upsert.personId() != null ? upsert.personId() : existing.personId(),
                chooseText(upsert.personNameSnapshot(), existing.personNameSnapshot()),
                chooseText(upsert.employeeNoSnapshot(), existing.employeeNoSnapshot()),
                chooseText(upsert.departmentNameSnapshot(), existing.departmentNameSnapshot()),
                chooseText(upsert.phoneNumberLastReported(), existing.phoneNumberLastReported()),
                chooseText(upsert.phoneNumberMaskedLastReported(), existing.phoneNumberMaskedLastReported()),
                chooseText(upsert.primaryIp(), existing.primaryIp()),
                chooseText(upsert.osVersion(), existing.osVersion()),
                chooseText(upsert.imei(), existing.imei()),
                chooseText(upsert.meid(), existing.meid()),
                chooseText(upsert.plmn(), existing.plmn()),
                chooseText(upsert.passwordModuleStatus(), existing.passwordModuleStatus()),
                chooseText(upsert.passwordModuleVersion(), existing.passwordModuleVersion()),
                chooseText(upsert.passwordSuiteStatus(), existing.passwordSuiteStatus()),
                upsert.riskLevel().name(),
                upsert.status().name(),
                Timestamp.valueOf(upsert.observedAt()),
                upsert.sourceType().name(),
                upsert.sourceSystem(),
                existing.id()
        );
        return new DeviceUpsertResult(existing.id(), existing.deviceCode());
    }

    /**
     * 写入来源绑定。
     *
     * @param deviceId 终端主键
     * @param sourceSystem 来源系统
     * @param externalDeviceId 外部终端编码
     * @param externalDeviceName 外部终端名称
     */
    public void upsertDeviceBinding(long deviceId, String sourceSystem, String externalDeviceId, String externalDeviceName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM terminal_device_binding WHERE source_system = ? AND external_device_id = ?",
                Integer.class,
                sourceSystem,
                externalDeviceId
        );
        if (count != null && count > 0) {
            jdbcTemplate.update(
                    """
                    UPDATE terminal_device_binding
                    SET device_id = ?,
                        external_device_name = COALESCE(?, external_device_name),
                        binding_status = 'ACTIVE'
                    WHERE source_system = ? AND external_device_id = ?
                    """,
                    deviceId,
                    externalDeviceName,
                    sourceSystem,
                    externalDeviceId
            );
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO terminal_device_binding (device_id, source_system, external_device_id, external_device_name, binding_status)
                VALUES (?, ?, ?, ?, 'ACTIVE')
                """,
                deviceId,
                sourceSystem,
                externalDeviceId,
                externalDeviceName
        );
    }

    /**
     * 写入终端快照。
     *
     * @param deviceId 终端主键
     * @param sourceType 来源类型
     * @param sourceSystem 来源系统
     * @param observedAt 观测时间
     * @param device 终端基础属性
     * @param security 安全属性
     * @return 快照主键
     */
    public long insertDeviceSnapshot(long deviceId, TerminalSourceType sourceType, String sourceSystem,
                                     LocalDateTime observedAt, TerminalDevicePayload device,
                                     TerminalSecurityPayload security) {
        jdbcTemplate.update(
                """
                INSERT INTO terminal_device_snapshot (
                    device_id, source_type, source_system, observed_at, primary_ip, os_version, plmn,
                    traffic_used_bytes, password_module_status, password_module_version, password_suite_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                deviceId,
                sourceType.name(),
                sourceSystem,
                Timestamp.valueOf(observedAt),
                device.primaryIp(),
                device.osVersion(),
                device.plmn(),
                device.trafficUsedBytes(),
                security == null ? null : security.passwordModuleStatus(),
                security == null ? null : security.passwordModuleVersion(),
                security == null ? null : security.passwordSuiteStatus()
        );
        Long snapshotId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return snapshotId == null ? 0L : snapshotId;
    }

    /**
     * 写入安全快照。
     *
     * @param deviceId 终端主键
     * @param snapshotId 终端快照主键
     * @param observedAt 观测时间
     * @param security 安全属性
     * @param riskLevel 风险等级
     * @param riskScore 风险分值
     * @param summary 摘要
     */
    public void insertSecuritySnapshot(long deviceId, long snapshotId, LocalDateTime observedAt,
                                       TerminalSecurityPayload security, TerminalRiskLevel riskLevel,
                                       int riskScore, String summary) {
        jdbcTemplate.update(
                """
                INSERT INTO terminal_security_snapshot (
                    device_id, device_snapshot_id, observed_at, wrong_password_count, fingerprint_changed,
                    config_modified, risk_level, risk_score, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                deviceId,
                snapshotId,
                Timestamp.valueOf(observedAt),
                security == null || security.wrongPasswordCount() == null ? 0 : security.wrongPasswordCount(),
                security != null && Boolean.TRUE.equals(security.fingerprintChanged()),
                security != null && Boolean.TRUE.equals(security.configModified()),
                riskLevel.name(),
                riskScore,
                summary
        );
    }

    /**
     * 写入软件变更记录。
     *
     * @param deviceId 终端主键
     * @param sourceType 来源类型
     * @param sourceSystem 来源系统
     * @param observedAt 观测时间
     * @param changes 软件变更列表
     */
    public void insertSoftwareChanges(long deviceId, TerminalSourceType sourceType, String sourceSystem,
                                      LocalDateTime observedAt, List<TerminalSoftwareChangePayload> changes) {
        if (changes == null || changes.isEmpty()) {
            return;
        }
        for (TerminalSoftwareChangePayload change : changes) {
            jdbcTemplate.update(
                    """
                    INSERT INTO terminal_software_change (
                        device_id, source_type, source_system, observed_at, change_type,
                        software_name, software_version, detail
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    deviceId,
                    sourceType.name(),
                    sourceSystem,
                    Timestamp.valueOf(observedAt),
                    chooseText(change.changeType(), "CHANGE"),
                    chooseText(change.softwareName(), "未命名软件"),
                    change.softwareVersion(),
                    change.detail()
            );
        }
    }

    /**
     * 写入外设事件。
     *
     * @param deviceId 终端主键
     * @param sourceType 来源类型
     * @param sourceSystem 来源系统
     * @param observedAt 观测时间
     * @param events 外设事件列表
     */
    public void insertPeripheralEvents(long deviceId, TerminalSourceType sourceType, String sourceSystem,
                                       LocalDateTime observedAt, List<TerminalPeripheralPayload> events) {
        if (events == null || events.isEmpty()) {
            return;
        }
        for (TerminalPeripheralPayload event : events) {
            jdbcTemplate.update(
                    """
                    INSERT INTO terminal_peripheral_event (
                        device_id, source_type, source_system, observed_at,
                        peripheral_type, peripheral_name, action_type, detail
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    deviceId,
                    sourceType.name(),
                    sourceSystem,
                    Timestamp.valueOf(observedAt),
                    chooseText(event.peripheralType(), "外设"),
                    event.peripheralName(),
                    chooseText(event.actionType(), "CHANGE"),
                    event.detail()
            );
        }
    }

    /**
     * 写入终端事件。
     *
     * @param deviceId 终端主键
     * @param sourceType 来源类型
     * @param sourceSystem 来源系统
     * @param observedAt 观测时间
     * @param events 事件列表
     */
    public void insertEvents(long deviceId, TerminalSourceType sourceType, String sourceSystem,
                             LocalDateTime observedAt, List<TerminalEventPayload> events) {
        if (events == null || events.isEmpty()) {
            return;
        }
        for (TerminalEventPayload event : events) {
            if (!hasText(event.title())) {
                continue;
            }
            jdbcTemplate.update(
                    """
                    INSERT INTO terminal_event (
                        device_id, source_type, source_system, observed_at,
                        event_type, severity, title, detail, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    deviceId,
                    sourceType.name(),
                    sourceSystem,
                    Timestamp.valueOf(observedAt),
                    chooseText(event.eventType(), "GENERAL"),
                    chooseText(event.severity(), "INFO"),
                    event.title(),
                    event.detail(),
                    chooseText(event.status(), "OPEN")
            );
        }
    }

    /**
     * 写入接入审计事件。
     *
     * @param sourceType 来源类型
     * @param sourceSystem 来源系统
     * @param requestId 请求编号
     * @param observedAt 观测时间
     * @param ingestStatus 接入状态
     * @param errorMessage 错误信息
     */
    public void insertIngestEvent(TerminalSourceType sourceType, String sourceSystem, String requestId,
                                  LocalDateTime observedAt, String ingestStatus, String errorMessage) {
        jdbcTemplate.update(
                """
                INSERT INTO terminal_ingest_event (source_type, source_system, request_id, observed_at, ingest_status, error_message)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                sourceType.name(),
                sourceSystem,
                requestId,
                Timestamp.valueOf(observedAt),
                ingestStatus,
                errorMessage
        );
    }

    /**
     * 写入原始接入报文。
     *
     * @param sourceType 来源类型
     * @param sourceSystem 来源系统
     * @param requestId 请求编号
     * @param payloadJson 报文 JSON
     */
    public void insertIngestPayload(TerminalSourceType sourceType, String sourceSystem, String requestId, String payloadJson) {
        jdbcTemplate.update(
                """
                INSERT INTO terminal_ingest_payload (source_type, source_system, request_id, payload_json)
                VALUES (?, ?, ?, ?)
                """,
                sourceType.name(),
                sourceSystem,
                requestId,
                payloadJson
        );
    }

    /**
     * 对象转 JSON。
     *
     * @param payload 任意对象
     * @return JSON 字符串
     */
    public String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("序列化终端接入报文失败", exception);
        }
    }

    /**
     * 查询终端列表。
     *
     * @param keyword 关键字
     * @param limit 最大条数
     * @return 终端列表
     */
    public List<TerminalDeviceSummaryDto> listDevices(String keyword, int limit) {
        String sql = """
                SELECT d.id, d.device_code, d.display_name, d.person_name_snapshot, d.employee_no_snapshot,
                       d.department_name_snapshot, d.phone_number_masked_last_reported, d.primary_ip, d.os_version,
                       d.imei, d.meid, d.password_module_status, d.risk_level, d.status, d.last_observed_at,
                       d.last_source_type, d.last_source_system,
                       CASE
                           WHEN d.person_id IS NOT NULL THEN 'BOUND'
                           WHEN d.phone_number_last_reported IS NOT NULL AND d.phone_number_last_reported <> '' THEN 'PENDING_CLAIM'
                           ELSE 'ANONYMOUS'
                       END AS ownership_status,
                       COALESCE(ds.traffic_used_bytes, 0) AS traffic_used_bytes,
                       COALESCE(ss.fingerprint_changed, 0) AS fingerprint_changed,
                       COALESCE(ss.config_modified, 0) AS config_modified
                FROM terminal_device d
                LEFT JOIN terminal_device_snapshot ds ON ds.id = (
                    SELECT dsl.id
                    FROM terminal_device_snapshot dsl
                    WHERE dsl.device_id = d.id
                    ORDER BY dsl.observed_at DESC, dsl.id DESC
                    LIMIT 1
                )
                LEFT JOIN terminal_security_snapshot ss ON ss.id = (
                    SELECT ssl.id
                    FROM terminal_security_snapshot ssl
                    WHERE ssl.device_id = d.id
                    ORDER BY ssl.observed_at DESC, ssl.id DESC
                    LIMIT 1
                )
                WHERE (
                    ? IS NULL OR ? = ''
                    OR d.display_name LIKE CONCAT('%', ?, '%')
                    OR d.person_name_snapshot LIKE CONCAT('%', ?, '%')
                    OR d.employee_no_snapshot LIKE CONCAT('%', ?, '%')
                    OR d.primary_ip LIKE CONCAT('%', ?, '%')
                    OR d.imei LIKE CONCAT('%', ?, '%')
                    OR d.meid LIKE CONCAT('%', ?, '%')
                    OR d.phone_number_masked_last_reported LIKE CONCAT('%', ?, '%')
                )
                ORDER BY d.last_observed_at DESC, d.id DESC
                LIMIT ?
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new TerminalDeviceSummaryDto(
                        rs.getLong("id"),
                        rs.getString("device_code"),
                        rs.getString("display_name"),
                        rs.getString("person_name_snapshot"),
                        rs.getString("employee_no_snapshot"),
                        rs.getString("department_name_snapshot"),
                        rs.getString("phone_number_masked_last_reported"),
                        rs.getString("primary_ip"),
                        rs.getString("os_version"),
                        rs.getString("imei"),
                        rs.getString("meid"),
                        rs.getString("password_module_status"),
                        rs.getString("risk_level"),
                        rs.getString("status"),
                        rs.getString("ownership_status"),
                        rs.getLong("traffic_used_bytes"),
                        rs.getInt("fingerprint_changed") > 0,
                        rs.getInt("config_modified") > 0,
                        format(rs.getTimestamp("last_observed_at")),
                        rs.getString("last_source_type"),
                        rs.getString("last_source_system")
                ),
                keyword,
                keyword,
                keyword,
                keyword,
                keyword,
                keyword,
                keyword,
                keyword,
                keyword,
                limit
        );
    }

    /**
     * 查询终端详情。
     *
     * @param deviceId 终端主键
     * @return 终端详情
     */
    public TerminalDeviceDetailDto getDeviceDetail(long deviceId) {
        String sql = """
                SELECT d.id, d.device_code, d.display_name, d.risk_level, d.status, d.last_observed_at,
                       d.last_source_type, d.last_source_system,
                       CASE
                           WHEN d.person_id IS NOT NULL THEN 'BOUND'
                           WHEN d.phone_number_last_reported IS NOT NULL AND d.phone_number_last_reported <> '' THEN 'PENDING_CLAIM'
                           ELSE 'ANONYMOUS'
                       END AS ownership_status,
                       d.phone_number_masked_last_reported, d.device_name, d.primary_ip, d.os_version,
                       d.imei, d.meid, d.plmn,
                       COALESCE(ds.traffic_used_bytes, 0) AS traffic_used_bytes,
                       p.person_code, p.full_name, p.display_name AS person_display_name, p.employee_no,
                       p.department_name, p.organization_path, p.job_title, p.email,
                       ph.phone_number_masked,
                       COALESCE(ss.wrong_password_count, 0) AS wrong_password_count,
                       COALESCE(ss.fingerprint_changed, 0) AS fingerprint_changed,
                       COALESCE(ss.config_modified, 0) AS config_modified,
                       COALESCE(ss.risk_level, d.risk_level) AS latest_risk_level,
                       ss.risk_score, ss.summary,
                       ds.password_module_status, ds.password_module_version, ds.password_suite_status
                FROM terminal_device d
                LEFT JOIN terminal_device_snapshot ds ON ds.id = (
                    SELECT dsl.id
                    FROM terminal_device_snapshot dsl
                    WHERE dsl.device_id = d.id
                    ORDER BY dsl.observed_at DESC, dsl.id DESC
                    LIMIT 1
                )
                LEFT JOIN terminal_security_snapshot ss ON ss.id = (
                    SELECT ssl.id
                    FROM terminal_security_snapshot ssl
                    WHERE ssl.device_id = d.id
                    ORDER BY ssl.observed_at DESC, ssl.id DESC
                    LIMIT 1
                )
                LEFT JOIN person_profile p ON p.id = d.person_id
                LEFT JOIN person_phone ph ON ph.person_id = p.id AND ph.is_primary = 1 AND ph.status = 'ACTIVE'
                WHERE d.id = ?
                LIMIT 1
                """;
        List<TerminalDeviceDetailDto> rows = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new TerminalDeviceDetailDto(
                        rs.getLong("id"),
                        rs.getString("device_code"),
                        rs.getString("display_name"),
                        rs.getString("status"),
                        rs.getString("risk_level"),
                        format(rs.getTimestamp("last_observed_at")),
                        rs.getString("last_source_type"),
                        rs.getString("last_source_system"),
                        rs.getString("ownership_status"),
                        rs.getString("phone_number_masked_last_reported"),
                        rs.getString("person_code") == null ? null : new com.bss.dashboard.terminal.dto.TerminalPersonDto(
                                rs.getString("person_code"),
                                rs.getString("full_name"),
                                rs.getString("person_display_name"),
                                rs.getString("employee_no"),
                                rs.getString("department_name"),
                                rs.getString("organization_path"),
                                rs.getString("job_title"),
                                rs.getString("email"),
                                rs.getString("phone_number_masked")
                        ),
                        new TerminalDeviceDetailDto.TerminalDeviceInfoDto(
                                rs.getString("device_name"),
                                rs.getString("primary_ip"),
                                rs.getString("os_version"),
                                rs.getString("imei"),
                                rs.getString("meid"),
                                rs.getString("plmn"),
                                rs.getLong("traffic_used_bytes")
                        ),
                        new TerminalDeviceDetailDto.TerminalSecurityInfoDto(
                                rs.getString("password_module_status"),
                                rs.getString("password_module_version"),
                                rs.getString("password_suite_status"),
                                rs.getInt("wrong_password_count"),
                                rs.getInt("fingerprint_changed") > 0,
                                rs.getInt("config_modified") > 0,
                                rs.getString("latest_risk_level"),
                                rs.getObject("risk_score") == null ? null : rs.getInt("risk_score"),
                                rs.getString("summary")
                        ),
                        List.of()
                ),
                deviceId
        );
        TerminalDeviceDetailDto detail = rows.stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("终端不存在或已删除"));
        return new TerminalDeviceDetailDto(
                detail.id(),
                detail.deviceCode(),
                detail.displayName(),
                detail.status(),
                detail.riskLevel(),
                detail.lastObservedAt(),
                detail.sourceType(),
                detail.sourceSystem(),
                detail.ownershipStatus(),
                detail.reportedPhoneNumberMasked(),
                detail.person(),
                detail.deviceInfo(),
                detail.latestSecurity(),
                listBindings(deviceId)
        );
    }

    /**
     * 查询终端来源绑定。
     *
     * @param deviceId 终端主键
     * @return 绑定列表
     */
    public List<TerminalBindingDto> listBindings(long deviceId) {
        return jdbcTemplate.query(
                """
                SELECT source_system, external_device_id, external_device_name, binding_status
                FROM terminal_device_binding
                WHERE device_id = ?
                ORDER BY id DESC
                """,
                (rs, rowNum) -> new TerminalBindingDto(
                        rs.getString("source_system"),
                        rs.getString("external_device_id"),
                        rs.getString("external_device_name"),
                        rs.getString("binding_status")
                ),
                deviceId
        );
    }

    /**
     * 查询终端事件列表。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 事件列表
     */
    public List<TerminalEventDto> listEvents(long deviceId, int limit) {
        String sql = """
                SELECT id, event_category, event_type, severity, title, detail, observed_at
                FROM (
                    SELECT e.id, '安全事件' AS event_category, e.event_type, e.severity, e.title, e.detail, e.observed_at
                    FROM terminal_event e
                    WHERE e.device_id = ?
                    UNION ALL
                    SELECT sc.id,
                           '软件变更' AS event_category,
                           sc.change_type AS event_type,
                           'INFO' AS severity,
                           CONCAT('软件',
                                  CASE UPPER(sc.change_type)
                                      WHEN 'INSTALL' THEN '安装'
                                      WHEN 'UPDATE' THEN '更新'
                                      WHEN 'UNINSTALL' THEN '卸载'
                                      ELSE '变更'
                                  END,
                                  '：', sc.software_name) AS title,
                           COALESCE(sc.detail, CONCAT('版本：', COALESCE(sc.software_version, '未知'))) AS detail,
                           sc.observed_at
                    FROM terminal_software_change sc
                    WHERE sc.device_id = ?
                    UNION ALL
                    SELECT pe.id,
                           '外设接入' AS event_category,
                           pe.action_type AS event_type,
                           CASE WHEN UPPER(pe.action_type) = 'INSERT' THEN 'WARNING' ELSE 'INFO' END AS severity,
                           CONCAT(COALESCE(pe.peripheral_name, pe.peripheral_type),
                                  CASE UPPER(pe.action_type)
                                      WHEN 'INSERT' THEN ' 已接入'
                                      WHEN 'REMOVE' THEN ' 已移除'
                                      ELSE ' 状态变化'
                                  END) AS title,
                           pe.detail,
                           pe.observed_at
                    FROM terminal_peripheral_event pe
                    WHERE pe.device_id = ?
                ) events
                ORDER BY observed_at DESC, id DESC
                LIMIT ?
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new TerminalEventDto(
                        rs.getLong("id"),
                        rs.getString("event_category"),
                        rs.getString("event_type"),
                        rs.getString("severity"),
                        rs.getString("title"),
                        rs.getString("detail"),
                        format(rs.getTimestamp("observed_at"))
                ),
                deviceId,
                deviceId,
                deviceId,
                limit
        );
    }

    /**
     * 查询终端软件变更列表。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 软件变更列表
     */
    public List<TerminalSoftwareChangeDto> listSoftwareChanges(long deviceId, int limit) {
        return jdbcTemplate.query(
                """
                SELECT id, change_type, software_name, software_version, detail, observed_at
                FROM terminal_software_change
                WHERE device_id = ?
                ORDER BY observed_at DESC, id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new TerminalSoftwareChangeDto(
                        rs.getLong("id"),
                        rs.getString("change_type"),
                        rs.getString("software_name"),
                        rs.getString("software_version"),
                        rs.getString("detail"),
                        format(rs.getTimestamp("observed_at"))
                ),
                deviceId,
                limit
        );
    }

    /**
     * 查询终端外设接入列表。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 外设接入列表
     */
    public List<TerminalPeripheralEventDto> listPeripheralEvents(long deviceId, int limit) {
        return jdbcTemplate.query(
                """
                SELECT id, peripheral_type, peripheral_name, action_type, detail, observed_at
                FROM terminal_peripheral_event
                WHERE device_id = ?
                ORDER BY observed_at DESC, id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new TerminalPeripheralEventDto(
                        rs.getLong("id"),
                        rs.getString("peripheral_type"),
                        rs.getString("peripheral_name"),
                        rs.getString("action_type"),
                        rs.getString("detail"),
                        format(rs.getTimestamp("observed_at"))
                ),
                deviceId,
                limit
        );
    }

    /**
     * 查询终端趋势。
     *
     * @param deviceId 终端主键
     * @param since 开始时间
     * @return 时间序列
     */
    public List<TerminalTimeseriesPointDto> listTimeseries(long deviceId, LocalDateTime since) {
        return jdbcTemplate.query(
                """
                SELECT ds.observed_at, COALESCE(ds.traffic_used_bytes, 0) AS traffic_used_bytes,
                       COALESCE(ss.wrong_password_count, 0) AS wrong_password_count,
                       ss.risk_score, COALESCE(ss.risk_level, 'LOW') AS risk_level
                FROM terminal_device_snapshot ds
                LEFT JOIN terminal_security_snapshot ss ON ss.device_snapshot_id = ds.id
                WHERE ds.device_id = ? AND ds.observed_at >= ?
                ORDER BY ds.observed_at ASC, ds.id ASC
                """,
                (rs, rowNum) -> new TerminalTimeseriesPointDto(
                        format(rs.getTimestamp("observed_at")),
                        rs.getLong("traffic_used_bytes"),
                        rs.getInt("wrong_password_count"),
                        rs.getObject("risk_score") == null ? null : rs.getInt("risk_score"),
                        rs.getString("risk_level")
                ),
                deviceId,
                Timestamp.valueOf(since)
        );
    }

    /**
     * 查询来源概览。
     *
     * @return 来源列表
     */
    public List<TerminalSourceDto> listSources() {
        return jdbcTemplate.query(
                """
                SELECT ie.source_type, ie.source_system,
                       MAX(ie.observed_at) AS last_seen_at,
                       COALESCE((SELECT COUNT(1)
                                 FROM terminal_device d
                                 WHERE d.last_source_type = ie.source_type AND d.last_source_system = ie.source_system), 0) AS device_count
                FROM terminal_ingest_event ie
                GROUP BY ie.source_type, ie.source_system
                ORDER BY last_seen_at DESC
                """,
                (rs, rowNum) -> new TerminalSourceDto(
                        rs.getString("source_type"),
                        rs.getString("source_system"),
                        true,
                        rs.getTimestamp("last_seen_at") == null ? "UNKNOWN" : "HEALTHY",
                        rs.getInt("device_count"),
                        format(rs.getTimestamp("last_seen_at"))
                )
        );
    }

    /**
     * 统计待认领终端数量。
     *
     * @return 待认领终端数量
     */
    public int countPendingClaimDevices() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM terminal_device WHERE person_id IS NULL AND phone_number_last_reported IS NOT NULL AND phone_number_last_reported <> ''",
                Integer.class
        );
        return count == null ? 0 : count;
    }

    /**
     * 统计近 N 小时存在软件变更的终端数。
     *
     * @param hours 小时数
     * @return 终端数
     */
    public int countSoftwareChangedDevices(int hours) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT device_id) FROM terminal_software_change WHERE observed_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)",
                Integer.class,
                hours
        );
        return count == null ? 0 : count;
    }

    /**
     * 统计近 N 小时外设事件数。
     *
     * @param hours 小时数
     * @return 事件数
     */
    public int countPeripheralAlerts(int hours) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM terminal_peripheral_event WHERE observed_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)",
                Integer.class,
                hours
        );
        return count == null ? 0 : count;
    }

    /**
     * 清理过期快照。
     *
     * @param snapshotRetentionDays 保留天数
     */
    public void deleteExpiredSnapshots(long snapshotRetentionDays) {
        jdbcTemplate.update(
                "DELETE FROM terminal_security_snapshot WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                snapshotRetentionDays
        );
        jdbcTemplate.update(
                "DELETE FROM terminal_device_snapshot WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                snapshotRetentionDays
        );
    }

    /**
     * 清理过期事件。
     *
     * @param eventRetentionDays 保留天数
     */
    public void deleteExpiredEvents(long eventRetentionDays) {
        jdbcTemplate.update(
                "DELETE FROM terminal_event WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                eventRetentionDays
        );
        jdbcTemplate.update(
                "DELETE FROM terminal_software_change WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                eventRetentionDays
        );
        jdbcTemplate.update(
                "DELETE FROM terminal_peripheral_event WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                eventRetentionDays
        );
        jdbcTemplate.update(
                "DELETE FROM terminal_ingest_event WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                eventRetentionDays
        );
    }

    /**
     * 清理过期报文。
     *
     * @param payloadRetentionDays 保留天数
     */
    public void deleteExpiredPayloads(long payloadRetentionDays) {
        jdbcTemplate.update(
                "DELETE FROM terminal_ingest_payload WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                payloadRetentionDays
        );
    }

    private Optional<PersonRecord> queryPerson(String sql, Object value) {
        List<PersonRecord> rows = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new PersonRecord(
                        rs.getLong("id"),
                        rs.getString("person_code"),
                        rs.getString("full_name"),
                        rs.getString("display_name"),
                        rs.getString("employee_no"),
                        rs.getString("department_name"),
                        rs.getString("organization_path"),
                        rs.getString("job_title"),
                        rs.getString("email"),
                        rs.getString("phone_number_masked")
                ),
                value
        );
        return rows.stream().findFirst();
    }

    private Optional<Long> findPersonIdByCode(String personCode) {
        List<Long> rows = jdbcTemplate.query(
                "SELECT id FROM person_profile WHERE person_code = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"),
                personCode
        );
        return rows.stream().findFirst();
    }

    private Optional<DeviceRecord> findDeviceByBinding(String sourceSystem, String externalDeviceId) {
        return queryDevice(
                """
                SELECT d.id, d.device_code, d.device_name, d.display_name, d.person_id, d.person_name_snapshot,
                       d.employee_no_snapshot, d.department_name_snapshot, d.phone_number_last_reported,
                       d.phone_number_masked_last_reported, d.primary_ip, d.os_version, d.imei, d.meid,
                       d.plmn, d.password_module_status, d.password_module_version, d.password_suite_status,
                       d.risk_level, d.status, d.last_observed_at, d.last_source_type, d.last_source_system
                FROM terminal_device_binding b
                JOIN terminal_device d ON d.id = b.device_id
                WHERE b.source_system = ? AND b.external_device_id = ?
                LIMIT 1
                """,
                sourceSystem,
                externalDeviceId
        );
    }

    private Optional<DeviceRecord> findDeviceByCode(String deviceCode) {
        return queryDevice(
                "SELECT * FROM terminal_device WHERE device_code = ? LIMIT 1",
                deviceCode
        );
    }

    private Optional<DeviceRecord> findDeviceByImei(String imei) {
        return queryDevice(
                "SELECT * FROM terminal_device WHERE imei = ? LIMIT 1",
                imei
        );
    }

    private Optional<DeviceRecord> findDeviceByMeid(String meid) {
        return queryDevice(
                "SELECT * FROM terminal_device WHERE meid = ? LIMIT 1",
                meid
        );
    }

    private Optional<DeviceRecord> queryDevice(String sql, Object... args) {
        List<DeviceRecord> rows = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new DeviceRecord(
                        rs.getLong("id"),
                        rs.getString("device_code"),
                        rs.getString("device_name"),
                        rs.getString("display_name"),
                        rs.getObject("person_id") == null ? null : rs.getLong("person_id"),
                        rs.getString("person_name_snapshot"),
                        rs.getString("employee_no_snapshot"),
                        rs.getString("department_name_snapshot"),
                        rs.getString("phone_number_last_reported"),
                        rs.getString("phone_number_masked_last_reported"),
                        rs.getString("primary_ip"),
                        rs.getString("os_version"),
                        rs.getString("imei"),
                        rs.getString("meid"),
                        rs.getString("plmn"),
                        rs.getString("password_module_status"),
                        rs.getString("password_module_version"),
                        rs.getString("password_suite_status"),
                        TerminalRiskLevel.valueOf(rs.getString("risk_level")),
                        TerminalDeviceStatus.valueOf(rs.getString("status")),
                        rs.getTimestamp("last_observed_at") == null ? null : rs.getTimestamp("last_observed_at").toLocalDateTime(),
                        rs.getString("last_source_type"),
                        rs.getString("last_source_system")
                ),
                args
        );
        return rows.stream().findFirst();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String chooseText(String preferred, String fallback) {
        return hasText(preferred) ? preferred : fallback;
    }

    private static String format(Timestamp timestamp) {
        return TerminalTimeFormats.format(timestamp);
    }

    public record PersonRecord(long id, String personCode, String fullName, String displayName,
                               String employeeNo, String departmentName, String organizationPath,
                               String jobTitle, String email, String phoneNumberMasked) {
    }

    public record DeviceRecord(long id, String deviceCode, String deviceName, String displayName,
                               Long personId, String personNameSnapshot, String employeeNoSnapshot,
                               String departmentNameSnapshot, String phoneNumberLastReported,
                               String phoneNumberMaskedLastReported, String primaryIp, String osVersion,
                               String imei, String meid, String plmn, String passwordModuleStatus,
                               String passwordModuleVersion, String passwordSuiteStatus,
                               TerminalRiskLevel riskLevel, TerminalDeviceStatus status,
                               LocalDateTime lastObservedAt, String lastSourceType, String lastSourceSystem) {
    }

    public record DeviceUpsertResult(long deviceId, String deviceCode) {
    }

    public record ResolvedDeviceUpsert(String deviceCode, String deviceName, String displayName, Long personId,
                                       String personNameSnapshot, String employeeNoSnapshot,
                                       String departmentNameSnapshot, String phoneNumberLastReported,
                                       String phoneNumberMaskedLastReported, String primaryIp, String osVersion,
                                       String imei, String meid, String plmn, String passwordModuleStatus,
                                       String passwordModuleVersion, String passwordSuiteStatus,
                                       TerminalRiskLevel riskLevel, TerminalDeviceStatus status,
                                       TerminalSourceType sourceType, String sourceSystem,
                                       String externalDeviceId, LocalDateTime observedAt) {
    }
}
