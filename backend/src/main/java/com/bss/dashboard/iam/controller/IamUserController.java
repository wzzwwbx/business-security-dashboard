package com.bss.dashboard.iam.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.iam.dto.BindRolesRequest;
import com.bss.dashboard.iam.dto.CreateUserRequest;
import com.bss.dashboard.iam.dto.IamActionResultDto;
import com.bss.dashboard.iam.dto.IamUserDto;
import com.bss.dashboard.iam.dto.ResetPasswordRequest;
import com.bss.dashboard.iam.dto.UpdateUserRequest;
import com.bss.dashboard.iam.service.IamAccountService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/iam/users")
@Profile("mysql")
@PreAuthorize("hasAuthority('account:view')")
public class IamUserController {

    private final IamAccountService accountService;

    public IamUserController(IamAccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ApiResponse<List<IamUserDto>> listUsers() {
        return ApiResponse.success(accountService.listUsers());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('account:create')")
    public ApiResponse<IamActionResultDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success("用户创建成功", accountService.createUser(request));
    }

    @PatchMapping("/{userId}")
    @PreAuthorize("hasAuthority('account:update')")
    public ApiResponse<IamActionResultDto> updateUser(@PathVariable Long userId, @Valid @RequestBody UpdateUserRequest request) {
        return ApiResponse.success(accountService.updateUser(userId, request));
    }

    @PostMapping("/{userId}/disable")
    @PreAuthorize("hasAuthority('account:disable') and hasAuthority('approval:submit')")
    public ApiResponse<IamActionResultDto> disable(@PathVariable Long userId) {
        return ApiResponse.success(accountService.requestDisable(userId));
    }

    @PostMapping("/{userId}/enable")
    @PreAuthorize("hasAuthority('account:enable') and hasAuthority('approval:submit')")
    public ApiResponse<IamActionResultDto> enable(@PathVariable Long userId) {
        return ApiResponse.success(accountService.requestEnable(userId));
    }

    @PostMapping("/{userId}/reset-password")
    @PreAuthorize("hasAuthority('account:reset-password') and hasAuthority('approval:submit')")
    public ApiResponse<IamActionResultDto> resetPassword(@PathVariable Long userId, @Valid @RequestBody ResetPasswordRequest request) {
        return ApiResponse.success(accountService.requestResetPassword(userId, request));
    }

    @PutMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('account:bind-role') and hasAuthority('approval:submit')")
    public ApiResponse<IamActionResultDto> bindRoles(@PathVariable Long userId, @Valid @RequestBody BindRolesRequest request) {
        return ApiResponse.success(accountService.requestBindRoles(userId, request));
    }
}
