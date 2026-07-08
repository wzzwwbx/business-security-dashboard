package com.bss.dashboard.iam.service;

import com.bss.dashboard.iam.config.IamProperties;
import com.bss.dashboard.iam.dto.BootstrapInitRequest;
import com.bss.dashboard.iam.dto.BootstrapStatusDto;
import com.bss.dashboard.iam.repository.IamRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Profile("mysql")
public class IamBootstrapService {

    private final IamRepository repository;
    private final IamProperties properties;
    private final PasswordEncoder passwordEncoder;

    public IamBootstrapService(IamRepository repository, IamProperties properties, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.properties = properties;
        this.passwordEncoder = passwordEncoder;
    }

    public BootstrapStatusDto getStatus() {
        return new BootstrapStatusDto(
                properties.getBootstrap().isEnabled(),
                repository.isBootstrapInitialized(),
                List.of(
                        properties.getBootstrap().getSystemAdminUsername(),
                        properties.getBootstrap().getSecurityAdminUsername(),
                        properties.getBootstrap().getAuditAdminUsername()
                )
        );
    }

    @Transactional
    public BootstrapStatusDto initialize(BootstrapInitRequest request) {
        if (!properties.getBootstrap().isEnabled()) {
            throw new IllegalStateException("系统未开启初始化入口");
        }
        if (repository.isBootstrapInitialized() || repository.countUsers() > 0) {
            throw new IllegalStateException("系统已完成初始化，不能重复创建三员账号");
        }
        repository.initializeBuiltInAdmins(
                properties.getBootstrap().getSystemAdminUsername(),
                properties.getBootstrap().getSecurityAdminUsername(),
                properties.getBootstrap().getAuditAdminUsername(),
                passwordEncoder.encode(request.systemAdminPassword()),
                passwordEncoder.encode(request.securityAdminPassword()),
                passwordEncoder.encode(request.auditAdminPassword())
        );
        return getStatus();
    }
}
