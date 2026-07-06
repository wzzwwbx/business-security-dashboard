package com.bss.probe.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "probe")
public class ProbeProperties {

    private String serverUrl = "http://127.0.0.1:8080/api/ops/ingest/probe";
    private String sourceSystem = "linux-arm-probe";
    private String agentKey = "probe-dev-agent";
    private String agentSecret = "dev-probe-secret";
    private String spoolDir = "./data/spool";
    private long spoolMaxSizeMb = 200;
    private long requestTimeoutMs = 10000;
    private int processTopN = 10;
    private List<String> whitelistProcesses = new ArrayList<>();
    private final Schedule schedule = new Schedule();

    public String getServerUrl() {
        return serverUrl;
    }

    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public String getSourceSystem() {
        return sourceSystem;
    }

    public void setSourceSystem(String sourceSystem) {
        this.sourceSystem = sourceSystem;
    }

    public String getAgentKey() {
        return agentKey;
    }

    public void setAgentKey(String agentKey) {
        this.agentKey = agentKey;
    }

    public String getAgentSecret() {
        return agentSecret;
    }

    public void setAgentSecret(String agentSecret) {
        this.agentSecret = agentSecret;
    }

    public String getSpoolDir() {
        return spoolDir;
    }

    public void setSpoolDir(String spoolDir) {
        this.spoolDir = spoolDir;
    }

    public long getSpoolMaxSizeMb() {
        return spoolMaxSizeMb;
    }

    public void setSpoolMaxSizeMb(long spoolMaxSizeMb) {
        this.spoolMaxSizeMb = spoolMaxSizeMb;
    }

    public long getRequestTimeoutMs() {
        return requestTimeoutMs;
    }

    public void setRequestTimeoutMs(long requestTimeoutMs) {
        this.requestTimeoutMs = requestTimeoutMs;
    }

    public int getProcessTopN() {
        return processTopN;
    }

    public void setProcessTopN(int processTopN) {
        this.processTopN = processTopN;
    }

    public List<String> getWhitelistProcesses() {
        return whitelistProcesses;
    }

    public void setWhitelistProcesses(List<String> whitelistProcesses) {
        this.whitelistProcesses = whitelistProcesses;
    }

    public Schedule getSchedule() {
        return schedule;
    }

    public static class Schedule {
        private long fixedDelayMs = 60000;

        public long getFixedDelayMs() {
            return fixedDelayMs;
        }

        public void setFixedDelayMs(long fixedDelayMs) {
            this.fixedDelayMs = fixedDelayMs;
        }
    }
}
