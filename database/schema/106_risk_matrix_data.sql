-- ==================================================
-- TABLE NAME
--   ra_risk_matrix_data
--
-- Purpose
--   Materializes hazard probability/severity coordinates for 5x5 heat-map
--   dashboards while retaining the source hazard and organizational scope.
--
-- Relationships
--   Hazards, risk ratings, departments, locations, and users.
--
-- Indexes
--   Matrix coordinates, risk level, department/location, hazard, and date.
--
-- Workflow
--   Assess hazard -> record probability/severity -> map risk band -> render heat map.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS ra_risk_matrix_data (
    risk_matrix_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hazard_id       BIGINT UNSIGNED NOT NULL,
    probability     TINYINT UNSIGNED NOT NULL,
    severity        TINYINT UNSIGNED NOT NULL,
    risk_rating_id  BIGINT UNSIGNED NOT NULL,
    department_id   CHAR(36) NULL,
    location_id     CHAR(36) NULL,
    assessment_date DATE NOT NULL,
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (risk_matrix_id),
    UNIQUE KEY uq_ra_risk_matrix_point (hazard_id,probability,severity,assessment_date),
    CONSTRAINT chk_ra_risk_matrix_probability CHECK (probability BETWEEN 1 AND 5),
    CONSTRAINT chk_ra_risk_matrix_severity CHECK (severity BETWEEN 1 AND 5),
    CONSTRAINT fk_ra_risk_matrix_hazard FOREIGN KEY (hazard_id) REFERENCES hazards(hazard_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_risk_matrix_rating FOREIGN KEY (risk_rating_id) REFERENCES risk_ratings(risk_rating_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_risk_matrix_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_risk_matrix_location FOREIGN KEY (location_id) REFERENCES locations(location_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_risk_matrix_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_risk_matrix_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ra_risk_matrix_coordinates (probability,severity),
    INDEX idx_ra_risk_matrix_rating (risk_rating_id,assessment_date),
    INDEX idx_ra_risk_matrix_department (department_id,assessment_date),
    INDEX idx_ra_risk_matrix_location (location_id,assessment_date),
    INDEX idx_ra_risk_matrix_hazard (hazard_id,assessment_date),
    INDEX idx_ra_risk_matrix_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Materialized 5x5 risk heat-map coordinates.';

INSERT IGNORE INTO ra_risk_matrix_data
    (hazard_id,probability,severity,risk_rating_id,department_id,location_id,assessment_date,created_by,updated_by)
SELECT
    h.hazard_id,
    p.n,
    s.n,
    CASE
        WHEN p.n * s.n >= 20 THEN 1
        WHEN p.n * s.n >= 12 THEN 2
        WHEN p.n * s.n >= 6 THEN 3
        WHEN p.n * s.n >= 3 THEN 4
        ELSE 5
    END,
    h.department_id,
    h.location_id,
    DATE_ADD('2026-01-01',INTERVAL MOD(h.hazard_id + p.n + s.n,365) DAY),
    1,1
FROM hazards h
CROSS JOIN (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) p
CROSS JOIN (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) s
WHERE h.deleted_at IS NULL;

