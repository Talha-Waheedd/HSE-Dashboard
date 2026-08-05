-- ===========================================
-- Drop and Create Database
-- ===========================================
DROP DATABASE IF EXISTS cbl_db;

CREATE DATABASE cbl_db;
USE cbl_db;

-- ===========================================
-- Create Roles Table
-- ===========================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ===========================================
-- Insert Default Roles
-- ===========================================
INSERT INTO roles (name)
VALUES
('admin'),
('manager'),
('employee'),
('intern');

-- ===========================================
-- Create Users Table
-- ===========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,

    status BOOLEAN NOT NULL DEFAULT TRUE,

    role_id INT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ===========================================
-- Insert Sample Users
-- ===========================================
INSERT INTO users (name, email, status, role_id)
VALUES
('Ali Raza', 'ali@example.com', TRUE, 1),
('Ahmed Khan', 'ahmed@example.com', FALSE, 2),
('Sara Ali', 'sara@conti.com', TRUE, 4);

-- ===========================================
-- Verify Tables
-- ===========================================
SHOW TABLES;

SHOW CREATE TABLE roles;
SHOW CREATE TABLE users;

DESCRIBE roles;
DESCRIBE users;

SELECT DATABASE();

-- ===========================================
-- View Roles
-- ===========================================
SELECT * FROM roles;

-- ===========================================
-- View Users
-- ===========================================
SELECT * FROM users;

-- ===========================================
-- View Users with Role Names
-- ===========================================
SELECT
    u.id,
    u.name,
    u.email,
    u.status,
    r.name AS role,
    u.created_at,
    u.updated_at
FROM users u
JOIN roles r
ON u.role_id = r.id;