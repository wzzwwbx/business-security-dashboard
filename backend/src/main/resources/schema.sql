CREATE TABLE IF NOT EXISTS dashboard_page (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    page_code VARCHAR(64) NOT NULL UNIQUE,
    page_name VARCHAR(128) NOT NULL,
    route VARCHAR(128) NOT NULL,
    badge INT NULL,
    page_title VARCHAR(255) NOT NULL,
    page_subtitle VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    last_updated VARCHAR(64) NOT NULL,
    page_order INT NOT NULL,
    active TINYINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_metric (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    page_code VARCHAR(64) NOT NULL,
    metric_label VARCHAR(128) NOT NULL,
    metric_value VARCHAR(64) NOT NULL,
    metric_unit VARCHAR(32) NULL,
    trend VARCHAR(128) NULL,
    status VARCHAR(32) NULL,
    description VARCHAR(255) NULL,
    metric_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_metric_page_code (page_code)
);

CREATE TABLE IF NOT EXISTS dashboard_widget (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    page_code VARCHAR(64) NOT NULL,
    widget_code VARCHAR(64) NOT NULL,
    widget_title VARCHAR(128) NOT NULL,
    widget_type VARCHAR(64) NOT NULL,
    col_span INT NOT NULL,
    min_height INT NULL,
    tags_json JSON NULL,
    payload_json JSON NOT NULL,
    widget_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_widget_page_code (page_code)
);

CREATE TABLE IF NOT EXISTS ops_host (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    host_code VARCHAR(128) NOT NULL UNIQUE,
    hostname VARCHAR(128) NOT NULL,
    display_name VARCHAR(255) NULL,
    primary_ip VARCHAR(64) NOT NULL,
    os_name VARCHAR(128) NOT NULL,
    kernel_version VARCHAR(128) NOT NULL,
    arch VARCHAR(64) NOT NULL,
    cpu_cores INT NOT NULL,
    memory_total_bytes BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    last_observed_at TIMESTAMP NULL,
    last_source_type VARCHAR(64) NULL,
    last_source_system VARCHAR(128) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ops_host_status (status),
    INDEX idx_ops_host_last_observed (last_observed_at)
);

CREATE TABLE IF NOT EXISTS ops_host_binding (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    host_id BIGINT NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    external_asset_id VARCHAR(128) NOT NULL,
    external_host_name VARCHAR(255) NULL,
    binding_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ops_host_binding (source_system, external_asset_id),
    INDEX idx_ops_host_binding_host_id (host_id)
);

CREATE TABLE IF NOT EXISTS ops_source_agent (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agent_key VARCHAR(128) NOT NULL UNIQUE,
    source_type VARCHAR(64) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    secret_hash VARCHAR(255) NOT NULL,
    enabled TINYINT NOT NULL DEFAULT 1,
    last_seen_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ops_source_agent_type_system (source_type, source_system)
);

CREATE TABLE IF NOT EXISTS ops_host_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    host_id BIGINT NOT NULL,
    source_type VARCHAR(64) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    cpu_usage_pct DECIMAL(7,2) NOT NULL,
    memory_usage_pct DECIMAL(7,2) NOT NULL,
    load1 DECIMAL(7,2) NOT NULL,
    load5 DECIMAL(7,2) NOT NULL,
    load15 DECIMAL(7,2) NOT NULL,
    mem_used_bytes BIGINT NOT NULL,
    mem_available_bytes BIGINT NOT NULL,
    swap_used_bytes BIGINT NOT NULL,
    disk_used_bytes BIGINT NOT NULL,
    disk_total_bytes BIGINT NOT NULL,
    disk_usage_pct DECIMAL(7,2) NOT NULL,
    tcp_established_count INT NOT NULL,
    process_count INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ops_host_snapshot_host_time (host_id, observed_at),
    INDEX idx_ops_host_snapshot_source (source_type, source_system)
);

CREATE TABLE IF NOT EXISTS ops_netif_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    host_snapshot_id BIGINT NOT NULL,
    interface_name VARCHAR(64) NOT NULL,
    rx_bytes_per_sec BIGINT NOT NULL,
    tx_bytes_per_sec BIGINT NOT NULL,
    rx_packets_per_sec BIGINT NOT NULL,
    tx_packets_per_sec BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ops_netif_snapshot_snapshot (host_snapshot_id)
);

CREATE TABLE IF NOT EXISTS ops_process_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    host_id BIGINT NOT NULL,
    host_snapshot_id BIGINT NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    pid INT NOT NULL,
    process_name VARCHAR(128) NOT NULL,
    command_line TEXT NULL,
    cpu_usage_pct DECIMAL(7,2) NOT NULL,
    memory_rss_bytes BIGINT NOT NULL,
    state VARCHAR(32) NOT NULL,
    is_whitelisted TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ops_process_snapshot_host_time (host_id, observed_at),
    INDEX idx_ops_process_snapshot_snapshot (host_snapshot_id)
);

CREATE TABLE IF NOT EXISTS ops_alert (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    host_id BIGINT NOT NULL,
    alert_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    detail TEXT NULL,
    first_seen_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ops_alert_host_status (host_id, status),
    INDEX idx_ops_alert_last_seen (last_seen_at)
);

CREATE TABLE IF NOT EXISTS ops_ingest_event (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_type VARCHAR(64) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    request_id VARCHAR(128) NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    ingest_status VARCHAR(32) NOT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ops_ingest_event_source (source_type, source_system),
    INDEX idx_ops_ingest_event_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS ops_ingest_payload (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_type VARCHAR(64) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    request_id VARCHAR(128) NOT NULL,
    payload_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ops_ingest_payload_created_at (created_at)
);
