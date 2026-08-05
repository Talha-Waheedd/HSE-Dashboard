-- ==================================================
-- TABLE NAME
--   am_compliance_requirements
--
-- Purpose
--   Legal, regulatory, ISO, OSHA, NEQS, PEPA, food authority, and company-policy
--   requirement master for recurring compliance tracking.
--
-- Relationships
--   Departments own requirements; employees/users audit ownership.
--
-- Indexes
--   Code, authority, department, frequency, mandatory/status, deletion.
--
-- Workflow
--   Active -> Under Review -> Retired; tracking rows preserve historical reviews.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_compliance_requirements (
    requirement_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    requirement_code VARCHAR(50) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT NOT NULL,
    frequency     ENUM('monthly','quarterly','semi_annual','annual','ad_hoc') NOT NULL,
    responsible_department_id CHAR(36) NOT NULL,
    mandatory     BOOLEAN NOT NULL DEFAULT TRUE,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    BIGINT UNSIGNED NOT NULL,
    updated_by    BIGINT UNSIGNED NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at    DATETIME(3) NULL,
    PRIMARY KEY (requirement_id),
    UNIQUE KEY uq_am_requirement_code (requirement_code),
    CONSTRAINT fk_am_requirement_department FOREIGN KEY (responsible_department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_requirement_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_requirement_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_requirement_department (responsible_department_id, active),
    INDEX idx_am_requirement_frequency (frequency, mandatory),
    INDEX idx_am_requirement_status (active, mandatory),
    INDEX idx_am_requirement_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Legal and management-system compliance requirement master.';

INSERT INTO am_compliance_requirements (requirement_id,requirement_code,name,description,frequency,responsible_department_id,mandatory,active,created_by,updated_by) VALUES
 (1,'ISO45001-5.1','Leadership and commitment','Top management demonstrates leadership for OH&S.','annual','DEP-HSE-001',TRUE,TRUE,1,1),(2,'ISO45001-6.1','Hazard identification','Hazards and OH&S risks are identified and assessed.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(3,'ISO45001-7.2','Competence','Workers are competent based on education, training, or experience.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(4,'ISO45001-8.1','Operational planning','Operational controls are implemented for significant risks.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(5,'ISO45001-10.2','Incident learning','Incidents and nonconformities are investigated and actioned.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(6,'ISO9001-4.4','Process control','QMS processes are defined and controlled.','annual','DEP-QC-001',TRUE,TRUE,1,1),(7,'ISO9001-7.2','Quality competence','Personnel competence is evaluated and maintained.','annual','DEP-QC-001',TRUE,TRUE,1,1),(8,'ISO9001-8.5','Production control','Production is performed under controlled conditions.','quarterly','DEP-PROD-001',TRUE,TRUE,1,1),(9,'ISO14001-6.1','Environmental aspects','Environmental aspects and impacts are evaluated.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(10,'ISO14001-6.1.3','Legal obligations','Environmental legal requirements are identified.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(11,'ISO14001-8.1','Environmental operations','Operational environmental controls are maintained.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(12,'OSHA-1910.147','Lockout tagout','Energy control procedures are implemented.','quarterly','DEP-ENG-001',TRUE,TRUE,1,1),(13,'OSHA-1910.1200','Hazard communication','Chemical hazards and SDS information are communicated.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(14,'OSHA-1910.146','Permit spaces','Permit-required confined spaces are controlled.','quarterly','DEP-ENG-001',TRUE,TRUE,1,1),(15,'OSHA-1910.178','Powered trucks','Forklift operators are trained and equipment inspected.','monthly','DEP-STORES-001',TRUE,TRUE,1,1),(16,'SINDH-LABOUR-01','Sindh Labour Law records','Required workforce and safety records are maintained.','annual','DEP-HR-001',TRUE,TRUE,1,1),(17,'PAK-FACTORY-01','Pakistan Factories Act','Factory health and safety obligations are reviewed.','annual','DEP-HSE-001',TRUE,TRUE,1,1),(18,'NEQS-AIR-01','NEQS air emissions','Air emission limits are monitored and evidenced.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(19,'NEQS-WATER-01','NEQS effluent','Effluent quality is monitored against applicable limits.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(20,'PEPA-01','PEPA environmental approval','Environmental approvals and conditions are maintained.','annual','DEP-HSE-001',TRUE,TRUE,1,1),(21,'FOOD-AUTH-01','Food authority license','Food authority license and conditions remain current.','annual','DEP-QC-001',TRUE,TRUE,1,1),(22,'GMP-01','GMP hygiene','Personnel hygiene and sanitation controls are implemented.','monthly','DEP-PROD-001',TRUE,TRUE,1,1),(23,'GMP-02','GMP pest control','Pest control records and corrective actions are current.','monthly','DEP-PROD-001',TRUE,TRUE,1,1),(24,'HACCP-01','HACCP hazard analysis','Hazard analysis is current and verified.','quarterly','DEP-QC-001',TRUE,TRUE,1,1),(25,'HACCP-02','HACCP CCP monitoring','Critical control points are monitored and recorded.','monthly','DEP-PROD-001',TRUE,TRUE,1,1),(26,'HACCP-03','HACCP verification','HACCP verification activities are completed.','quarterly','DEP-QC-001',TRUE,TRUE,1,1),(27,'COMP-POL-01','Company HSE policy','Company HSE policy is communicated and reviewed.','annual','DEP-HSE-001',TRUE,TRUE,1,1),(28,'COMP-POL-02','Permit to work','Permit-to-work controls are implemented.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(29,'COMP-POL-03','Emergency preparedness','Emergency plans, drills, and resources are maintained.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(30,'COMP-POL-04','Contractor management','Contractor prequalification and monitoring are completed.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(31,'COMP-POL-05','PPE program','PPE selection, issue, use, and inspection are controlled.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(32,'COMP-POL-06','Chemical inventory','Chemical inventory and SDS register are current.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(33,'COMP-POL-07','Machine guarding','Machine guards and emergency stops are inspected.','monthly','DEP-ENG-001',TRUE,TRUE,1,1),(34,'COMP-POL-08','Electrical safety','Electrical inspections and LOTO records are maintained.','quarterly','DEP-ENG-001',TRUE,TRUE,1,1),(35,'COMP-POL-09','Fire protection','Fire equipment inspection and testing are current.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(36,'COMP-POL-10','Waste management','Waste segregation, storage, and disposal are controlled.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(37,'COMP-POL-11','Training records','Mandatory training and competency records are maintained.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(38,'COMP-POL-12','Incident reporting','Incidents are reported, investigated, and closed.','quarterly','DEP-HSE-001',TRUE,TRUE,1,1),(39,'COMP-POL-13','Inspection program','Routine workplace inspections are completed.','monthly','DEP-HSE-001',TRUE,TRUE,1,1),(40,'COMP-POL-14','Management review','HSE and quality performance is reviewed by management.','semi_annual','DEP-HSE-001',TRUE,TRUE,1,1);

SELECT COUNT(*) AS requirement_count FROM am_compliance_requirements WHERE deleted_at IS NULL;
