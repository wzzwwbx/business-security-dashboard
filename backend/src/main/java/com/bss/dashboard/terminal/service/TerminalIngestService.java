package com.bss.dashboard.terminal.service;

import com.bss.dashboard.terminal.config.TerminalProperties;
import com.bss.dashboard.terminal.domain.TerminalDeviceStatus;
import com.bss.dashboard.terminal.domain.TerminalRiskLevel;
import com.bss.dashboard.terminal.domain.TerminalSourceType;
import com.bss.dashboard.terminal.dto.TerminalDevicePayload;
import com.bss.dashboard.terminal.dto.TerminalEventPayload;
import com.bss.dashboard.terminal.dto.TerminalIngestRequest;
import com.bss.dashboard.terminal.dto.TerminalIngestResultDto;
import com.bss.dashboard.terminal.dto.TerminalPeripheralPayload;
import com.bss.dashboard.terminal.dto.TerminalPersonPayload;
import com.bss.dashboard.terminal.dto.TerminalSecurityPayload;
import com.bss.dashboard.terminal.dto.TerminalSoftwareChangePayload;
import com.bss.dashboard.terminal.repository.TerminalRepository;
import com.bss.dashboard.terminal.support.TerminalTimeFormats;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * 终端接入服务。
 *
 * <p>职责：</p>
 * <ul>
 *     <li>校验来源鉴权与报文约束</li>
 *     <li>按人员优先规则完成终端归一</li>
 *     <li>写入终端快照、事件与来源审计</li>
 * </ul>
 */
@Service
@Profile("mysql")
public class TerminalIngestService {

    private final TerminalRepository repository;
    private final TerminalProperties properties;

