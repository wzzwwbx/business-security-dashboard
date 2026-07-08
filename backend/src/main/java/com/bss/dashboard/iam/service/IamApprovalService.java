package com.bss.dashboard.iam.service;

import com.bss.dashboard.iam.domain.IamApprovalType;
import com.bss.dashboard.iam.domain.IamUserStatus;
import com.bss.dashboard.iam.dto.ApprovalDecisionRequest;
import com.bss.dashboard.iam.dto.IamActionResultDto;
import com.bss.dashboard.iam.dto.IamApprovalTicketDto;
import com.bss.dashboard.iam.repository.IamRepository;
import com.bss.dashboard.iam.security.SessionPrincipal;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Profile("mysql")
public class IamApprovalService {

    private final IamRepository repository;
    private final IamAuthService authService;

    public IamApprovalService(IamRepository repository, IamAuthService authService) {
        this.repository = repository;
        this.authService = authService;
    }

    public List<IamApprovalTicketDto> listTickets() {
        return repository.listApprovalTickets();
    }

    @Transactional
    public IamActionResultDto approve(Long ticketId, ApprovalDecisionRequest request) {
        SessionPrincipal principal = authService.extractPrincipal(SecurityContextHolder.getContext().getAuthentication());
        IamRepository.ApprovalTicketRecord ticket = repository.findApprovalTicket(ticketId);
        if (principal.userId().equals(ticket.requesterUserId())) {
            throw new IllegalArgumentException("发起人不能审批自己的工单");
        }
        Map<String, Object> payload = repository.findApprovalPayload(ticketId);
        applyTicket(ticket, payload);
        repository.approveTicket(ticketId, principal.userId(), request.reviewComment());
        repository.insertOperationAudit(principal.userId(), principal.username(), "APPROVE_TICKET", ticket.targetType(), ticket.targetId(), ticket.targetLabel(), "SUCCESS", UUID.randomUUID().toString(), Map.of("ticketId", ticketId, "ticketType", ticket.ticketType().name()));
        return new IamActionResultDto("APPROVE_TICKET", "SUCCESS", Long.valueOf(ticket.targetId()), ticketId, "审批已通过并完成执行");
    }

    @Transactional
    public IamActionResultDto reject(Long ticketId, ApprovalDecisionRequest request) {
        SessionPrincipal principal = authService.extractPrincipal(SecurityContextHolder.getContext().getAuthentication());
        IamRepository.ApprovalTicketRecord ticket = repository.findApprovalTicket(ticketId);
        if (principal.userId().equals(ticket.requesterUserId())) {
            throw new IllegalArgumentException("发起人不能审批自己的工单");
        }
        repository.rejectTicket(ticketId, principal.userId(), request.reviewComment());
        repository.insertOperationAudit(principal.userId(), principal.username(), "REJECT_TICKET", ticket.targetType(), ticket.targetId(), ticket.targetLabel(), "SUCCESS", UUID.randomUUID().toString(), Map.of("ticketId", ticketId, "ticketType", ticket.ticketType().name()));
        return new IamActionResultDto("REJECT_TICKET", "SUCCESS", Long.valueOf(ticket.targetId()), ticketId, "审批已驳回");
    }

    private void applyTicket(IamRepository.ApprovalTicketRecord ticket, Map<String, Object> payload) {
        Long userId = Long.valueOf(String.valueOf(payload.get("userId")));
        switch (ticket.ticketType()) {
            case USER_DISABLE -> repository.updateUserStatus(userId, IamUserStatus.DISABLED);
            case USER_ENABLE -> repository.updateUserStatus(userId, IamUserStatus.ACTIVE);
            case USER_RESET_PASSWORD -> repository.upsertPassword(userId, String.valueOf(payload.get("passwordHash")), true);
            case USER_ROLE_REBIND -> repository.replaceUserRoles(userId, toStringList(payload.get("roleCodes")));
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        throw new IllegalArgumentException("审批载荷中的角色列表格式无效");
    }
}
