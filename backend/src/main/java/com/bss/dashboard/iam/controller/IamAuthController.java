package com.bss.dashboard.iam.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.iam.dto.ChangePasswordRequest;
import com.bss.dashboard.iam.dto.CurrentUserDto;
import com.bss.dashboard.iam.dto.LoginRequest;
import com.bss.dashboard.iam.service.IamAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/iam/auth")
@Profile("mysql")
public class IamAuthController {

    private final IamAuthService authService;

    public IamAuthController(IamAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<CurrentUserDto> login(@Valid @RequestBody LoginRequest request,
                                             HttpServletRequest httpServletRequest,
                                             HttpServletResponse httpServletResponse) {
        return ApiResponse.success("登录成功", authService.login(request, httpServletRequest, httpServletResponse));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        authService.logout(request);
        return ApiResponse.success("已退出登录", null);
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserDto> me(Authentication authentication) {
        return ApiResponse.success(authService.me(authentication));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ApiResponse.success("密码修改成功", null);
    }
}
