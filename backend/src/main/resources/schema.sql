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

CREATE TABLE IF NOT EXISTS ops_site (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    site_code VARCHAR(64) NOT NULL UNIQUE,
    site_name VARCHAR(128) NOT NULL,
    country_code VARCHAR(16) NOT NULL,
    country_name VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    site_id BIGINT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    last_observed_at TIMESTAMP NULL,
    last_source_type VARCHAR(64) NULL,
    last_source_system VARCHAR(128) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ops_host_status (status),
    INDEX idx_ops_host_site (site_id),
    INDEX idx_ops_host_last_observed (last_observed_at)
);

CREATE TABLE IF NOT EXISTS ops_device (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    site_id BIGINT NOT NULL,
    host_id BIGINT NULL,
    device_code VARCHAR(64) NOT NULL UNIQUE,
    device_name VARCHAR(128) NOT NULL,
    device_type VARCHAR(32) NOT NULL,
    primary_ip VARCHAR(64) NULL,
    vendor VARCHAR(128) NULL,
    model VARCHAR(128) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    topology_x INT NOT NULL,
    topology_y INT NOT NULL,
    metrics_json JSON NULL,
    policies_json JSON NULL,
    audits_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ops_device_site (site_id),
    INDEX idx_ops_device_host (host_id)
);

CREATE TABLE IF NOT EXISTS ops_device_link (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    site_id BIGINT NOT NULL,
    source_device_id BIGINT NOT NULL,
    target_device_id BIGINT NOT NULL,
    link_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    latency_ms INT NOT NULL DEFAULT 0,
    bandwidth VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ops_link_site (site_id),
    INDEX idx_ops_link_devices (source_device_id, target_device_id)
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

CREATE TABLE IF NOT EXISTS iam_bootstrap_state (
    id BIGINT PRIMARY KEY,
    initialized TINYINT NOT NULL DEFAULT 0,
    initialized_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iam_session_policy (
    id BIGINT PRIMARY KEY,
    max_failed_attempts INT NOT NULL,
    lock_minutes INT NOT NULL,
    session_timeout_minutes INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iam_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    built_in TINYINT NOT NULL DEFAULT 0,
    force_password_change TINYINT NOT NULL DEFAULT 1,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_iam_user_status (status),
    INDEX idx_iam_user_last_login (last_login_at)
);

CREATE TABLE IF NOT EXISTS iam_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_code VARCHAR(64) NOT NULL UNIQUE,
    role_name VARCHAR(64) NOT NULL,
    role_type VARCHAR(32) NOT NULL,
    description VARCHAR(255) NULL,
    enabled TINYINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_iam_role_type (role_type)
);

CREATE TABLE IF NOT EXISTS iam_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(128) NOT NULL UNIQUE,
    resource_type VARCHAR(64) NOT NULL,
    action_code VARCHAR(64) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_iam_permission_resource (resource_type, action_code)
);

CREATE TABLE IF NOT EXISTS iam_role_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_iam_role_permission (role_id, permission_id),
    INDEX idx_iam_role_permission_permission (permission_id)
);

CREATE TABLE IF NOT EXISTS iam_user_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_iam_user_role (user_id, role_id),
    INDEX idx_iam_user_role_role (role_id)
);

CREATE TABLE IF NOT EXISTS iam_user_scope (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    scope_type VARCHAR(64) NOT NULL,
    scope_code VARCHAR(128) NOT NULL,
    enabled TINYINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_iam_user_scope (user_id, scope_type, scope_code)
);

CREATE TABLE IF NOT EXISTS iam_password_credential (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    hash_algorithm VARCHAR(32) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iam_password_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_iam_password_history_user (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS iam_login_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    username VARCHAR(64) NOT NULL,
    login_success TINYINT NOT NULL,
    session_id VARCHAR(128) NULL,
    client_ip VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    failure_reason VARCHAR(255) NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_iam_login_audit_time (logged_at),
    INDEX idx_iam_login_audit_user (user_id, logged_at)
);

CREATE TABLE IF NOT EXISTS iam_operation_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    operator_user_id BIGINT NULL,
    operator_username VARCHAR(64) NOT NULL,
    operation_type VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NULL,
    target_label VARCHAR(255) NULL,
    result_status VARCHAR(32) NOT NULL,
    trace_id VARCHAR(128) NOT NULL,
    detail_json JSON NULL,
    operated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_iam_operation_audit_time (operated_at),
    INDEX idx_iam_operation_audit_operator (operator_user_id, operated_at)
);

CREATE TABLE IF NOT EXISTS iam_approval_ticket (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticket_type VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    target_label VARCHAR(255) NULL,
    requester_user_id BIGINT NOT NULL,
    reviewer_user_id BIGINT NULL,
    status VARCHAR(32) NOT NULL,
    summary VARCHAR(255) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    review_comment VARCHAR(255) NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    executed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_iam_approval_ticket_status (status, submitted_at),
    INDEX idx_iam_approval_ticket_requester (requester_user_id, submitted_at)
);

