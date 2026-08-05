-- ==============================================================================
-- File: 140_dropdown_values.sql
-- Description: Stores specific values for each dropdown configured in dropdown_master
-- ==============================================================================

CREATE TABLE IF NOT EXISTS dropdown_values (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    dropdown_master_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to dropdown_master',
    parent_value_id BIGINT UNSIGNED NULL COMMENT 'FK to self for hierarchical/dependent dropdowns',
    value_code VARCHAR(100) NOT NULL COMMENT 'System code for the value (e.g., LTI)',
    display_label VARCHAR(100) NOT NULL COMMENT 'Label shown to the user (e.g., Lost Time Injury)',
    description VARCHAR(255) COMMENT 'Details about this specific value',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order in the UI',
    icon VARCHAR(100) COMMENT 'Icon identifier/class (e.g., lucide:alert-triangle)',
    color_code VARCHAR(20) COMMENT 'Hex color code for UI badges (e.g., #CB0017)',
    translations JSON COMMENT 'JSON containing translations ({"ur": "نقصان دہ", "ar": "..."})',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this value is selectable',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is this the default selection?',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_dropdown_master_code (dropdown_master_id, value_code, deleted_at),
    INDEX idx_dropdown_parent (parent_value_id),
    INDEX idx_display_order (dropdown_master_id, display_order),
    
    CONSTRAINT fk_dropdown_val_master FOREIGN KEY (dropdown_master_id) 
        REFERENCES dropdown_master (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_dropdown_val_parent FOREIGN KEY (parent_value_id) 
        REFERENCES dropdown_values (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Specific values for configurable dropdowns';

-- ==============================================================================
-- Seed Data (Example partial seed using nested SELECT for safety)
-- ==============================================================================
INSERT INTO dropdown_values 
    (dropdown_master_id, value_code, display_label, display_order, color_code, is_default) 
SELECT id, 'LTI', 'Lost Time Injury', 10, '#CB0017', FALSE FROM dropdown_master WHERE code = 'INCIDENT_TYPES' UNION ALL
SELECT id, 'RWC', 'Restricted Work Case', 20, '#F59E0B', FALSE FROM dropdown_master WHERE code = 'INCIDENT_TYPES' UNION ALL
SELECT id, 'MTC', 'Medical Treatment Case', 30, '#FCD34D', FALSE FROM dropdown_master WHERE code = 'INCIDENT_TYPES' UNION ALL
SELECT id, 'FAC', 'First Aid Case', 40, '#10B981', TRUE FROM dropdown_master WHERE code = 'INCIDENT_TYPES' UNION ALL
SELECT id, 'EXTREME', 'Extreme Risk', 10, '#991B1B', FALSE FROM dropdown_master WHERE code = 'RISK_LEVELS' UNION ALL
SELECT id, 'HIGH', 'High Risk', 20, '#DC2626', FALSE FROM dropdown_master WHERE code = 'RISK_LEVELS' UNION ALL
SELECT id, 'MEDIUM', 'Medium Risk', 30, '#F59E0B', FALSE FROM dropdown_master WHERE code = 'RISK_LEVELS' UNION ALL
SELECT id, 'LOW', 'Low Risk', 40, '#10B981', TRUE FROM dropdown_master WHERE code = 'RISK_LEVELS';

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'dropdown_values' AS table_name, COUNT(*) AS record_count FROM dropdown_values;
