-- ==================================================
-- TABLE NAME
--   ra_dashboard_widgets
--
-- Purpose
--   Configurable executive, HSE, departmental, and administrative dashboard widgets.
--
-- Relationships
--   Created and updated by users; referenced by dashboard layouts.
--
-- Indexes
--   Widget code, module, active/display order, and soft deletion.
--
-- Workflow
--   Configure -> activate -> place on user dashboards -> retire without deletion.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS ra_dashboard_widgets (
    widget_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    widget_name     VARCHAR(150) NOT NULL,
    widget_code     VARCHAR(80) NOT NULL,
    widget_type     ENUM('KPI','Chart','Table','Gauge','Heatmap') NOT NULL,
    module_name     VARCHAR(80) NOT NULL,
    icon            VARCHAR(80) NULL,
    color           CHAR(7) NULL,
    display_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (widget_id),
    UNIQUE KEY uq_ra_widget_code (widget_code),
    CONSTRAINT chk_ra_widget_color CHECK (color IS NULL OR color REGEXP '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT fk_ra_widget_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_widget_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ra_widget_module_active (module_name, active, display_order),
    INDEX idx_ra_widget_type (widget_type),
    INDEX idx_ra_widget_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurable dashboard widget catalogue.';

INSERT INTO ra_dashboard_widgets
    (widget_name,widget_code,widget_type,module_name,icon,color,display_order,created_by,updated_by)
VALUES
 ('Total Hazards','TOTAL_HAZARDS','KPI','Hazards','shield','#2563EB',1,1,1),
 ('Open Hazards','OPEN_HAZARDS','KPI','Hazards','alert-triangle','#DC2626',2,1,1),
 ('Hazards by Risk','HAZARDS_BY_RISK','Heatmap','Hazards','layers','#F97316',3,1,1),
 ('Near Miss Trend','NEAR_MISS_TREND','Chart','Near Misses','trending-up','#0EA5E9',4,1,1),
 ('Open Near Misses','OPEN_NEAR_MISSES','KPI','Near Misses','eye','#F59E0B',5,1,1),
 ('Total Incidents','TOTAL_INCIDENTS','KPI','Incidents','activity','#7C3AED',6,1,1),
 ('TRIR','TRIR','Gauge','Incidents','gauge','#B91C1C',7,1,1),
 ('LTIFR','LTIFR','Gauge','Incidents','clock','#991B1B',8,1,1),
 ('Incident Severity','INCIDENT_SEVERITY','Chart','Incidents','bar-chart','#EF4444',9,1,1),
 ('Lost Time Days','LOST_TIME_DAYS','KPI','Incidents','calendar-x','#DC2626',10,1,1),
 ('Training Manhours','TRAINING_MANHOURS','KPI','Training','book-open','#059669',11,1,1),
 ('Training Compliance','TRAINING_COMPLIANCE','Gauge','Training','graduation-cap','#16A34A',12,1,1),
 ('Certificate Expiry','CERTIFICATE_EXPIRY','Table','Training','badge-alert','#D97706',13,1,1),
 ('Audit Score','AUDIT_SCORE','Gauge','Audits','clipboard-check','#0891B2',14,1,1),
 ('Open Findings','OPEN_FINDINGS','KPI','Audits','clipboard-x','#EA580C',15,1,1),
 ('CAPA Closure Rate','CAPA_CLOSURE_RATE','Gauge','CAPA','check-circle','#22C55E',16,1,1),
 ('Overdue CAPA','OVERDUE_CAPA','KPI','CAPA','timer-off','#DC2626',17,1,1),
 ('Compliance Status','COMPLIANCE_STATUS','Heatmap','Compliance','scale','#4F46E5',18,1,1),
 ('Risk Heat Map','RISK_HEATMAP','Heatmap','Risk','grid-3x3','#F97316',19,1,1),
 ('Department Performance','DEPARTMENT_PERFORMANCE','Table','Executive','building-2','#1D4ED8',20,1,1),
 ('Employee Performance','EMPLOYEE_PERFORMANCE','Table','Executive','users','#1E40AF',21,1,1),
 ('Monthly HSE Trend','MONTHLY_HSE_TREND','Chart','Executive','line-chart','#0284C7',22,1,1),
 ('Yearly HSE Comparison','YEARLY_HSE_COMPARISON','Chart','Executive','bar-chart-3','#4338CA',23,1,1),
 ('Leading Indicators','LEADING_INDICATORS','Table','Executive','arrow-up-right','#059669',24,1,1),
 ('Lagging Indicators','LAGGING_INDICATORS','Table','Executive','arrow-down-right','#DC2626',25,1,1),
 ('Audit Calendar','AUDIT_CALENDAR','Table','Audits','calendar-days','#0891B2',26,1,1),
 ('Inspection Compliance','INSPECTION_COMPLIANCE','Gauge','Inspections','search-check','#0F766E',27,1,1),
 ('Regulatory Compliance','REGULATORY_COMPLIANCE','Gauge','Compliance','landmark','#7C3AED',28,1,1),
 ('Cost Analysis','HSE_COST_ANALYSIS','Chart','Finance','coins','#CA8A04',29,1,1),
 ('Executive Scorecard','EXECUTIVE_SCORECARD','Table','Executive','layout-dashboard','#111827',30,1,1);

