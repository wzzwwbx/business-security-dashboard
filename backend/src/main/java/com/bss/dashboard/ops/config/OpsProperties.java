package com.bss.dashboard.ops.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ops")
public class OpsProperties {

    private long samplingIntervalSeconds = 60;
    private long staleAfterPeriods = 2;
    private long offlineAfterPeriods = 5;
    private long snapshotRetentionDays = 30;
    private long processRetentionDays = 7;
    private long payloadRetentionDays = 3;
    private final Probe probe = new Probe();
    private final External external = new External();
    private final Manual manual = new Manual();

    public long getSamplingIntervalSeconds() {
        return samplingIntervalSeconds;
    }

    public void setSamplingIntervalSeconds(long samplingIntervalSeconds) {
        this.samplingIntervalSeconds = samplingIntervalSeconds;
    }

    public long getStaleAfterPeriods() {
        return staleAfterPeriods;
    }

    public void setStaleAfterPeriods(long staleAfterPeriods) {
        this.staleAfterPeriods = staleAfterPeriods;
    }

    public long getOfflineAfterPeriods() {
        return offlineAfterPeriods;
    }

    public void setOfflineAfterPeriods(long offlineAfterPeriods) {
        this.offlineAfterPeriods = offlineAfterPeriods;
    }

    public long getSnapshotRetentionDays() {
        return snapshotRetentionDays;
    }

    public void setSnapshotRetentionDays(long snapshotRetentionDays) {
        this.snapshotRetentionDays = snapshotRetentionDays;
    }

    public long getProcessRetentionDays() {
        return processRetentionDays;
    }

    public void setProcessRetentionDays(long processRetentionDays) {
        this.processRetentionDays = processRetentionDays;
    }

    public long getPayloadRetentionDays() {
        return payloadRetentionDays;
    }

    public void setPayloadRetentionDays(long payloadRetentionDays) {
        this.payloadRetentionDays = payloadRetentionDays;
    }

    public Probe getProbe() {
        return probe;
    }

    public External getExternal() {
        return external;
    }

    public Manual getManual() {
        return manual;
    }

    public static class Probe {
        private boolean autoRegister = true;
        private String sharedSecret = "dev-probe-secret";

        public boolean isAutoRegister() {
            return autoRegister;
        }

        public void setAutoRegister(boolean autoRegister) {
            this.autoRegister = autoRegister;
        }

        public String getSharedSecret() {
            return sharedSecret;
        }

        public void setSharedSecret(String sharedSecret) {
            this.sharedSecret = sharedSecret;
        }
    }

    public static class External {
        private String ingestToken = "external-dev-token";

        public String getIngestToken() {
            return ingestToken;
        }

        public void setIngestToken(String ingestToken) {
            this.ingestToken = ingestToken;
        }
    }

    public static class Manual {
        private String ingestToken = "manual-dev-token";

        public String getIngestToken() {
            return ingestToken;
        }

        public void setIngestToken(String ingestToken) {
            this.ingestToken = ingestToken;
        }
    }
}
