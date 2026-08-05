-- ==================================================
-- TABLE NAME
--   dms_document_circulation
--
-- Purpose
--   Controlled circulation and acknowledgement list for SOPs and other documents.
--
-- Relationships
--   dms_documents, employees, departments, users.
--
-- Indexes
--   Document/employee, department/status, acknowledgement due, reminders, deletion.
--
-- Workflow
--   Circulated -> Acknowledged/Overdue/Not Required.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_circulation (
    circulation_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    document_id             BIGINT UNSIGNED NOT NULL,
    employee_id             CHAR(36) NOT NULL,
    department_id           CHAR(36) NULL,
    email                   VARCHAR(255) NOT NULL,
    circulation_date        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    acknowledgement_required BOOLEAN NOT NULL DEFAULT TRUE,
    acknowledgement_received BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledgement_date   DATETIME(3) NULL,
    reminder_count          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    status                  ENUM('circulated','acknowledged','overdue','not_required','cancelled') NOT NULL DEFAULT 'circulated',
    created_by              BIGINT UNSIGNED NOT NULL,
    updated_by              BIGINT UNSIGNED NOT NULL,
    created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at              DATETIME(3) NULL,
    PRIMARY KEY (circulation_id),
    UNIQUE KEY uq_dms_circulation_document_employee (document_id, employee_id),
    CONSTRAINT chk_dms_circulation_ack CHECK (acknowledgement_received=FALSE OR acknowledgement_date IS NOT NULL),
    CONSTRAINT fk_dms_circulation_document FOREIGN KEY (document_id) REFERENCES dms_documents (document_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_circulation_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_circulation_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_circulation_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_circulation_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_circulation_document_employee (document_id, employee_id),
    INDEX idx_dms_circulation_department_status (department_id, status),
    INDEX idx_dms_circulation_ack (acknowledgement_required, acknowledgement_received),
    INDEX idx_dms_circulation_reminders (reminder_count, status),
    INDEX idx_dms_circulation_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Controlled document distribution and acknowledgement register.';

INSERT INTO dms_document_circulation (document_id,employee_id,department_id,email,circulation_date,acknowledgement_required,acknowledgement_received,acknowledgement_date,reminder_count,status,created_by,updated_by)
SELECT d.document_id,e.employee_id,e.department_id,e.email,'2026-06-01 09:00:00.000',TRUE,
       CASE WHEN MOD(d.document_id + x.n,4)=0 THEN FALSE ELSE TRUE END,
       CASE WHEN MOD(d.document_id + x.n,4)=0 THEN NULL ELSE '2026-06-03 10:00:00.000' END,
       CASE WHEN MOD(d.document_id + x.n,4)=0 THEN 1 ELSE 0 END,
       CASE WHEN MOD(d.document_id + x.n,4)=0 THEN 'overdue' ELSE 'acknowledged' END,1,1
FROM dms_documents d CROSS JOIN (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) x
JOIN employees e ON e.employee_id=CASE x.n WHEN 1 THEN 'EMP-HSE-001' WHEN 2 THEN 'EMP-HSE-002' WHEN 3 THEN 'EMP-PROD-001' ELSE 'EMP-ENG-001' END;

SELECT COUNT(*) AS circulation_count FROM dms_document_circulation WHERE deleted_at IS NULL;
