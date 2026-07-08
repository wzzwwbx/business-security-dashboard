package com.bss.dashboard.terminal.dto;

import com.bss.dashboard.terminal.domain.TerminalSourceType;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

/**
 * 终端统一接入报文。
 */
public record TerminalIngestRequest(
        TerminalSourceType sourceType,
        String sourceSystem,
        String requestId,
        String externalDeviceId,
        String schemaVersion,
        String payloadType,
        String observedAt,
        @Valid TerminalPersonPayload person,
        @Valid TerminalDevicePayload device,
        @Valid TerminalSecurityPayload security,
        List<@Valid TerminalSoftwareChangePayload> softwareChanges,
        List<@Valid TerminalPeripheralPayload> peripheralEvents,
        List<@Valid TerminalEventPayload> events,
        Map<String, Object> attributes,
        Map<String, Object> metrics,
        Map<String, Object> extensions
) {
}
