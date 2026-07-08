package com.bss.dashboard.terminal.support;

import com.bss.dashboard.terminal.domain.TerminalSourceType;
import com.bss.dashboard.terminal.dto.TerminalDevicePayload;
import com.bss.dashboard.terminal.dto.TerminalEventPayload;
import com.bss.dashboard.terminal.dto.TerminalIngestRequest;
import com.bss.dashboard.terminal.dto.TerminalPeripheralPayload;
import com.bss.dashboard.terminal.dto.TerminalPersonPayload;
import com.bss.dashboard.terminal.dto.TerminalSecurityPayload;
import com.bss.dashboard.terminal.dto.TerminalSoftwareChangePayload;
import com.bss.dashboard.terminal.repository.TerminalRepository;
import com.bss.dashboard.terminal.service.TerminalIngestService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 终端域演示灌数器。
 */
@Component
@Profile("mysql")
public class TerminalDemoDataSeeder implements ApplicationRunner {

    private final TerminalRepository repository;
    private final TerminalIngestService ingestService;

    public TerminalDemoDataSeeder(TerminalRepository repository, TerminalIngestService ingestService) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.ingestService = Objects.requireNonNull(ingestService, "ingestService must not be null");
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.countDevices() > 0) {
            return;
        }

        repository.ensurePersonProfile("P-001", "hr-1001", "ZH1001", "张卫国", "张卫国", "网络安全处", "总部/网络安全处", "终端安全主管", "zhangwg@example.com", "HR");
        repository.ensurePersonPhone("P-001", "13800010001", "138****0001", "HR");
        repository.ensurePersonProfile("P-002", "hr-1002", "ZH1002", "李春晓", "李春晓", "华东保障组", "总部/华东保障组", "保障工程师", "licx@example.com", "HR");
        repository.ensurePersonPhone("P-002", "13900020002", "139****0002", "HR");
        repository.ensurePersonProfile("P-003", "hr-1003", "ZH1003", "周海宁", "周海宁", "境外联保组", "总部/境外联保组", "外勤保障员", "zhouhn@example.com", "HR");
        repository.ensurePersonPhone("P-003", "13700030003", "137****0003", "HR");

        TerminalIngestRequest externalOne = new TerminalIngestRequest(
                TerminalSourceType.EXTERNAL_API,
                "zero-trust-gateway",
                "zt-terminal-001",
                "zt-device-001",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusMinutes(5).toString(),
                new TerminalPersonPayload(null, "ZH1001", null, "13800010001"),
                new TerminalDevicePayload("mobile-bj-001", "北京专用手机-01", "北京专用手机-01", "10.23.6.21", "HarmonyOS 4.2", "860000000001111", "A1000000001111", "46000", 5368709120L),
                new TerminalSecurityPayload("正常", "5.2.1", "正常", 1, false, false, "LOW", 28, "密码模块与服务套件状态正常"),
                List.of(new TerminalSoftwareChangePayload("INSTALL", "零信任客户端", "3.8.2", "安装企业零信任客户端补丁包")),
                List.of(),
                List.of(new TerminalEventPayload("DEVICE_ONLINE", "INFO", "终端在线上报", "终端状态已回传到态势平台", "OPEN")),
                Map.of("reportChannel", "sdk"),
                Map.of("trafficPackageMb", 5120),
                Map.of("passwordModuleVendor", "国产密码卡")
        );
        ingestService.ingestExternal("terminal-external-dev-token", externalOne);

        TerminalIngestRequest externalTwo = new TerminalIngestRequest(
                TerminalSourceType.EXTERNAL_API,
                "zero-trust-gateway",
                "zt-terminal-002",
                "zt-device-002",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusMinutes(12).toString(),
                new TerminalPersonPayload("P-002", null, null, "13900020002"),
                new TerminalDevicePayload("mobile-sh-002", "华东保障终端-02", "华东保障终端-02", "10.31.9.18", "Android 14", "860000000002222", "A1000000002222", "46011", 12884901888L),
                new TerminalSecurityPayload("异常", "5.1.9", "正常", 6, true, true, "HIGH", 84, "密码模块状态异常，且存在指纹与配置变更"),
                List.of(
                        new TerminalSoftwareChangePayload("UPDATE", "移动办公套件", "7.4.0", "更新到 7.4.0 版本"),
                        new TerminalSoftwareChangePayload("UNINSTALL", "第三方视频工具", "2.6.1", "已卸载未备案软件")
                ),
                List.of(new TerminalPeripheralPayload("摄像头", "外接摄像头", "INSERT", "检测到临时外接摄像头接入")),
                List.of(new TerminalEventPayload("TRUST_POLICY_HIT", "HIGH", "零信任策略命中", "命中高敏操作策略，建议复核终端使用场景", "OPEN")),
                Map.of("reportChannel", "sdk"),
                Map.of("trafficPackageMb", 12288),
                Map.of("policyHitCount", 3)
        );
        ingestService.ingestExternal("terminal-external-dev-token", externalTwo);

        TerminalIngestRequest manualLead = new TerminalIngestRequest(
                TerminalSourceType.MANUAL_IMPORT,
                "security-ops-manual",
                "manual-terminal-003",
                "manual-device-003",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusMinutes(26).toString(),
                new TerminalPersonPayload(null, null, null, "13700030003"),
                new TerminalDevicePayload("mobile-hw-003", "境外保障终端-03", "境外保障终端-03", "172.18.4.33", "Android 13", "860000000003333", "A1000000003333", "46003", 8589934592L),
                new TerminalSecurityPayload("正常", "5.0.8", "降级", 3, false, true, "MEDIUM", 63, "密码服务套件处于降级运行状态"),
                List.of(),
                List.of(new TerminalPeripheralPayload("无线网卡", "临时无线网卡", "INSERT", "境外任务时接入临时无线网卡")),
                List.of(new TerminalEventPayload("ROAMING_NOTICE", "WARNING", "漫游链路切换", "境外保障终端切换到漫游链路，请关注流量与策略下发", "OPEN")),
                Map.of("reportChannel", "manual"),
                Map.of("trafficPackageMb", 8192),
                Map.of("note", "用于演示手机号关联人员的终端归一")
        );
        ingestService.ingestManual("terminal-manual-dev-token", manualLead);

        ingestService.ingestExternal("terminal-external-dev-token", new TerminalIngestRequest(
                TerminalSourceType.EXTERNAL_API,
                "zero-trust-gateway",
                "zt-terminal-001-history-01",
                "zt-device-001",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusHours(18).toString(),
                new TerminalPersonPayload(null, "ZH1001", null, "13800010001"),
                new TerminalDevicePayload("mobile-bj-001", "北京专用手机-01", "北京专用手机-01", "10.23.6.21", "HarmonyOS 4.2", "860000000001111", "A1000000001111", "46000", 3221225472L),
                new TerminalSecurityPayload("正常", "5.2.0", "正常", 0, false, false, "LOW", 18, "上一周期运行平稳"),
                List.of(),
                List.of(),
                List.of(),
                Map.of("reportChannel", "sdk"),
                Map.of("trafficPackageMb", 3072),
                Map.of()
        ));
        ingestService.ingestExternal("terminal-external-dev-token", new TerminalIngestRequest(
                TerminalSourceType.EXTERNAL_API,
                "zero-trust-gateway",
                "zt-terminal-001-history-02",
                "zt-device-001",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusHours(6).toString(),
                new TerminalPersonPayload(null, "ZH1001", null, "13800010001"),
                new TerminalDevicePayload("mobile-bj-001", "北京专用手机-01", "北京专用手机-01", "10.23.6.21", "HarmonyOS 4.2", "860000000001111", "A1000000001111", "46000", 4294967296L),
                new TerminalSecurityPayload("正常", "5.2.1", "正常", 1, false, false, "LOW", 24, "当前终端保持正常使用"),
                List.of(),
                List.of(),
                List.of(),
                Map.of("reportChannel", "sdk"),
                Map.of("trafficPackageMb", 4096),
                Map.of()
        ));

        ingestService.ingestExternal("terminal-external-dev-token", new TerminalIngestRequest(
                TerminalSourceType.EXTERNAL_API,
                "zero-trust-gateway",
                "zt-terminal-002-history-01",
                "zt-device-002",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusHours(20).toString(),
                new TerminalPersonPayload("P-002", null, null, "13900020002"),
                new TerminalDevicePayload("mobile-sh-002", "华东保障终端-02", "华东保障终端-02", "10.31.9.18", "Android 14", "860000000002222", "A1000000002222", "46011", 10737418240L),
                new TerminalSecurityPayload("正常", "5.1.7", "正常", 2, false, false, "MEDIUM", 52, "存在轻微异常，风险可控"),
                List.of(),
                List.of(),
                List.of(),
                Map.of("reportChannel", "sdk"),
                Map.of("trafficPackageMb", 10240),
                Map.of()
        ));
        ingestService.ingestExternal("terminal-external-dev-token", new TerminalIngestRequest(
                TerminalSourceType.EXTERNAL_API,
                "zero-trust-gateway",
                "zt-terminal-002-history-02",
                "zt-device-002",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusHours(8).toString(),
                new TerminalPersonPayload("P-002", null, null, "13900020002"),
                new TerminalDevicePayload("mobile-sh-002", "华东保障终端-02", "华东保障终端-02", "10.31.9.18", "Android 14", "860000000002222", "A1000000002222", "46011", 11811160064L),
                new TerminalSecurityPayload("异常", "5.1.8", "正常", 4, true, false, "HIGH", 71, "风险有上升趋势，建议重点关注"),
                List.of(),
                List.of(),
                List.of(),
                Map.of("reportChannel", "sdk"),
                Map.of("trafficPackageMb", 11264),
                Map.of()
        ));

        ingestService.ingestManual("terminal-manual-dev-token", new TerminalIngestRequest(
                TerminalSourceType.MANUAL_IMPORT,
                "security-ops-manual",
                "manual-terminal-003-history-01",
                "manual-device-003",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusHours(22).toString(),
                new TerminalPersonPayload(null, null, null, "13700030003"),
                new TerminalDevicePayload("mobile-hw-003", "境外保障终端-03", "境外保障终端-03", "172.18.4.33", "Android 13", "860000000003333", "A1000000003333", "46003", 6442450944L),
                new TerminalSecurityPayload("正常", "5.0.7", "正常", 1, false, false, "LOW", 31, "境外链路运行稳定"),
                List.of(),
                List.of(),
                List.of(),
                Map.of("reportChannel", "manual"),
                Map.of("trafficPackageMb", 6144),
                Map.of()
        ));
        ingestService.ingestManual("terminal-manual-dev-token", new TerminalIngestRequest(
                TerminalSourceType.MANUAL_IMPORT,
                "security-ops-manual",
                "manual-terminal-003-history-02",
                "manual-device-003",
                "v1",
                "terminal-snapshot",
                OffsetDateTime.now().minusHours(10).toString(),
                new TerminalPersonPayload(null, null, null, "13700030003"),
                new TerminalDevicePayload("mobile-hw-003", "境外保障终端-03", "境外保障终端-03", "172.18.4.33", "Android 13", "860000000003333", "A1000000003333", "46003", 7516192768L),
                new TerminalSecurityPayload("正常", "5.0.8", "降级", 2, false, true, "MEDIUM", 58, "出现配置修改，风险略有抬升"),
                List.of(),
                List.of(),
                List.of(),
                Map.of("reportChannel", "manual"),
                Map.of("trafficPackageMb", 7168),
                Map.of()
        ));
    }
}
