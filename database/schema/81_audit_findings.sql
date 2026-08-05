-- ==================================================
-- TABLE NAME
--   am_audit_findings
--
-- Purpose
--   Unlimited audit findings, including observations, non-conformities, and
--   improvement opportunities, with ownership and risk-based due dates.
--
-- Relationships
--   am_audits, departments, employees, risk_ratings, and users.
--
-- Indexes
--   Audit/category, severity/status, owner/due date, department, risk, deletion.
--
-- Workflow
--   Open -> Assigned -> In Progress -> Pending Verification -> Closed/Reopened.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_audit_findings (
    finding_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    finding_number      VARCHAR(30) GENERATED ALWAYS AS (CONCAT('AM-FND-',YEAR(created_at),'-',LPAD(finding_id,6,'0'))) STORED,
    audit_id            BIGINT UNSIGNED NOT NULL,
    category            ENUM('observation','minor_nc','major_nc','critical_nc','ofi','best_practice') NOT NULL,
    description         TEXT NOT NULL,
    severity            ENUM('low','medium','high','critical') NOT NULL,
    observation         TEXT NULL,
    clause              VARCHAR(100) NULL,
    requirement         TEXT NULL,
    risk_rating_id      BIGINT UNSIGNED NULL,
    responsible_person_id CHAR(36) NULL,
    due_date            DATE NULL,
    status              ENUM('open','assigned','in_progress','pending_verification','closed','reopened') NOT NULL DEFAULT 'open',
    remarks             TEXT NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (finding_id),
    UNIQUE KEY uq_am_finding_number (finding_number),
    CONSTRAINT fk_am_finding_audit FOREIGN KEY (audit_id) REFERENCES am_audits (audit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_finding_risk FOREIGN KEY (risk_rating_id) REFERENCES risk_ratings (risk_rating_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_finding_owner FOREIGN KEY (responsible_person_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_finding_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_finding_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_finding_audit_category (audit_id, category),
    INDEX idx_am_finding_severity_status (severity, status),
    INDEX idx_am_finding_owner_due (responsible_person_id, due_date),
    INDEX idx_am_finding_risk (risk_rating_id),
    INDEX idx_am_finding_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Unlimited audit finding and observation register.';

INSERT INTO am_audit_findings (audit_id,category,description,severity,observation,clause,requirement,risk_rating_id,responsible_person_id,due_date,status,remarks,created_by,updated_by)
SELECT a.audit_id,
       CASE MOD(a.audit_id + n.seq,6) WHEN 0 THEN 'observation' WHEN 1 THEN 'minor_nc' WHEN 2 THEN 'major_nc' WHEN 3 THEN 'ofi' WHEN 4 THEN 'best_practice' ELSE 'minor_nc' END,
       CONCAT('Manufacturing audit finding ', n.seq, ' for audit ', a.audit_id, ': control evidence requires review.'),
       CASE MOD(a.audit_id + n.seq,4) WHEN 0 THEN 'critical' WHEN 1 THEN 'high' WHEN 2 THEN 'medium' ELSE 'low' END,
       'Auditor observed a condition requiring documented follow-up.',
       CASE MOD(n.seq,4) WHEN 0 THEN 'ISO 45001:8.1' WHEN 1 THEN 'ISO 9001:7.2' WHEN 2 THEN 'ISO 14001:6.1' ELSE 'GMP Control' END,
       'The documented control must be implemented, evidenced, and periodically verified.',
       MOD(a.audit_id+n.seq,5)+1,
       CASE MOD(n.seq,3) WHEN 0 THEN 'EMP-HSE-001' WHEN 1 THEN 'EMP-HSE-002' ELSE 'EMP-ENG-001' END,
       DATE_ADD(a.audit_date,INTERVAL (15+n.seq) DAY),
       CASE WHEN a.audit_id <= 7 AND n.seq <= 2 THEN 'closed' WHEN n.seq=1 THEN 'in_progress' ELSE 'open' END,
       'Seeded realistic finding for dashboard and workflow testing.',1,1
FROM am_audits a CROSS JOIN (SELECT 1 seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) n;

SELECT COUNT(*) AS finding_count FROM am_audit_findings WHERE deleted_at IS NULL;
