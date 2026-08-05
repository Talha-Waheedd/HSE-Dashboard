-- ==================================================
-- TABLE NAME
--   property_damage
--
-- Purpose
--   Asset, equipment, building, and vehicle damage extension for repair cost,
--   insurance, downtime, responsible ownership, and property-loss reporting.
--
-- Relationships
--   incidents, departments, and users.
--
-- Indexes
--   Incident/asset type, department/status, insurance queue, cost, downtime, deletion.
--
-- Workflow
--   Damage recorded -> assessment -> repair/claim -> verified restoration.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS property_damage (
    property_damage_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id              BIGINT UNSIGNED NOT NULL,
    asset_type               ENUM('asset', 'equipment', 'building', 'vehicle') NOT NULL,
    asset_reference          VARCHAR(100) NOT NULL COMMENT 'ERP asset number, equipment tag, building code, or vehicle registration.',
    asset_description        VARCHAR(500) NOT NULL,
    estimated_cost           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    repair_cost              DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    insurance_claim          BOOLEAN NOT NULL DEFAULT FALSE,
    insurance_claim_number   VARCHAR(100) NULL,
    downtime_hours           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    responsible_department_id CHAR(36) NOT NULL,
    status                   ENUM('reported', 'assessed', 'under_repair', 'repaired', 'written_off', 'closed') NOT NULL DEFAULT 'reported',
    remarks                  TEXT NULL,
    created_by               BIGINT UNSIGNED NOT NULL,
    updated_by               BIGINT UNSIGNED NOT NULL,
    created_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at               DATETIME(3) NULL,

    PRIMARY KEY (property_damage_id),
    CONSTRAINT chk_property_damage_costs CHECK (estimated_cost >= 0 AND repair_cost >= 0 AND downtime_hours >= 0),
    CONSTRAINT chk_property_damage_claim CHECK (insurance_claim = FALSE OR insurance_claim_number IS NOT NULL),
    CONSTRAINT fk_property_damage_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_property_damage_department FOREIGN KEY (responsible_department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_property_damage_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_property_damage_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_property_damage_case_type (incident_id, asset_type),
    INDEX idx_property_damage_department_status (responsible_department_id, status),
    INDEX idx_property_damage_insurance (insurance_claim, insurance_claim_number),
    INDEX idx_property_damage_cost (estimated_cost, repair_cost),
    INDEX idx_property_damage_downtime (downtime_hours),
    INDEX idx_property_damage_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Incident property, equipment, building, and vehicle damage records.';

INSERT INTO property_damage
    (incident_id, asset_type, asset_reference, asset_description, estimated_cost, repair_cost, insurance_claim, insurance_claim_number, downtime_hours, responsible_department_id, status, remarks, created_by, updated_by)
VALUES
    (1, 'equipment', 'PKG-L1-GUIDE-04', 'Packing machine film guide edge protector', 18500.00, 12700.00, FALSE, NULL, 1.50, 'DEP-PROD-001', 'closed', 'Replacement completed and guard verified.', 2, 2),
    (2, 'equipment', 'MCC-L1-07', 'Motor control center compartment and latch assembly', 78000.00, 64500.00, TRUE, 'CLM-CBL-2026-0021', 6.00, 'DEP-ENG-001', 'under_repair', 'Electrical inspection and insurer assessment in progress.', 3, 3),
    (3, 'equipment', 'BT-MNT-TRAY-02', 'Boiler maintenance tray and coating', 95000.00, 32000.00, FALSE, NULL, 2.00, 'DEP-ENG-001', 'repaired', 'Tray cleaned, recoated, and returned to service.', 3, 3),
    (4, 'building', 'WH-RACK-A12', 'Warehouse rack upright and protective guard', 275000.00, 185000.00, TRUE, 'CLM-CBL-2026-0027', 12.00, 'DEP-STORES-001', 'assessed', 'Structural inspection completed; repair contractor selected.', 2, 2),
    (5, 'equipment', 'PUMP-PORT-009', 'Portable maintenance pump casing and coupling', 68000.00, 24000.00, FALSE, NULL, 3.00, 'DEP-ENG-001', 'under_repair', 'Pump isolated pending replacement casing and coupling.', 3, 3);

SELECT property_damage_id, incident_id, asset_type, asset_reference, estimated_cost, repair_cost, status
FROM property_damage WHERE deleted_at IS NULL ORDER BY incident_id, property_damage_id;
