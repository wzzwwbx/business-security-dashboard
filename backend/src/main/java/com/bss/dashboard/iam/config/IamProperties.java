package com.bss.dashboard.iam.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("iam")
public class IamProperties {

    private final Login login = new Login();
    private final Bootstrap bootstrap = new Bootstrap();

    public Login getLogin() {
        return login;
    }

    public Bootstrap getBootstrap() {
        return bootstrap;
    }

    public static class Login {
        private int maxFailedAttempts = 5;
        private int lockMinutes = 15;

        public int getMaxFailedAttempts() {
            return maxFailedAttempts;
        }

        public void setMaxFailedAttempts(int maxFailedAttempts) {
            this.maxFailedAttempts = maxFailedAttempts;
        }

        public int getLockMinutes() {
            return lockMinutes;
        }

        public void setLockMinutes(int lockMinutes) {
            this.lockMinutes = lockMinutes;
        }
    }

    public static class Bootstrap {
        private boolean enabled = true;
        private String systemAdminUsername = "sysadmin";
        private String securityAdminUsername = "secadmin";
        private String auditAdminUsername = "auditadmin";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getSystemAdminUsername() {
            return systemAdminUsername;
        }

        public void setSystemAdminUsername(String systemAdminUsername) {
            this.systemAdminUsername = systemAdminUsername;
        }

        public String getSecurityAdminUsername() {
            return securityAdminUsername;
        }

        public void setSecurityAdminUsername(String securityAdminUsername) {
            this.securityAdminUsername = securityAdminUsername;
        }

        public String getAuditAdminUsername() {
            return auditAdminUsername;
        }

        public void setAuditAdminUsername(String auditAdminUsername) {
            this.auditAdminUsername = auditAdminUsername;
        }
    }
}