    public TerminalIngestService(TerminalRepository repository, TerminalProperties properties) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.properties = Objects.requireNonNull(properties, "properties must not be null");
    }

    /**
     * 接收外部系统终端报文。
     *
     * @param token 外部系统令牌
     * @param request 报文
     * @return 接入结果
     */
    @Transactional
    public TerminalIngestResultDto ingestExternal(String token, TerminalIngestRequest request) {
        if (!Objects.equals(properties.getExternal().getIngestToken(), token)) {
            throw new IllegalArgumentException("终端外部接入令牌无效");
        }
        return ingest(TerminalSourceType.EXTERNAL_API, request);
    }

    /**
     * 接收手工终端报文。
     *
     * @param token 手工注入令牌
     * @param request 报文
     * @return 接入结果
     */
    @Transactional
    public TerminalIngestResultDto ingestManual(String token, TerminalIngestRequest request) {
        if (!Objects.equals(properties.getManual().getIngestToken(), token)) {
            throw new IllegalArgumentException("终端手工注入令牌无效");
        }
        return ingest(TerminalSourceType.MANUAL_IMPORT, request);
    }

    /**
     * 执行统一终端接入。
     *
     * @param expectedSourceType 期望来源类型
     * @param request 报文
     * @return 接入结果
     */
    @Transactional
    public TerminalIngestResultDto ingest(TerminalSourceType expectedSourceType, TerminalIngestRequest request) {
        Objects.requireNonNull(expectedSourceType, "expectedSourceType must not be null");
        Objects.requireNonNull(request, "request must not be null");
        if (repository.existsIngestRequest(request.sourceSystem(), request.requestId())) {
            throw new IllegalStateException("终端接入 requestId 已存在，请勿重复提交");
        }

        LocalDateTime observedAt = parseObservedAt(request.observedAt());
        String sourceSystem = requireText(request.sourceSystem(), "sourceSystem 不能为空");
        String requestId = requireText(request.requestId(), "requestId 不能为空");
        TerminalDevicePayload device = Objects.requireNonNull(request.device(), "device 不能为空");
        TerminalSecurityPayload security = request.security();
        TerminalPersonPayload personPayload = request.person();
        TerminalSourceType sourceType = request.sourceType() == null ? expectedSourceType : request.sourceType();

        repository.insertIngestPayload(sourceType, sourceSystem, requestId, repository.toJson(request));

        TerminalRepository.PersonRecord person = repository.resolvePerson(personPayload).orElse(null);
        String maskedPhone = maskPhone(personPayload == null ? null : personPayload.phoneNumber());
        String deviceCode = buildDeviceCode(device, request.externalDeviceId(), person == null ? null : person.personCode(),
                personPayload == null ? null : personPayload.phoneNumber());
        String displayName = resolveDisplayName(device, person, deviceCode);
        TerminalRiskLevel riskLevel = deriveRiskLevel(security);
        int riskScore = deriveRiskScore(security, riskLevel);
        String securitySummary = deriveSecuritySummary(security, riskLevel);

        try {
            TerminalRepository.ResolvedDeviceUpsert upsert = new TerminalRepository.ResolvedDeviceUpsert(
                    deviceCode,
                    device.deviceName(),
                    displayName,
                    person == null ? null : person.id(),
                    person == null ? null : person.fullName(),
                    person == null ? null : person.employeeNo(),
                    person == null ? null : person.departmentName(),
                    personPayload == null ? null : personPayload.phoneNumber(),
                    person != null && person.phoneNumberMasked() != null ? person.phoneNumberMasked() : maskedPhone,
                    device.primaryIp(),
                    device.osVersion(),
                    device.imei(),
                    device.meid(),
                    device.plmn(),
                    security == null ? null : security.passwordModuleStatus(),
                    security == null ? null : security.passwordModuleVersion(),
                    security == null ? null : security.passwordSuiteStatus(),
                    riskLevel,
                    TerminalDeviceStatus.ONLINE,
                    sourceType,
                    sourceSystem,
                    request.externalDeviceId(),
                    observedAt
            );
            TerminalRepository.DeviceUpsertResult resolvedDevice = repository.resolveOrCreateDevice(upsert);
            if (request.externalDeviceId() != null && !request.externalDeviceId().isBlank()) {
                repository.upsertDeviceBinding(resolvedDevice.deviceId(), sourceSystem, request.externalDeviceId(), device.deviceName());
            }

            long snapshotId = repository.insertDeviceSnapshot(
                    resolvedDevice.deviceId(),
                    sourceType,
                    sourceSystem,
                    observedAt,
                    device,
                    security
            );
            repository.insertSecuritySnapshot(
                    resolvedDevice.deviceId(),
                    snapshotId,
                    observedAt,
                    security,
                    riskLevel,
                    riskScore,
                    securitySummary
            );
            repository.insertSoftwareChanges(resolvedDevice.deviceId(), sourceType, sourceSystem, observedAt, request.softwareChanges());
            repository.insertPeripheralEvents(resolvedDevice.deviceId(), sourceType, sourceSystem, observedAt, request.peripheralEvents());
            repository.insertEvents(resolvedDevice.deviceId(), sourceType, sourceSystem, observedAt, buildEvents(request.events(), request.softwareChanges(), request.peripheralEvents(), security, riskLevel));
            repository.insertIngestEvent(sourceType, sourceSystem, requestId, observedAt, "SUCCESS", null);

            return new TerminalIngestResultDto(
                    resolvedDevice.deviceId(),
                    resolvedDevice.deviceCode(),
                    person == null ? null : person.personCode(),
                    TerminalDeviceStatus.ONLINE.name(),
                    riskLevel.name(),
                    TerminalTimeFormats.format(observedAt)
            );
        } catch (RuntimeException exception) {
            repository.insertIngestEvent(sourceType, sourceSystem, requestId, observedAt, "FAILED", exception.getMessage());
            throw exception;
        }
    }

    private LocalDateTime parseObservedAt(String observedAt) {
        LocalDateTime parsed = TerminalTimeFormats.parseToLocalDateTime(observedAt);
        if (parsed == null) {
            throw new IllegalArgumentException("observedAt 不能为空");
        }
        return parsed;
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }

    private String resolveDisplayName(TerminalDevicePayload device, TerminalRepository.PersonRecord person, String deviceCode) {
        if (device.displayName() != null && !device.displayName().isBlank()) {
            return device.displayName();
        }
        if (device.deviceName() != null && !device.deviceName().isBlank()) {
            return device.deviceName();
        }
        if (person != null && person.fullName() != null && !person.fullName().isBlank()) {
            return person.fullName() + "终端";
        }
        return "终端-" + deviceCode.substring(Math.max(0, deviceCode.length() - 6));
    }

    private String buildDeviceCode(TerminalDevicePayload device, String externalDeviceId, String personCode, String phoneNumber) {
        if (device.deviceCode() != null && !device.deviceCode().isBlank()) {
            return device.deviceCode();
        }
        List<String> segments = List.of(
                normalize(device.imei()),
                normalize(device.meid()),
                normalize(externalDeviceId),
                normalize(personCode),
                normalize(phoneNumber),
                normalize(device.primaryIp())
        );
        String basis = String.join("|", segments);
        if (basis.replace("|", "").isBlank()) {
            basis = "terminal|anonymous|" + System.nanoTime();
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(basis.getBytes(StandardCharsets.UTF_8));
            return "td-" + HexFormat.of().formatHex(bytes).substring(0, 16);
        } catch (Exception exception) {
            throw new IllegalStateException("生成终端编码失败", exception);
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String maskPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return null;
        }
        String clean = phoneNumber.trim();
        if (clean.length() <= 4) {
            return "****";
        }
        if (clean.length() <= 7) {
            return clean.substring(0, 2) + "***" + clean.substring(clean.length() - 2);
        }
        return clean.substring(0, 3) + "****" + clean.substring(clean.length() - 4);
    }

    private TerminalRiskLevel deriveRiskLevel(TerminalSecurityPayload security) {
        if (security == null) {
            return TerminalRiskLevel.LOW;
        }
        if (security.riskLevel() != null && !security.riskLevel().isBlank()) {
            try {
                return TerminalRiskLevel.valueOf(security.riskLevel().trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                // 回退到规则推导
            }
        }

        boolean fingerprintChanged = Boolean.TRUE.equals(security.fingerprintChanged());
        boolean configModified = Boolean.TRUE.equals(security.configModified());
        int wrongPasswordCount = security.wrongPasswordCount() == null ? 0 : security.wrongPasswordCount();
        boolean moduleAbnormal = isAbnormalStatus(security.passwordModuleStatus());
        boolean suiteAbnormal = isAbnormalStatus(security.passwordSuiteStatus());

        if ((moduleAbnormal && configModified) || wrongPasswordCount >= 10) {
            return TerminalRiskLevel.CRITICAL;
        }
        if (moduleAbnormal || suiteAbnormal || fingerprintChanged || wrongPasswordCount >= 5) {
            return TerminalRiskLevel.HIGH;
        }
        if (configModified || wrongPasswordCount >= 1) {
            return TerminalRiskLevel.MEDIUM;
        }
        return TerminalRiskLevel.LOW;
    }

    private int deriveRiskScore(TerminalSecurityPayload security, TerminalRiskLevel riskLevel) {
        if (security != null && security.riskScore() != null) {
            return security.riskScore();
        }
        return switch (riskLevel) {
            case LOW -> 25;
            case MEDIUM -> 55;
            case HIGH -> 78;
            case CRITICAL -> 92;
        };
    }

    private String deriveSecuritySummary(TerminalSecurityPayload security, TerminalRiskLevel riskLevel) {
        if (security != null && security.summary() != null && !security.summary().isBlank()) {
            return security.summary();
        }
        return switch (riskLevel) {
            case LOW -> "当前未发现显著风险项";
            case MEDIUM -> "存在轻微异常，建议持续观察";
            case HIGH -> "存在明确风险信号，建议尽快处置";
            case CRITICAL -> "存在高危复合风险，建议立即处置";
        };
    }

    private boolean isAbnormalStatus(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return !("NORMAL".equals(normalized) || "HEALTHY".equals(normalized) || "ACTIVE".equals(normalized)
                || "AVAILABLE".equals(normalized) || "ENABLED".equals(normalized) || "正常".equals(status.trim())
                || "启用".equals(status.trim()) || "在线".equals(status.trim()));
    }

    private List<TerminalEventPayload> buildEvents(List<TerminalEventPayload> explicitEvents,
                                                   List<TerminalSoftwareChangePayload> softwareChanges,
                                                   List<TerminalPeripheralPayload> peripheralEvents,
                                                   TerminalSecurityPayload security,
                                                   TerminalRiskLevel riskLevel) {
        List<TerminalEventPayload> results = new ArrayList<>();
        if (explicitEvents != null) {
            results.addAll(explicitEvents);
        }

        if (security != null) {
            int wrongPasswordCount = security.wrongPasswordCount() == null ? 0 : security.wrongPasswordCount();
            if (wrongPasswordCount > 0) {
                results.add(new TerminalEventPayload(
                        "PASSWORD_ERROR",
                        wrongPasswordCount >= 5 ? "WARNING" : "INFO",
                        "口令输入异常",
                        "累计输入错误次数：" + wrongPasswordCount,
                        "OPEN"
                ));
            }
            if (Boolean.TRUE.equals(security.fingerprintChanged())) {
                results.add(new TerminalEventPayload(
                        "FINGERPRINT_CHANGED",
                        "WARNING",
                        "指纹录入发生变化",
                        "终端指纹录入状态与基线不一致",
                        "OPEN"
                ));
            }
            if (Boolean.TRUE.equals(security.configModified())) {
                results.add(new TerminalEventPayload(
                        "CONFIG_MODIFIED",
                        riskLevel == TerminalRiskLevel.CRITICAL ? "CRITICAL" : "WARNING",
                        "指定配置文件发生修改",
                        "终端关键配置项与基线存在差异",
                        "OPEN"
                ));
            }
            if (isAbnormalStatus(security.passwordModuleStatus())) {
                results.add(new TerminalEventPayload(
                        "PASSWORD_MODULE_ABNORMAL",
                        "HIGH",
                        "密码模块状态异常",
                        "当前状态：" + security.passwordModuleStatus(),
                        "OPEN"
                ));
            }
            if (isAbnormalStatus(security.passwordSuiteStatus())) {
                results.add(new TerminalEventPayload(
                        "PASSWORD_SUITE_ABNORMAL",
                        "HIGH",
                        "密码服务套件状态异常",
                        "当前状态：" + security.passwordSuiteStatus(),
                        "OPEN"
                ));
            }
        }

        if (softwareChanges != null && !softwareChanges.isEmpty()) {
            results.add(new TerminalEventPayload(
                    "SOFTWARE_CHANGED",
                    "INFO",
                    "检测到软件变更",
                    "本次上报包含 " + softwareChanges.size() + " 条软件安装/更新/卸载记录",
                    "OPEN"
            ));
        }
        if (peripheralEvents != null && !peripheralEvents.isEmpty()) {
            results.add(new TerminalEventPayload(
                    "PERIPHERAL_CHANGED",
                    "WARNING",
                    "检测到外设接入事件",
                    "本次上报包含 " + peripheralEvents.size() + " 条外设接入记录",
                    "OPEN"
            ));
        }
        return results;
    }
}
