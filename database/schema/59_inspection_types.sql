-- ==================================================
-- TABLE NAME
--   inspection_types
--
-- Purpose
--   Master catalog for routine, equipment, emergency, environmental, food safety,
--   contractor, visitor, and operational inspections.
--
-- Relationships
--   Referenced by inspections and inspection dashboards. Audit ownership references users.
--
-- Indexes
--   Unique code/name, frequency/status, active ordering, risk, soft deletion.
--
-- Workflow
--   Active inspection types are scheduled according to their frequency.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS inspection_types (
    inspection_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inspection_code    VARCHAR(40) NOT NULL,
    inspection_name    VARCHAR(150) NOT NULL,
    frequency          ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'ad_hoc') NOT NULL,
    mandatory          BOOLEAN NOT NULL DEFAULT FALSE,
    risk_level         ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    display_order      SMALLINT UNSIGNED NOT NULL DEFAULT 999,
    status             ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    description        VARCHAR(500) NULL,
    created_by         BIGINT UNSIGNED NULL,
    updated_by         BIGINT UNSIGNED NULL,
    created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at         DATETIME(3) NULL,
    PRIMARY KEY (inspection_type_id),
    UNIQUE KEY uq_inspection_type_code (inspection_code),
    UNIQUE KEY uq_inspection_type_name (inspection_name),
    CONSTRAINT fk_inspection_type_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_type_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_inspection_type_frequency_status (frequency, status),
    INDEX idx_inspection_type_active_order (status, display_order),
    INDEX idx_inspection_type_risk (risk_level, mandatory),
    INDEX idx_inspection_type_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Inspection classification and scheduling master.';

INSERT INTO inspection_types
    (inspection_type_id, inspection_code, inspection_name, frequency, mandatory, risk_level, display_order, status, description, created_by, updated_by)
VALUES
    (1, 'DAILY', 'Daily Inspection', 'daily', TRUE, 'medium', 1, 'active', 'Daily workplace condition inspection.', 1, 1),
    (2, 'WEEKLY', 'Weekly Inspection', 'weekly', TRUE, 'medium', 2, 'active', 'Weekly area and housekeeping inspection.', 2, 2),
    (3, 'MONTHLY', 'Monthly Inspection', 'monthly', TRUE, 'medium', 3, 'active', 'Monthly management and HSE inspection.', 1, 1),
    (4, 'QUARTERLY', 'Quarterly Inspection', 'quarterly', TRUE, 'high', 4, 'active', 'Quarterly compliance inspection.', 1, 1),
    (5, 'ANNUAL', 'Annual Inspection', 'annual', TRUE, 'high', 5, 'active', 'Annual comprehensive inspection.', 1, 1),
    (6, 'MACHINE', 'Machine Inspection', 'monthly', TRUE, 'high', 6, 'active', 'Machine guarding and safe-operation inspection.', 3, 3),
    (7, 'ELECTRICAL', 'Electrical Inspection', 'quarterly', TRUE, 'critical', 7, 'active', 'Electrical equipment and isolation inspection.', 3, 3),
    (8, 'FIRE_EXT', 'Fire Extinguisher Inspection', 'monthly', TRUE, 'critical', 8, 'active', 'Extinguisher readiness and access inspection.', 2, 2),
    (9, 'PPE', 'PPE Inspection', 'weekly', TRUE, 'medium', 9, 'active', 'PPE availability, condition, and use inspection.', 2, 2),
    (10, 'FORKLIFT', 'Forklift Inspection', 'daily', TRUE, 'high', 10, 'active', 'Pre-use vehicle and forklift inspection.', 3, 3),
    (11, 'BOILER', 'Boiler Inspection', 'monthly', TRUE, 'critical', 11, 'active', 'Boiler and steam-system condition inspection.', 3, 3),
    (12, 'PRESSURE', 'Pressure Vessel Inspection', 'quarterly', TRUE, 'critical', 12, 'active', 'Pressure equipment inspection.', 3, 3),
    (13, 'BUILDING', 'Building Inspection', 'quarterly', FALSE, 'medium', 13, 'active', 'Building condition and egress inspection.', 1, 1),
    (14, 'WAREHOUSE', 'Warehouse Inspection', 'weekly', TRUE, 'high', 14, 'active', 'Storage, racking, traffic, and housekeeping inspection.', 2, 2),
    (15, 'VEHICLE', 'Vehicle Inspection', 'daily', TRUE, 'high', 15, 'active', 'Vehicle roadworthiness and safety inspection.', 3, 3),
    (16, 'ENV', 'Environmental Inspection', 'monthly', TRUE, 'high', 16, 'active', 'Waste, emissions, spill, and environmental-control inspection.', 2, 2),
    (17, 'FOOD', 'Food Safety Inspection', 'weekly', TRUE, 'high', 17, 'active', 'Food hygiene and GMP inspection.', 2, 2),
    (18, 'CONTRACTOR', 'Contractor Inspection', 'weekly', TRUE, 'high', 18, 'active', 'Contractor worksite and permit inspection.', 2, 2),
    (19, 'VISITOR', 'Visitor Inspection', 'ad_hoc', FALSE, 'low', 19, 'active', 'Visitor route and induction compliance check.', 2, 2),
    (20, 'EMERGENCY_EXIT', 'Emergency Exit Inspection', 'monthly', TRUE, 'critical', 20, 'active', 'Emergency exit access and signage inspection.', 2, 2);

SELECT inspection_type_id, inspection_code, inspection_name, frequency, mandatory, risk_level, status
FROM inspection_types WHERE deleted_at IS NULL ORDER BY display_order;
