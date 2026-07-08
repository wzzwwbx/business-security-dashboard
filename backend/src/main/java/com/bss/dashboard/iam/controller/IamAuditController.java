package com.bss.dashboard.iam.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.iam.dto.IamLoginAuditDto;
import com.bss.dashboard.iam.dto.IamOperationAuditDto;
import com.bss.dashboard.iam.service.IamQueryService;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/iam/audit")
@Profile("mysql")
@PreAuthorize("hasAuthority('audit:view')")
public class IamAuditController {

    private final IamQueryService queryService;

    public IamAuditController(IamQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/logins")
    public ApiResponse<List<IamLoginAuditDto>> loginAudits(@RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.success(queryService.listLoginAudits(Math.min(Math.max(limit, 1), 200)));
    }

    @GetMapping("/operations")
    public ApiResponse<List<IamOperationAuditDto>> operationAudits(@RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.success(queryService.listOperationAudits(Math.min(Math.max(limit, 1), 200)));
    }
}
