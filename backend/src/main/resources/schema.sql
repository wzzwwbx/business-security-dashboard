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
