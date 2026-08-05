-- ==================================================
-- TABLE NAME
--   dms_document_categories
--
-- Purpose
--   Master categories for controlled SOP, quality, HSE, food, environmental,
--   maintenance, HR, engineering, and regulatory documents.
--
-- Relationships
--   Referenced by dms_documents; users audit category maintenance.
--
-- Indexes
--   Unique names, active catalog, and soft-delete filtering.
--
-- Workflow
--   Active -> Inactive; historical documents retain their category.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_categories (
    category_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(150) NOT NULL,
    description   VARCHAR(600) NULL,
    icon          VARCHAR(100) NULL,
    color         CHAR(7) NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    BIGINT UNSIGNED NULL,
    updated_by    BIGINT UNSIGNED NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at    DATETIME(3) NULL,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_dms_category_name (category_name),
    CONSTRAINT chk_dms_category_color CHECK (color IS NULL OR color REGEXP '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT fk_dms_category_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_category_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_category_active (active),
    INDEX idx_dms_category_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DMS document category master.';

INSERT INTO dms_document_categories (category_id,category_name,description,icon,color,active,created_by,updated_by) VALUES
 (1,'SOP','Standard operating procedure.','file-cog','#2563EB',TRUE,1,1),(2,'Work Instruction','Detailed task work instruction.','list-check','#0891B2',TRUE,1,1),(3,'Procedure','Cross-functional controlled procedure.','route','#7C3AED',TRUE,1,1),(4,'Policy','Management policy and commitment.','shield-check','#1D4ED8',TRUE,1,1),(5,'Form','Controlled record template.','file-input','#64748B',TRUE,1,1),(6,'Checklist','Controlled inspection or verification list.','list-checks','#0F766E',TRUE,1,1),(7,'Manual','System or equipment manual.','book-open','#475569',TRUE,1,1),(8,'Guideline','Recommended good-practice guidance.','compass','#059669',TRUE,1,1),(9,'Training Material','Approved learning material.','graduation-cap','#0891B2',TRUE,1,1),(10,'Risk Assessment','Hazard and risk assessment.','triangle-alert','#EA580C',TRUE,1,1),(11,'Emergency Procedure','Emergency response plan or procedure.','siren','#DC2626',TRUE,1,1),(12,'ISO Document','ISO management-system document.','badge-check','#9333EA',TRUE,1,1),(13,'Legal Document','Law, license, or statutory record.','scale','#991B1B',TRUE,1,1),(14,'External Document','Controlled external reference.','external-link','#6B7280',TRUE,1,1),(15,'Engineering Drawing','Controlled engineering drawing.','drafting-compass','#475569',TRUE,1,1),(16,'Quality Document','Quality plan, record, or specification.','clipboard-check','#2563EB',TRUE,1,1),(17,'Food Safety','Food safety and HACCP document.','utensils','#16A34A',TRUE,1,1),(18,'Environmental','Environmental aspect, impact, or plan.','leaf','#059669',TRUE,1,1),(19,'Maintenance','Maintenance procedure or manual.','wrench','#D97706',TRUE,1,1),(20,'HR Document','Human resources controlled document.','users','#7C3AED',TRUE,1,1),(21,'Audit Report','Internal or external audit report.','file-search','#2563EB',TRUE,1,1),(22,'Inspection Report','Inspection result report.','clipboard-list','#0F766E',TRUE,1,1),(23,'Certificate','Certificate or authorization record.','award','#CA8A04',TRUE,1,1),(24,'MSDS / SDS','Safety data sheet.','flask-conical','#9333EA',TRUE,1,1),(25,'Template','Controlled reusable document template.','copy-check','#64748B',TRUE,1,1);

SELECT category_id,category_name,active FROM dms_document_categories WHERE deleted_at IS NULL ORDER BY category_id;
