package com.bss.dashboard.terminal.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.terminal.dto.TerminalIngestRequest;
import com.bss.dashboard.terminal.dto.TerminalIngestResultDto;
import com.bss.dashboard.terminal.service.TerminalIngestService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

/**
 * 终端接入控制器。
 *
 * <p>职责：</p>
 * <ul>
 *     <li>接收外部系统与手工注入的终端报文</li>
 *     <li>完成鉴权后调用接入服务落库</li>
 *     <li>返回统一响应</li>
 * </ul>
 */
@RestController
@Profile("mysql")
@RequestMapping("/api/terminal/ingest")
public class TerminalIngestController {

    private final TerminalIngestService ingestService;

    public TerminalIngestController(TerminalIngestService ingestService) {
        this.ingestService = Objects.requireNonNull(ingestService, "ingestService must not be null");
    }

    /**
     * 接收外部系统终端报文。
     *
     * @param token 外部系统接入令牌
     * @param request 统一终端报文
     * @return 接入结果
     */
    @PostMapping("/external")
    public ApiResponse<TerminalIngestResultDto> ingestExternal(
            @RequestHeader("X-Ingest-Token") String token,
            @Valid @RequestBody TerminalIngestRequest request
    ) {
        return ApiResponse.success("终端外部接入成功", ingestService.ingestExternal(token, request));
    }

    /**
     * 接收手工注入终端报文。
     *
     * @param token 手工注入令牌
     * @param request 统一终端报文
     * @return 接入结果
     */
    @PostMapping("/manual")
    public ApiResponse<TerminalIngestResultDto> ingestManual(
            @RequestHeader("X-Ingest-Token") String token,
            @Valid @RequestBody TerminalIngestRequest request
    ) {
        return ApiResponse.success("终端手工注入成功", ingestService.ingestManual(token, request));
    }
}
