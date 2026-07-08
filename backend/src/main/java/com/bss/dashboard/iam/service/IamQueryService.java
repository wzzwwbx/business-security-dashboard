package com.bss.dashboard.iam.service;

import com.bss.dashboard.iam.dto.IamLoginAuditDto;
import com.bss.dashboard.iam.dto.IamOperationAuditDto;
import com.bss.dashboard.iam.dto.IamPermissionDto;
import com.bss.dashboard.iam.dto.IamRoleDto;
import com.bss.dashboard.iam.repository.IamRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Profile("mysql")
public class IamQueryService {

    private final IamRepository repository;

    public IamQueryService(IamRepository repository) {
        this.repository = repository;
    }

    public List<IamRoleDto> listRoles() {
        return repository.listRoles();
    }

    public List<IamPermissionDto> listPermissions() {
        return repository.listPermissions();
    }

    public List<IamLoginAuditDto> listLoginAudits(int limit) {
        return repository.listLoginAudits(limit);
    }

    public List<IamOperationAuditDto> listOperationAudits(int limit) {
        return repository.listOperationAudits(limit);
    }
}
