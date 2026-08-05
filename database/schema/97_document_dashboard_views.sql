-- ==================================================
-- TABLE NAME
--   DMS dashboard views
--
-- Purpose
--   Read-only dashboard layer for document control, approval, distribution,
--   acknowledgement, versions, changes, expiry, and obsolete-document reporting.
--
-- Relationships
--   Reads all dms_* tables and existing departments/employees.
--
-- Indexes
--   Views use indexed source tables; no physical tables are created here.
--
-- Workflow
--   Views evaluate current active and historical document-control state.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE OR REPLACE VIEW vw_documents_summary AS
SELECT d.document_id,d.document_number,d.title,c.category_name,t.name AS document_type,d.status,d.current_version,d.issue_date,d.review_date,d.expiry_date,d.department_id,d.owner_id
FROM dms_documents d JOIN dms_document_categories c ON c.category_id=d.category_id JOIN dms_document_types t ON t.document_type_id=d.document_type_id WHERE d.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_documents_by_department AS
SELECT d.department_id,dep.department_name,COUNT(*) AS document_count,SUM(d.status='active') AS active_count
FROM dms_documents d LEFT JOIN departments dep ON dep.department_id=d.department_id WHERE d.deleted_at IS NULL GROUP BY d.department_id,dep.department_name;

CREATE OR REPLACE VIEW vw_documents_by_category AS
SELECT c.category_id,c.category_name,COUNT(d.document_id) AS document_count,SUM(d.status='active') AS active_count
FROM dms_document_categories c LEFT JOIN dms_documents d ON d.category_id=c.category_id AND d.deleted_at IS NULL WHERE c.deleted_at IS NULL GROUP BY c.category_id,c.category_name;

CREATE OR REPLACE VIEW vw_expiring_documents AS
SELECT document_id,document_number,title,review_date,expiry_date,DATEDIFF(COALESCE(expiry_date,review_date),CURRENT_DATE) AS days_to_due,status
FROM dms_documents WHERE deleted_at IS NULL AND COALESCE(expiry_date,review_date) IS NOT NULL AND COALESCE(expiry_date,review_date) <= DATE_ADD(CURRENT_DATE,INTERVAL 90 DAY);

CREATE OR REPLACE VIEW vw_overdue_reviews AS
SELECT document_id,document_number,title,review_date,DATEDIFF(CURRENT_DATE,review_date) AS overdue_days,owner_id
FROM dms_documents WHERE deleted_at IS NULL AND review_date < CURRENT_DATE AND status IN ('active','approved');

CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT a.approval_id,a.document_id,d.document_number,d.title,a.document_version_id,v.version_number,a.approver_id,a.approval_level,a.decision,a.created_at
FROM dms_document_approvals a JOIN dms_documents d ON d.document_id=a.document_id JOIN dms_document_versions v ON v.document_version_id=a.document_version_id WHERE a.deleted_at IS NULL AND a.decision='pending';

CREATE OR REPLACE VIEW vw_document_versions AS
SELECT d.document_id,d.document_number,d.title,v.document_version_id,v.version_number,v.revision_number,v.status,v.effective_date,v.superseded_date,v.approved_by
FROM dms_documents d JOIN dms_document_versions v ON v.document_id=d.document_id WHERE d.deleted_at IS NULL AND v.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_document_distribution AS
SELECT c.document_id,d.document_number,d.title,COUNT(*) AS circulation_count,SUM(c.acknowledgement_received) AS acknowledged_count,SUM(c.status='overdue') AS overdue_count
FROM dms_document_circulation c JOIN dms_documents d ON d.document_id=c.document_id WHERE c.deleted_at IS NULL GROUP BY c.document_id,d.document_number,d.title;

CREATE OR REPLACE VIEW vw_acknowledgement_status AS
SELECT c.document_id,d.document_number,d.title,c.employee_id,e.full_name,c.acknowledgement_required,c.acknowledgement_received,c.acknowledgement_date,c.reminder_count,c.status
FROM dms_document_circulation c JOIN dms_documents d ON d.document_id=c.document_id JOIN employees e ON e.employee_id=c.employee_id WHERE c.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_document_revision_history AS
SELECT v.document_id,d.document_number,d.title,v.version_number,v.revision_number,v.change_summary,v.revision_reason,v.status,v.effective_date,v.superseded_date
FROM dms_document_versions v JOIN dms_documents d ON d.document_id=v.document_id WHERE v.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_recent_document_changes AS
SELECT h.change_history_id,h.document_id,d.document_number,d.title,h.action_performed,h.changed_by,h.changed_at,h.ip_address,h.remarks
FROM dms_document_change_history h JOIN dms_documents d ON d.document_id=h.document_id WHERE h.deleted_at IS NULL ORDER BY h.changed_at DESC;

CREATE OR REPLACE VIEW vw_obsolete_documents AS
SELECT d.document_id,d.document_number,d.title,d.current_version,d.status,v.version_number,v.superseded_date
FROM dms_documents d JOIN dms_document_versions v ON v.document_id=d.document_id WHERE d.deleted_at IS NULL AND (d.status='obsolete' OR v.status='obsolete');

CREATE OR REPLACE VIEW vw_controlled_documents AS
SELECT d.document_id,d.document_number,d.title,c.category_name,d.current_version,d.status,d.effective_date,d.review_date,d.owner_id
FROM dms_documents d JOIN dms_document_categories c ON c.category_id=d.category_id JOIN dms_document_types t ON t.document_type_id=d.document_type_id WHERE d.deleted_at IS NULL AND t.name='Controlled' AND d.status IN ('approved','active');

CREATE OR REPLACE VIEW vw_department_document_stats AS
SELECT d.department_id,dep.department_name,COUNT(*) AS total_documents,SUM(d.status='active') AS active_documents,SUM(d.status='obsolete') AS obsolete_documents,AVG(d.current_version) AS average_version
FROM dms_documents d LEFT JOIN departments dep ON dep.department_id=d.department_id WHERE d.deleted_at IS NULL GROUP BY d.department_id,dep.department_name;

CREATE OR REPLACE VIEW vw_document_compliance AS
SELECT d.document_id,d.document_number,d.title,
       CASE WHEN d.status IN ('approved','active') AND (d.review_date IS NULL OR d.review_date>=CURRENT_DATE) AND EXISTS (SELECT 1 FROM dms_document_versions v WHERE v.document_id=d.document_id AND v.status IN ('approved','effective') AND v.deleted_at IS NULL) THEN 'compliant' ELSE 'attention_required' END AS compliance_status
FROM dms_documents d WHERE d.deleted_at IS NULL;
