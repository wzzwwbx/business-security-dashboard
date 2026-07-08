package com.bss.dashboard.situation.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.situation.dto.SituationPageDto;
import com.bss.dashboard.situation.service.SituationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/situation")
public class SituationController {

    private final SituationService situationService;

    public SituationController(SituationService situationService) {
        this.situationService = situationService;
    }

    @GetMapping("/{pageCode}")
    @PreAuthorize("@securityAccessEvaluator.canViewPage(authentication, #pageCode)")
    public ApiResponse<SituationPageDto> getPage(@PathVariable String pageCode) {
        return ApiResponse.success(situationService.getPage(pageCode));
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('page:overview:view')")
    public ApiResponse<SituationPageDto> getOverview() {
        return ApiResponse.success(situationService.getPage("overview"));
    }

    @GetMapping("/terminal")
    @PreAuthorize("hasAuthority('page:terminal:view')")
    public ApiResponse<SituationPageDto> getTerminal() {
        return ApiResponse.success(situationService.getPage("terminal"));
    }

    @GetMapping("/business")
    @PreAuthorize("hasAuthority('page:business:view')")
    public ApiResponse<SituationPageDto> getBusiness() {
        return ApiResponse.success(situationService.getPage("business"));
    }

    @GetMapping("/security")
    @PreAuthorize("hasAuthority('page:security:view')")
    public ApiResponse<SituationPageDto> getSecurity() {
        return ApiResponse.success(situationService.getPage("security"));
    }
}
