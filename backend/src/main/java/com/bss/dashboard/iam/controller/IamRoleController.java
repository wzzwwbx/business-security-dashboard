package com.bss.dashboard.iam.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.iam.dto.IamPermissionDto;
import com.bss.dashboard.iam.dto.IamRoleDto;
import com.bss.dashboard.iam.service.IamQueryService;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/iam")
@Profile("mysql")
public class IamRoleController {

    private final IamQueryService queryService;

    public IamRoleController(IamQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('role:view')")
    public ApiResponse<List<IamRoleDto>> roles() {
        return ApiResponse.success(queryService.listRoles());
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('role:view')")
    public ApiResponse<List<IamPermissionDto>> permissions() {
        return ApiResponse.success(queryService.listPermissions());
    }
}
