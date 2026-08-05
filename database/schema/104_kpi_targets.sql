-- ==================================================
-- TABLE NAME
--   ra_kpi_targets
--
-- Purpose
--   Stores period-specific KPI targets and escalation thresholds.
--
-- Relationships
--   Each target belongs to a KPI and may be scoped to a department and/or plant.
--
-- Indexes
--   KPI/period, department, plant, and threshold reporting.
--
-- Workflow
--   Define KPI -> set target -> compare actual -> flag warning/critical variance.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS ra_kpi_targets (
    kpi_target_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    kpi_id              BIGINT UNSIGNED NOT NULL,
    department_id       CHAR(36) NULL,
    plant_id            CHAR(36) NULL,
    target_year         YEAR NOT NULL,
    target_month        TINYINT UNSIGNED NOT NULL,
    target_value        DECIMAL(18,4) NOT NULL,
    warning_threshold   DECIMAL(18,4) NULL,
    critical_threshold  DECIMAL(18,4) NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (kpi_target_id),
    UNIQUE KEY uq_ra_kpi_target_period (kpi_id,department_id,plant_id,target_year,target_month),
    CONSTRAINT chk_ra_kpi_target_month CHECK (target_month BETWEEN 1 AND 12),
    CONSTRAINT chk_ra_kpi_target_thresholds CHECK ((warning_threshold IS NULL OR warning_threshold >= 0) AND (critical_threshold IS NULL OR critical_threshold >= 0)),
    CONSTRAINT fk_ra_kpi_target_kpi FOREIGN KEY (kpi_id) REFERENCES ra_kpi_definitions(kpi_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_kpi_target_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_kpi_target_plant FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_kpi_target_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_kpi_target_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ra_kpi_target_kpi_period (kpi_id,target_year,target_month),
    INDEX idx_ra_kpi_target_department_period (department_id,target_year,target_month),
    INDEX idx_ra_kpi_target_plant_period (plant_id,target_year,target_month),
    INDEX idx_ra_kpi_target_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Department and plant KPI target register.';

INSERT INTO ra_kpi_targets
    (kpi_id,department_id,plant_id,target_year,target_month,target_value,warning_threshold,critical_threshold,created_by,updated_by)
SELECT
    k.kpi_id,
    NULL,
    'PLT-CBL-SKR-001',
    2026,
    m.target_month,
    CASE WHEN k.unit IN ('percent','rate','index') THEN COALESCE(k.target_value,90) ELSE COALESCE(k.target_value,0) END,
    CASE WHEN k.unit IN ('percent','rate','index') THEN 80 ELSE 1 END,
    CASE WHEN k.unit IN ('percent','rate','index') THEN 70 ELSE 2 END,
    1,1
FROM ra_kpi_definitions k
CROSS JOIN (SELECT 1 target_month UNION ALL SELECT 7) m
WHERE k.deleted_at IS NULL;

