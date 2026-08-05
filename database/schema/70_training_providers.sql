-- ==================================================
-- TABLE NAME
--   tm_training_providers
--
-- Purpose
--   Approved internal and external trainer/provider registry.
--
-- Relationships
--   employees for internal trainers; tm_training_sessions reference providers.
--
-- Indexes
--   Provider type/status, company, trainer, certification, email, deletion.
--
-- Workflow
--   Pending Approval -> Active -> Suspended/Inactive.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_providers (
    training_provider_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_type       ENUM('internal_trainer', 'external_consultant', 'government_organization', 'fire_brigade', 'nespak', 'supplier', 'vendor') NOT NULL,
    company             VARCHAR(255) NOT NULL,
    trainer_name        VARCHAR(200) NOT NULL,
    employee_id         CHAR(36) NULL,
    email               VARCHAR(255) NULL,
    phone               VARCHAR(30) NULL,
    address             VARCHAR(500) NULL,
    website             VARCHAR(500) NULL,
    certification       VARCHAR(500) NULL,
    active_status       ENUM('active', 'inactive', 'suspended', 'pending_approval') NOT NULL DEFAULT 'pending_approval',
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (training_provider_id),
    UNIQUE KEY uq_tm_provider_employee (employee_id),
    CONSTRAINT chk_tm_provider_internal_employee CHECK (provider_type <> 'internal_trainer' OR employee_id IS NOT NULL),
    CONSTRAINT fk_tm_provider_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_provider_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_provider_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_provider_type_status (provider_type, active_status),
    INDEX idx_tm_provider_company (company),
    INDEX idx_tm_provider_trainer (trainer_name),
    INDEX idx_tm_provider_certification (certification(100)),
    INDEX idx_tm_provider_email (email),
    INDEX idx_tm_provider_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Approved Training Management provider and trainer directory.';

INSERT INTO tm_training_providers
    (training_provider_id, provider_type, company, trainer_name, employee_id, email, phone, address, website, certification, active_status, created_by, updated_by)
VALUES
 (1,'internal_trainer','CBL Industries','Ahmed Raza Khan','EMP-HSE-001','ahmed.raza@cbl.com.pk','0300-1234567','CBL LU Sukkur Plant','https://www.cbl.com.pk','NEBOSH IGC; ISO 45001 Lead Auditor','active',1,1),
 (2,'internal_trainer','CBL Industries','Sara Ali','EMP-HSE-002','sara.ali@cbl.com.pk','0301-2345678','CBL LU Sukkur Plant','https://www.cbl.com.pk','IOSH; Fire Warden Instructor','active',1,1),
 (3,'internal_trainer','CBL Industries','Zafar Iqbal','EMP-ENG-001','zafar.iqbal@cbl.com.pk','0306-7890123','CBL LU Sukkur Plant','https://www.cbl.com.pk','Electrical Competent Person','active',1,1),
 (4,'external_consultant','SafePak Industrial Safety','Dr. Ayesha Malik',NULL,'training@safepak.example','0344-4444444','Sukkur, Sindh','https://safepak.example','MBBS; BLS Instructor','active',1,1),
 (5,'government_organization','Rescue 1122 Sindh','Rescue Training Cell',NULL,'training@rescue1122.example','071-5551122','Sukkur Emergency Services','https://rescue1122.example','Emergency Response Instructor','active',1,1),
 (6,'fire_brigade','Sukkur Fire Brigade','Fire Safety Officer',NULL,'fire.training@sukkur.example','071-5552211','Sukkur Municipal Fire Station','https://sukkur.example','Fire Brigade Competency Certificate','active',1,1),
 (7,'nespak','NESPAK HSE Services','Senior HSE Consultant',NULL,'hse@nespak.example','042-5553000','Lahore Regional Office','https://www.nespak.com.pk','ISO 45001 Lead Auditor','active',1,1),
 (8,'supplier','Pak Electrical Solutions','Technical Trainer',NULL,'trainer@pakelectrical.example','0322-2222222','Sukkur Industrial Estate','https://pakelectrical.example','Manufacturer Authorization','active',1,1),
 (9,'vendor','Industrial Skills Pakistan','Height Safety Team',NULL,'training@industrialskills.example','0322-5555555','Karachi Training Centre','https://industrialskills.example','IRATA Associate; Rescue Systems','active',1,1),
 (10,'external_consultant','Quality and Food Safety Associates','HACCP Lead Trainer',NULL,'trainer@qfsa.example','0300-7779911','Karachi, Sindh','https://qfsa.example','HACCP Lead; ISO 9001 Auditor','active',1,1);

SELECT training_provider_id, provider_type, company, trainer_name, active_status FROM tm_training_providers WHERE deleted_at IS NULL ORDER BY training_provider_id;
