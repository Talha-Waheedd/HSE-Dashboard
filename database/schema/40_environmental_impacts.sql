-- ==================================================
-- TABLE NAME
--   environmental_impacts
--
-- Purpose
--   Environmental impact extension for air, water, oil, chemical, waste, noise,
--   and emission incidents, including regulatory notification and cleanup cost.
--
-- Relationships
--   incidents, departments, and users.
--
-- Indexes
--   Incident/type, regulatory queue, cleanup status, date/cost, department, deletion.
--
-- Workflow
--   Impact recorded -> containment/cleanup -> regulatory decision -> verified closure.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS environmental_impacts (
    environmental_impact_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id             BIGINT UNSIGNED NOT NULL,
    impact_type             ENUM('air_pollution', 'water_pollution', 'oil_spill', 'chemical_spill', 'waste_disposal', 'noise_pollution', 'emission') NOT NULL,
    affected_area           VARCHAR(500) NOT NULL,
    estimated_quantity      DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    quantity_unit           VARCHAR(30) NOT NULL,
    regulatory_notification BOOLEAN NOT NULL DEFAULT FALSE,
    regulatory_reference    VARCHAR(255) NULL,
    cleanup_status          ENUM('not_started', 'in_progress', 'completed', 'verified') NOT NULL DEFAULT 'not_started',
    environmental_cost      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    responsible_department_id CHAR(36) NULL,
    remarks                 TEXT NULL,
    created_by              BIGINT UNSIGNED NOT NULL,
    updated_by              BIGINT UNSIGNED NOT NULL,
    created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at              DATETIME(3) NULL,

    PRIMARY KEY (environmental_impact_id),
    CONSTRAINT chk_environmental_amounts CHECK (estimated_quantity >= 0 AND environmental_cost >= 0),
    CONSTRAINT chk_environmental_notification CHECK (regulatory_notification = FALSE OR regulatory_reference IS NOT NULL),
    CONSTRAINT fk_environmental_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_environmental_department FOREIGN KEY (responsible_department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_environmental_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_environmental_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_environmental_case_type (incident_id, impact_type),
    INDEX idx_environmental_regulatory (regulatory_notification, cleanup_status),
    INDEX idx_environmental_cleanup (cleanup_status, created_at),
    INDEX idx_environmental_department (responsible_department_id),
    INDEX idx_environmental_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Environmental impact, response, regulatory, and cleanup cost records.';

INSERT INTO environmental_impacts
    (incident_id, impact_type, affected_area, estimated_quantity, quantity_unit, regulatory_notification, regulatory_reference, cleanup_status, environmental_cost, responsible_department_id, remarks, created_by, updated_by)
VALUES
    (3, 'oil_spill', 'Contained boiler maintenance tray', 18.500, 'litres', FALSE, NULL, 'verified', 4200.00, 'DEP-ENG-001', 'All residue removed and waste transferred to the approved container.', 3, 3),
    (3, 'air_pollution', 'Boiler maintenance area', 0.800, 'hours of smoke', FALSE, NULL, 'verified', 1800.00, 'DEP-ENG-001', 'Smoke was localized and no off-site impact was identified.', 3, 3),
    (4, 'waste_disposal', 'Warehouse packaging quarantine area', 125.000, 'kilograms', FALSE, NULL, 'in_progress', 6500.00, 'DEP-STORES-001', 'Damaged packaging isolated for approved disposal.', 2, 2),
    (2, 'chemical_spill', 'Electrical-room maintenance cabinet', 3.200, 'litres', FALSE, NULL, 'completed', 900.00, 'DEP-ENG-001', 'Cleaning solvent container was secured after the electrical response.', 3, 3),
    (5, 'noise_pollution', 'Workshop maintenance bay', 2.000, 'hours above limit', FALSE, NULL, 'completed', 1200.00, 'DEP-ENG-001', 'Temporary equipment was removed and noise monitoring scheduled.', 3, 3);

SELECT environmental_impact_id, incident_id, impact_type, estimated_quantity, quantity_unit, cleanup_status, environmental_cost
FROM environmental_impacts WHERE deleted_at IS NULL ORDER BY incident_id, environmental_impact_id;
