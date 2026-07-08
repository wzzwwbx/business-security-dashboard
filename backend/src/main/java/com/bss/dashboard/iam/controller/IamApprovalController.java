package com.bss.dashboard.iam.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.iam.dto.ApprovalDecisionRequest;
import com.bss.dashboard.iam.dto.IamActionResultDto;
import com.bss.dashboard.iam.dto.IamApprovalTicketDto;
import com.bss.dashboard.iam.service.IamApprovalService;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/iam/approvals")
@Profile("mysql")
public class IamApprovalController {

    private final IamApprovalService approvalService;

    public IamApprovalController(IamApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('approval:view')")
    public ApiResponse<List<IamApprovalTicketDto>> list() {
        return ApiResponse.success(approvalService.listTickets());
    }

    @PostMapping("/{ticketId}/approve")
    @PreAuthorize("hasAuthority('approval:review')")
    public ApiResponse<IamActionResultDto> approve(@PathVariable Long ticketId, @Valid @RequestBody ApprovalDecisionRequest request) {
        return ApiResponse.success(approvalService.approve(ticketId, request));
    }

    @PostMapping("/{ticketId}/reject")
    @PreAuthorize("hasAuthority('approval:review')")
    public ApiResponse<IamActionResultDto> reject(@PathVariable Long ticketId, @Valid @RequestBody ApprovalDecisionRequest request) {
        return ApiResponse.success(approvalService.reject(ticketId, request));
    }
}
