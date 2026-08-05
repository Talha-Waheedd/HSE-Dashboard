-- ==========================================================
-- TABLE: plants
-- DESCRIPTION: Stores all CBL plant information
-- ==========================================================
CREATE DATABASE cbl_hse;
Use cbl_hse;

CREATE TABLE plants (
    plant_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    plant_code VARCHAR(20) NOT NULL UNIQUE,
    plant_name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),

    company_name VARCHAR(150) NOT NULL,

    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',

    address TEXT,

    phone VARCHAR(30),
    email VARCHAR(120),

    plant_manager_id BIGINT UNSIGNED NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT UNSIGNED NOT NULL,
    updated_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL DEFAULT NULL
);
INSERT INTO plants (
    plant_code,
    plant_name,
    short_name,
    company_name,
    city,
    province,
    country,
    address,
    phone,
    email,
    created_by
)
VALUES
(
    'LU-SKK',
    'LU Sukkur Plant',
    'LU Sukkur',
    'Continental Biscuits Limited',
    'Sukkur',
    'Sindh',
    'Pakistan',
    'Rohri Bypass Road, Sukkur',
    '+92-71-1234567',
    'lusukkur@continentalbiscuits.com',
    1
);

SHOW TABLES;
DESCRIBE plants;
SELECT * FROM plants;