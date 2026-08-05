-- ==================================================
-- TABLE NAME
--   dms_documents
--
-- Purpose
--   Controlled document master record. Unlimited versions, approvals, circulation,
--   acknowledgements, notifications, and immutable change history attach to this hub.
--
-- Relationships
--   dms_document_categories, dms_document_types, plants, departments, employees, users.
--
-- Indexes
--   Number/title, plant/department/category/type, owner/status, review/expiry, version, deletion.
--
-- Workflow
--   Draft -> Pending Approval -> Approved -> Active -> Archived/Obsolete.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_documents (
    document_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    document_number   VARCHAR(30) GENERATED ALWAYS AS (CONCAT('DMS-',YEAR(issue_date),'-',LPAD(document_id,5,'0'))) STORED,
    title             VARCHAR(255) NOT NULL,
    category_id       BIGINT UNSIGNED NOT NULL,
    document_type_id  BIGINT UNSIGNED NOT NULL,
    plant_id          CHAR(36) NOT NULL,
    department_id     CHAR(36) NULL,
    owner_id          CHAR(36) NOT NULL,
    author_id         CHAR(36) NOT NULL,
    approver_id       CHAR(36) NULL,
    current_version   DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    issue_date        DATE NOT NULL,
    review_date       DATE NULL,
    expiry_date       DATE NULL,
    effective_date    DATE NULL,
    status            ENUM('draft','pending_approval','approved','active','archived','obsolete') NOT NULL DEFAULT 'draft',
    keywords          VARCHAR(1000) NULL,
    description       TEXT NULL,
    storage_path      VARCHAR(1000) NULL,
    qr_code           VARCHAR(255) NULL,
    barcode           VARCHAR(255) NULL,
    created_by        BIGINT UNSIGNED NOT NULL,
    updated_by        BIGINT UNSIGNED NOT NULL,
    created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3) NULL,
    PRIMARY KEY (document_id),
    UNIQUE KEY uq_dms_document_number (document_number),
    UNIQUE KEY uq_dms_document_qr (qr_code),
    UNIQUE KEY uq_dms_document_barcode (barcode),
    CONSTRAINT chk_dms_document_version CHECK (current_version > 0),
    CONSTRAINT chk_dms_document_dates CHECK ((review_date IS NULL OR review_date >= issue_date) AND (expiry_date IS NULL OR expiry_date >= issue_date) AND (effective_date IS NULL OR effective_date >= issue_date)),
    CONSTRAINT fk_dms_document_category FOREIGN KEY (category_id) REFERENCES dms_document_categories (category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_type FOREIGN KEY (document_type_id) REFERENCES dms_document_types (document_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_owner FOREIGN KEY (owner_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_author FOREIGN KEY (author_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_approver FOREIGN KEY (approver_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_document_title (title),
    INDEX idx_dms_document_plant_department (plant_id, department_id),
    INDEX idx_dms_document_category_type (category_id, document_type_id),
    INDEX idx_dms_document_owner_status (owner_id, status),
    INDEX idx_dms_document_review_expiry (review_date, expiry_date),
    INDEX idx_dms_document_version (current_version),
    INDEX idx_dms_document_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Controlled document master hub.';

INSERT INTO dms_documents (document_id,title,category_id,document_type_id,plant_id,department_id,owner_id,author_id,approver_id,current_version,issue_date,review_date,expiry_date,effective_date,status,keywords,description,storage_path,qr_code,barcode,created_by,updated_by)
VALUES
 (1,'HSE Policy',4,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-001','EMP-HSE-001',2.00,'2026-01-05','2027-01-05',NULL,'2026-01-10','active','HSE policy leadership commitment','CBL occupational health and safety policy.','dms/sop/DMS-2026-00001/v2.pdf','QR-DMS-00001','DMS00001',1,1),
 (2,'Permit to Work Procedure',3,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-002','EMP-HSE-001',3.00,'2026-01-08','2027-01-08',NULL,'2026-01-15','active','permit hot work confined space','Controlled permit-to-work process.','dms/procedures/DMS-2026-00002/v3.pdf','QR-DMS-00002','DMS00002',1,1),
 (3,'LOTO Procedure',1,1,'PLT-CBL-SKR-001','DEP-ENG-001','EMP-ENG-001','EMP-ENG-001','EMP-HSE-001',2.00,'2026-01-12','2027-01-12',NULL,'2026-01-20','active','lockout tagout isolation energy','Energy control procedure.','dms/sop/DMS-2026-00003/v2.pdf','QR-DMS-00003','DMS00003',3,1),
 (4,'Fire Emergency Procedure',11,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',2.00,'2026-01-15','2027-01-15',NULL,'2026-01-20','active','fire emergency evacuation','Fire response and evacuation procedure.','dms/emergency/DMS-2026-00004/v2.pdf','QR-DMS-00004','DMS00004',2,1),
 (5,'Chemical Handling SOP',1,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',2.00,'2026-01-20','2027-01-20',NULL,'2026-01-25','active','chemical SDS spill PPE','Chemical handling and spill prevention.','dms/sop/DMS-2026-00005/v2.pdf','QR-DMS-00005','DMS00005',2,1),
 (6,'Machine Guarding Work Instruction',2,1,'PLT-CBL-SKR-001','DEP-ENG-001','EMP-ENG-001','EMP-ENG-001','EMP-HSE-001',2.00,'2026-01-25','2027-01-25',NULL,'2026-02-01','active','machine guard interlock','Machine guarding inspection instruction.','dms/work-instructions/DMS-2026-00006/v2.pdf','QR-DMS-00006','DMS00006',3,1),
 (7,'Food Hygiene SOP',17,1,'PLT-CBL-SKR-001','DEP-PROD-001','EMP-PROD-001','EMP-HSE-002','EMP-HSE-001',2.00,'2026-02-01','2027-02-01',NULL,'2026-02-05','active','food hygiene GMP','Food hygiene and personnel practice SOP.','dms/food-safety/DMS-2026-00007/v2.pdf','QR-DMS-00007','DMS00007',2,1),
 (8,'HACCP Plan',17,1,'PLT-CBL-SKR-001','DEP-PROD-001','EMP-PROD-001','EMP-PROD-001','EMP-HSE-001',1.00,'2026-02-05','2027-02-05',NULL,'2026-02-10','active','HACCP CCP monitoring','Plant HACCP plan and verification schedule.','dms/food-safety/DMS-2026-00008/v1.pdf','QR-DMS-00008','DMS00008',4,1),
 (9,'Environmental Aspect Register',18,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',2.00,'2026-02-10','2027-02-10',NULL,'2026-02-15','active','environment aspects impacts','Environmental aspect and impact register.','dms/environment/DMS-2026-00009/v2.xlsx','QR-DMS-00009','DMS00009',2,1),
 (10,'Emergency Drill Plan',11,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',1.00,'2026-02-15','2027-02-15',NULL,'2026-02-20','active','emergency drill assembly','Annual emergency drill plan.','dms/emergency/DMS-2026-00010/v1.pdf','QR-DMS-00010','DMS00010',2,1),
 (11,'PPE Selection Procedure',1,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-003','EMP-HSE-001',1.00,'2026-02-20','2027-02-20',NULL,'2026-02-25','active','PPE selection issue inspection','PPE selection and issue procedure.','dms/sop/DMS-2026-00011/v1.pdf','QR-DMS-00011','DMS00011',1,1),
 (12,'Working at Height SOP',1,1,'PLT-CBL-SKR-001','DEP-ENG-001','EMP-ENG-001','EMP-HSE-003','EMP-HSE-001',1.00,'2026-02-25','2027-02-25',NULL,'2026-03-01','active','height fall rescue','Working at height and rescue procedure.','dms/sop/DMS-2026-00012/v1.pdf','QR-DMS-00012','DMS00012',3,1),
 (13,'Confined Space Entry Procedure',3,1,'PLT-CBL-SKR-001','DEP-ENG-001','EMP-ENG-001','EMP-HSE-003','EMP-HSE-001',1.00,'2026-03-01','2027-03-01',NULL,'2026-03-05','active','confined space permit gas test','Confined space entry procedure.','dms/procedures/DMS-2026-00013/v1.pdf','QR-DMS-00013','DMS00013',3,1),
 (14,'First Aid Response Procedure',11,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',1.00,'2026-03-05','2027-03-05',NULL,'2026-03-10','active','first aid medical response','First aid response and escalation.','dms/emergency/DMS-2026-00014/v1.pdf','QR-DMS-00014','DMS00014',2,1),
 (15,'Incident Reporting Procedure',3,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-002','EMP-HSE-001',1.00,'2026-03-10','2027-03-10',NULL,'2026-03-15','active','incident accident reporting','Incident reporting and investigation procedure.','dms/procedures/DMS-2026-00015/v1.pdf','QR-DMS-00015','DMS00015',1,1),
 (16,'Risk Assessment Methodology',10,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-001','EMP-HSE-001',1.00,'2026-03-15','2027-03-15',NULL,'2026-03-20','active','risk matrix hazard identification','Risk assessment methodology.','dms/risk-assessments/DMS-2026-00016/v1.pdf','QR-DMS-00016','DMS00016',1,1),
 (17,'Maintenance Work Order Procedure',19,1,'PLT-CBL-SKR-001','DEP-ENG-001','EMP-ENG-001','EMP-ENG-001','EMP-HSE-001',1.00,'2026-03-20','2027-03-20',NULL,'2026-03-25','active','maintenance work order control','Maintenance work planning procedure.','dms/maintenance/DMS-2026-00017/v1.pdf','QR-DMS-00017','DMS00017',3,1),
 (18,'Boiler Operating Manual',7,6,'PLT-CBL-SKR-001','DEP-ENG-001','EMP-ENG-001','EMP-ENG-001','EMP-HSE-001',1.00,'2026-03-25','2027-03-25',NULL,'2026-04-01','active','boiler operation steam','Controlled boiler manufacturer manual.','dms/manuals/DMS-2026-00018/v1.pdf','QR-DMS-00018','DMS00018',3,1),
 (19,'SDS Chemical Inventory',24,6,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',1.00,'2026-04-01','2026-10-01','2026-10-01','2026-04-01','active','SDS chemical inventory','Safety data sheet register.','dms/sds/DMS-2026-00019/v1.xlsx','QR-DMS-00019','DMS00019',2,1),
 (20,'Contractor HSE Requirements',3,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-002','EMP-HSE-001',1.00,'2026-04-05','2027-04-05',NULL,'2026-04-10','active','contractor HSE induction permit','Contractor HSE requirements.','dms/procedures/DMS-2026-00020/v1.pdf','QR-DMS-00020','DMS00020',1,1),
 (21,'Quality Control Plan',16,1,'PLT-CBL-SKR-001','DEP-QC-001','EMP-QC-001','EMP-QC-001','EMP-HSE-001',1.00,'2026-04-10','2027-04-10',NULL,'2026-04-15','active','quality control inspection','Production quality control plan.','dms/quality/DMS-2026-00021/v1.pdf','QR-DMS-00021','DMS00021',11,1),
 (22,'Cleaning and Sanitation SOP',1,1,'PLT-CBL-SKR-001','DEP-PROD-001','EMP-PROD-001','EMP-HSE-002','EMP-HSE-001',1.00,'2026-04-15','2027-04-15',NULL,'2026-04-20','active','cleaning sanitation GMP','Cleaning and sanitation instructions.','dms/food-safety/DMS-2026-00022/v1.pdf','QR-DMS-00022','DMS00022',2,1),
 (23,'Warehouse Storage Work Instruction',2,1,'PLT-CBL-SKR-001','DEP-STORES-001','EMP-PROD-001','EMP-PROD-002','EMP-HSE-001',1.00,'2026-04-20','2027-04-20',NULL,'2026-04-25','active','warehouse racking traffic','Warehouse storage and traffic work instruction.','dms/work-instructions/DMS-2026-00023/v1.pdf','QR-DMS-00023','DMS00023',4,1),
 (24,'Legal Register',13,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-001','EMP-HSE-001',1.00,'2026-04-25','2026-10-25',NULL,'2026-04-30','active','legal compliance register','Legal and other requirements register.','dms/legal/DMS-2026-00024/v1.xlsx','QR-DMS-00024','DMS00024',1,1),
 (25,'Training Records Procedure',3,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-002','EMP-HSE-001',1.00,'2026-05-01','2027-05-01',NULL,'2026-05-05','active','training competency records','Training records and competency procedure.','dms/procedures/DMS-2026-00025/v1.pdf','QR-DMS-00025','DMS00025',1,1),
 (26,'Environmental Spill Response',18,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',1.00,'2026-05-05','2027-05-05',NULL,'2026-05-10','active','spill response cleanup reporting','Environmental spill response plan.','dms/environment/DMS-2026-00026/v1.pdf','QR-DMS-00026','DMS00026',2,1),
 (27,'Emergency Contact List',11,5,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',1.00,'2026-05-10','2026-11-10',NULL,'2026-05-10','active','emergency contacts phone numbers','Controlled emergency contact list.','dms/emergency/DMS-2026-00027/v1.xlsx','QR-DMS-00027','DMS00027',2,1),
 (28,'Food Allergen Control Plan',17,1,'PLT-CBL-SKR-001','DEP-PROD-001','EMP-PROD-001','EMP-QC-001','EMP-HSE-001',1.00,'2026-05-15','2027-05-15',NULL,'2026-05-20','active','allergen food safety HACCP','Allergen control and labeling plan.','dms/food-safety/DMS-2026-00028/v1.pdf','QR-DMS-00028','DMS00028',11,1),
 (29,'ISO 45001 Manual',12,1,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-001','EMP-HSE-001','EMP-HSE-001',1.00,'2026-05-20','2027-05-20',NULL,'2026-05-25','active','ISO 45001 manual management system','OH&S management-system manual.','dms/iso/DMS-2026-00029/v1.pdf','QR-DMS-00029','DMS00029',1,1),
 (30,'Visitor Safety Form',5,5,'PLT-CBL-SKR-001','DEP-HSE-001','EMP-HSE-002','EMP-HSE-002','EMP-HSE-001',1.00,'2026-05-25','2027-05-25',NULL,'2026-06-01','active','visitor induction record','Controlled visitor safety form.','dms/forms/DMS-2026-00030/v1.docx','QR-DMS-00030','DMS00030',2,1);

SELECT COUNT(*) AS document_count FROM dms_documents WHERE deleted_at IS NULL;
