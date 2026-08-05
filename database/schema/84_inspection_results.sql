-- ==================================================
-- TABLE NAME
--   am_inspection_results
--
-- Purpose
--   Inspection answers for pass, fail, N/A, and observation results with risk,
--   evidence photo, remarks, and responsible owner.
--
-- Relationships
--   am_inspections, am_inspection_checklists, risk_ratings, employees, users.
--
-- Indexes
--   Inspection/result, checklist item, responsible person, risk, photo queue, deletion.
--
-- Workflow
--   Answered -> Failed/Observed actions assigned -> verified through compliance workflow.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_inspection_results (
    inspection_result_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inspection_id        BIGINT UNSIGNED NOT NULL,
    checklist_item_id    BIGINT UNSIGNED NOT NULL,
    result               ENUM('pass','fail','na','observation') NOT NULL,
    remarks              TEXT NULL,
    risk_rating_id       BIGINT UNSIGNED NULL,
    photo                VARCHAR(1000) NULL,
    responsible_person_id CHAR(36) NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (inspection_result_id),
    UNIQUE KEY uq_am_result_inspection_item (inspection_id, checklist_item_id),
    CONSTRAINT chk_am_result_evidence CHECK (result IN ('pass','na') OR remarks IS NOT NULL OR photo IS NOT NULL),
    CONSTRAINT fk_am_result_inspection FOREIGN KEY (inspection_id) REFERENCES am_inspections (inspection_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_result_checklist FOREIGN KEY (checklist_item_id) REFERENCES am_inspection_checklists (checklist_item_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_result_risk FOREIGN KEY (risk_rating_id) REFERENCES risk_ratings (risk_rating_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_result_responsible FOREIGN KEY (responsible_person_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_result_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_result_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_result_inspection_result (inspection_id, result),
    INDEX idx_am_result_checklist (checklist_item_id),
    INDEX idx_am_result_responsible (responsible_person_id),
    INDEX idx_am_result_risk (risk_rating_id),
    INDEX idx_am_result_photo (result, photo(100)),
    INDEX idx_am_result_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inspection checklist result ledger.';

INSERT INTO am_inspection_results (inspection_id,checklist_item_id,result,remarks,risk_rating_id,photo,responsible_person_id,created_by,updated_by)
SELECT i.inspection_id,c.checklist_item_id,
       CASE WHEN i.status='planned' THEN 'na' WHEN MOD(i.inspection_id+c.sequence_number,13)=0 THEN 'fail' WHEN MOD(i.inspection_id+c.sequence_number,17)=0 THEN 'observation' ELSE 'pass' END,
       CASE WHEN i.status='planned' THEN 'Pre-inspection item reserved.' WHEN MOD(i.inspection_id+c.sequence_number,13)=0 THEN 'Condition requires corrective action and evidence.' ELSE NULL END,
       CASE WHEN MOD(i.inspection_id+c.sequence_number,13)=0 THEN MOD(i.inspection_id+c.sequence_number,5)+1 ELSE NULL END,
       CASE WHEN MOD(i.inspection_id+c.sequence_number,13)=0 THEN CONCAT('hse/inspections/',i.inspection_id,'/item-',c.checklist_item_id,'.jpg') ELSE NULL END,
       CASE WHEN MOD(i.inspection_id,3)=0 THEN 'EMP-HSE-003' WHEN MOD(i.inspection_id,3)=1 THEN 'EMP-HSE-002' ELSE 'EMP-ENG-001' END,1,1
FROM am_inspections i JOIN am_inspection_checklists c ON c.inspection_type_id=i.inspection_type_id AND c.sequence_number <= 10;

SELECT COUNT(*) AS inspection_result_count FROM am_inspection_results WHERE deleted_at IS NULL;
