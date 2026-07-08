package com.bss.dashboard.terminal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 终端态势配置。
 *
 * <p>用于统一管理终端域采样周期、来源鉴权与保留周期配置。</p>
 */
@ConfigurationProperties(prefix = "terminal")
public class TerminalProperties {

    private long samplingIntervalSeconds = 300;
    private long staleAfterPeriods = 2;
    private long offlineAfterPeriods = 5;
    private long snapshotRetentionDays = 30;
    private long eventRetentionDays = 30;
    private long payloadRetentionDays = 3;
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

    public long getEventRetentionDays() {
        return eventRetentionDays;
    }

    public void setEventRetentionDays(long eventRetentionDays) {
        this.eventRetentionDays = eventRetentionDays;
    }

    public long getPayloadRetentionDays() {
        return payloadRetentionDays;
    }

    public void setPayloadRetentionDays(long payloadRetentionDays) {
        this.payloadRetentionDays = payloadRetentionDays;
    }

    public External getExternal() {
        return external;
    }

    public Manual getManual() {
        return manual;
    }

    public static class External {

        private String ingestToken = "terminal-external-dev-token";

        public String getIngestToken() {
            return ingestToken;
        }

        public void setIngestToken(String ingestToken) {
            this.ingestToken = ingestToken;
        }
    }

    public static class Manual {

        private String ingestToken = "terminal-manual-dev-token";

        public String getIngestToken() {
            return ingestToken;
        }

        public void setIngestToken(String ingestToken) {
            this.ingestToken = ingestToken;
        }
    }
}
