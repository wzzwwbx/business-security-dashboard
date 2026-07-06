package com.bss.dashboard.support;

import com.bss.dashboard.dto.DashboardRuntimeInfo;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DashboardRuntimeResolver {

    private final Environment environment;

    public DashboardRuntimeResolver(Environment environment) {
        this.environment = environment;
    }

    public DashboardRuntimeInfo resolve() {
        String[] activeProfiles = environment.getActiveProfiles();
        String activeProfile = activeProfiles.length > 0 ? String.join(",", activeProfiles) : "default";
        boolean mysqlEnabled = Arrays.stream(activeProfiles).anyMatch("mysql"::equalsIgnoreCase);
        String applicationName = environment.getProperty("spring.application.name", "business-security-dashboard");
        String javaVersion = System.getProperty("java.version", "unknown");

        return new DashboardRuntimeInfo(
                applicationName,
                activeProfile,
                mysqlEnabled ? "mysql" : "mock",
                "/api/dashboard",
                javaVersion,
                mysqlEnabled,
                mysqlEnabled,
                "UP"
        );
    }
}