CREATE TABLE IF NOT EXISTS iam_approval_payload (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticket_id BIGINT NOT NULL UNIQUE,
    payload_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person_profile (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    person_code VARCHAR(64) NOT NULL UNIQUE,
    external_person_id VARCHAR(128) NULL,
    employee_no VARCHAR(64) NULL,
    full_name VARCHAR(64) NOT NULL,
    display_name VARCHAR(64) NULL,
    gender VARCHAR(16) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    department_code VARCHAR(64) NULL,
    department_name VARCHAR(128) NULL,
    organization_path VARCHAR(255) NULL,
    job_title VARCHAR(128) NULL,
    email VARCHAR(128) NULL,
    source_system VARCHAR(128) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_person_profile_employee_no (employee_no),
    INDEX idx_person_profile_status (status),
    INDEX idx_person_profile_department (department_code)
);

CREATE TABLE IF NOT EXISTS person_phone (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    person_id BIGINT NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    phone_number_masked VARCHAR(32) NULL,
    phone_number_hash VARCHAR(128) NULL,
    phone_type VARCHAR(32) NOT NULL DEFAULT 'MOBILE',
    country_code VARCHAR(16) NULL,
    is_primary TINYINT NOT NULL DEFAULT 1,
    verified TINYINT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    source_system VARCHAR(128) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_person_phone_number (phone_number),
    INDEX idx_person_phone_person (person_id, status),
    INDEX idx_person_phone_hash (phone_number_hash)
);

CREATE TABLE IF NOT EXISTS terminal_device (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_code VARCHAR(64) NOT NULL UNIQUE,
    device_name VARCHAR(128) NULL,
    display_name VARCHAR(128) NULL,
    person_id BIGINT NULL,
    person_name_snapshot VARCHAR(64) NULL,
    employee_no_snapshot VARCHAR(64) NULL,
    department_name_snapshot VARCHAR(128) NULL,
    phone_number_last_reported VARCHAR(32) NULL,
    phone_number_masked_last_reported VARCHAR(32) NULL,
    primary_ip VARCHAR(64) NULL,
    country_code VARCHAR(16) NULL,
    country_name VARCHAR(64) NULL,
    city VARCHAR(64) NULL,
    site_id BIGINT NULL,
    os_version VARCHAR(128) NULL,
    imei VARCHAR(64) NULL,
    meid VARCHAR(64) NULL,
    plmn VARCHAR(32) NULL,
    password_module_status VARCHAR(32) NULL,
    password_module_version VARCHAR(64) NULL,
    password_suite_status VARCHAR(32) NULL,
    risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    last_observed_at TIMESTAMP NULL,
    last_source_type VARCHAR(32) NULL,
    last_source_system VARCHAR(128) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_terminal_device_person (person_id),
    INDEX idx_terminal_device_status (status, last_observed_at),
    INDEX idx_terminal_device_region (country_code, city),
    INDEX idx_terminal_device_site (site_id),
    INDEX idx_terminal_device_imei (imei),
    INDEX idx_terminal_device_meid (meid)
);

CREATE TABLE IF NOT EXISTS terminal_device_binding (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id BIGINT NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    external_device_id VARCHAR(128) NOT NULL,
    external_device_name VARCHAR(128) NULL,
    binding_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_terminal_binding (source_system, external_device_id),
    INDEX idx_terminal_binding_device (device_id, binding_status)
);

CREATE TABLE IF NOT EXISTS terminal_device_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id BIGINT NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    primary_ip VARCHAR(64) NULL,
    os_version VARCHAR(128) NULL,
    plmn VARCHAR(32) NULL,
    traffic_used_bytes BIGINT NULL,
    password_module_status VARCHAR(32) NULL,
    password_module_version VARCHAR(64) NULL,
    password_suite_status VARCHAR(32) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_terminal_device_snapshot_device (device_id, observed_at),
    INDEX idx_terminal_device_snapshot_source (source_type, source_system, observed_at)
);

CREATE TABLE IF NOT EXISTS terminal_security_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id BIGINT NOT NULL,
    device_snapshot_id BIGINT NULL,
    observed_at TIMESTAMP NOT NULL,
    wrong_password_count INT NOT NULL DEFAULT 0,
    fingerprint_changed TINYINT NOT NULL DEFAULT 0,
    config_modified TINYINT NOT NULL DEFAULT 0,
    risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    risk_score INT NULL,
    summary VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_terminal_security_snapshot_device (device_id, observed_at),
    INDEX idx_terminal_security_snapshot_level (risk_level, observed_at)
);

CREATE TABLE IF NOT EXISTS terminal_event (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id BIGINT NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    title VARCHAR(128) NOT NULL,
    detail VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_terminal_event_device (device_id, observed_at),
    INDEX idx_terminal_event_severity (severity, observed_at)
);

CREATE TABLE IF NOT EXISTS terminal_software_change (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id BIGINT NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    change_type VARCHAR(32) NOT NULL,
    software_name VARCHAR(128) NOT NULL,
    software_version VARCHAR(64) NULL,
    detail VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_terminal_software_change_device (device_id, observed_at),
    INDEX idx_terminal_software_change_name (software_name)
);

CREATE TABLE IF NOT EXISTS terminal_peripheral_event (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id BIGINT NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    peripheral_type VARCHAR(64) NOT NULL,
    peripheral_name VARCHAR(128) NULL,
    action_type VARCHAR(32) NOT NULL,
    detail VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_terminal_peripheral_event_device (device_id, observed_at),
    INDEX idx_terminal_peripheral_event_type (peripheral_type, observed_at)
);

CREATE TABLE IF NOT EXISTS terminal_ingest_event (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_type VARCHAR(32) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    request_id VARCHAR(128) NOT NULL,
    observed_at TIMESTAMP NOT NULL,
    ingest_status VARCHAR(32) NOT NULL,
    error_message VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_terminal_ingest_event_source (source_type, source_system, observed_at),
    UNIQUE KEY uk_terminal_ingest_request (source_system, request_id)
);

CREATE TABLE IF NOT EXISTS terminal_ingest_payload (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_type VARCHAR(32) NOT NULL,
    source_system VARCHAR(128) NOT NULL,
    request_id VARCHAR(128) NOT NULL,
    payload_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_terminal_ingest_payload_source (source_type, source_system, created_at)
);
