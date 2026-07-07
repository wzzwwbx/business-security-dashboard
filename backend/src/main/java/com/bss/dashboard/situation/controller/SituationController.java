package com.bss.dashboard.situation.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.situation.dto.SituationPageDto;
import com.bss.dashboard.situation.service.SituationService;
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
    public ApiResponse<SituationPageDto> getPage(@PathVariable String pageCode) {
        return ApiResponse.success(situationService.getPage(pageCode));
    }

    @GetMapping("/overview")
    public ApiResponse<SituationPageDto> getOverview() {
        return ApiResponse.success(situationService.getPage("overview"));
    }

    @GetMapping("/terminal")
    public ApiResponse<SituationPageDto> getTerminal() {
        return ApiResponse.success(situationService.getPage("terminal"));
    }

    @GetMapping("/business")
    public ApiResponse<SituationPageDto> getBusiness() {
        return ApiResponse.success(situationService.getPage("business"));
    }

    @GetMapping("/security")
    public ApiResponse<SituationPageDto> getSecurity() {
        return ApiResponse.success(situationService.getPage("security"));
    }
}
