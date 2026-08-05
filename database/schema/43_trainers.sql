-- ==================================================
-- TABLE NAME
--   trainers
--
-- Purpose
--   Registry for internal trainers, external trainers, consultants, and vendors.
--   Supports qualification, specialization, experience, certification, and vendor
--   performance reporting.
--
-- Relationships
--   employees and departments for internal trainers; training_sessions reference trainers.
--   Audit ownership references users.
--
-- Indexes
--   Trainer type/status, employee, department, specialization, certification, email.
--
-- Workflow
--   Active -> Approved for delivery -> Suspended/Inactive based on qualification review.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS trainers (
    trainer_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id      CHAR(36) NULL COMMENT 'FK -> employees.employee_id for internal trainers.',
    trainer_name     VARCHAR(200) NOT NULL,
    trainer_type     ENUM('internal', 'external', 'consultant', 'vendor') NOT NULL,
    company          VARCHAR(255) NULL,
    department_id    CHAR(36) NULL,
    qualification    VARCHAR(500) NOT NULL,
    specialization   VARCHAR(500) NOT NULL,
    phone            VARCHAR(30) NULL,
    email            VARCHAR(255) NULL,
    experience_years DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    certification    VARCHAR(500) NULL,
    status           ENUM('active', 'inactive', 'suspended', 'pending_approval') NOT NULL DEFAULT 'pending_approval',
    created_by       BIGINT UNSIGNED NOT NULL,
    updated_by       BIGINT UNSIGNED NOT NULL,
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at       DATETIME(3) NULL,

    PRIMARY KEY (trainer_id),
    UNIQUE KEY uq_trainer_employee (employee_id),
    CONSTRAINT chk_trainer_experience CHECK (experience_years >= 0),
    CONSTRAINT chk_trainer_internal_employee CHECK (trainer_type <> 'internal' OR employee_id IS NOT NULL),
    CONSTRAINT fk_trainer_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trainer_department FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trainer_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trainer_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_trainer_type_status (trainer_type, status),
    INDEX idx_trainer_department (department_id, status),
    INDEX idx_trainer_specialization (specialization(100)),
    INDEX idx_trainer_certification (certification(100)),
    INDEX idx_trainer_email (email),
    INDEX idx_trainer_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Qualified internal and external training provider registry.';

INSERT INTO trainers
    (trainer_id, employee_id, trainer_name, trainer_type, company, department_id, qualification, specialization, phone, email, experience_years, certification, status, created_by, updated_by)
VALUES
    (1, 'EMP-HSE-001', 'Ahmed Raza Khan', 'internal', 'CBL Industries', 'DEP-HSE-001', 'B.E. Chemical Engineering; NEBOSH IGC', 'HSE leadership, incident investigation, ISO 45001', '0300-1234567', 'ahmed.raza@cbl.com.pk', 12.00, 'NEBOSH IGC; ISO 45001 Lead Auditor', 'active', 1, 1),
    (2, 'EMP-HSE-002', 'Sara Ali', 'internal', 'CBL Industries', 'DEP-HSE-001', 'B.Sc. Environmental Sciences; IOSH Managing Safely', 'Fire safety, emergency response, environmental awareness', '0301-2345678', 'sara.ali@cbl.com.pk', 8.00, 'IOSH; Fire Warden Instructor', 'active', 1, 1),
    (3, 'EMP-ENG-001', 'Zafar Iqbal', 'internal', 'CBL Industries', 'DEP-ENG-001', 'B.E. Electrical Engineering', 'Electrical safety, LOTO, machine safety', '0306-7890123', 'zafar.iqbal@cbl.com.pk', 14.00, 'Electrical Safety Competent Person', 'active', 1, 1),
    (4, NULL, 'Dr. Ayesha Malik', 'consultant', 'SafePak Industrial Safety', NULL, 'MBBS; Occupational Health Diploma', 'First aid, occupational health, fitness assessment', '0344-4444444', 'asif@safepak.com', 16.00, 'Pakistan Medical Council; BLS Instructor', 'active', 1, 1),
    (5, NULL, 'Usman Training Services', 'vendor', 'Industrial Skills Pakistan', NULL, 'Authorized equipment manufacturer trainer', 'Confined space, working at height, rescue systems', '0322-5555555', 'training@industrialskills.example', 11.00, 'Manufacturer Authorizations; IRATA Associate', 'active', 1, 1);

SELECT trainer_id, trainer_name, trainer_type, specialization, status
FROM trainers WHERE deleted_at IS NULL ORDER BY trainer_id;
