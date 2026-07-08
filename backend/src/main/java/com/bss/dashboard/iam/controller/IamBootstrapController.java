package com.bss.dashboard.iam.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.iam.dto.BootstrapInitRequest;
import com.bss.dashboard.iam.dto.BootstrapStatusDto;
import com.bss.dashboard.iam.service.IamBootstrapService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/iam/bootstrap")
@Profile("mysql")
public class IamBootstrapController {

    private final IamBootstrapService bootstrapService;

    public IamBootstrapController(IamBootstrapService bootstrapService) {
        this.bootstrapService = bootstrapService;
    }

    @GetMapping("/status")
    public ApiResponse<BootstrapStatusDto> getStatus() {
        return ApiResponse.success(bootstrapService.getStatus());
    }

    @PostMapping("/init")
    public ApiResponse<BootstrapStatusDto> initialize(@Valid @RequestBody BootstrapInitRequest request) {
        return ApiResponse.success("系统初始化完成", bootstrapService.initialize(request));
    }
}
