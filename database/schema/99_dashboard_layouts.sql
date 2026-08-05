-- ==================================================
-- TABLE NAME
--   ra_dashboard_layouts
--
-- Purpose
--   Stores personalized dashboard placement and visibility for each user.
--
-- Relationships
--   Users own layouts; each layout references one configurable widget.
--
-- Indexes
--   User/dashboard, widget, visible widgets, and soft deletion.
--
-- Workflow
--   Create dashboard -> place widgets -> resize/reorder -> hide/show.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS ra_dashboard_layouts (
    layout_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    dashboard_name  VARCHAR(120) NOT NULL,
    widget_id       BIGINT UNSIGNED NOT NULL,
    position_x      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    position_y      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    width           SMALLINT UNSIGNED NOT NULL DEFAULT 4,
    height          SMALLINT UNSIGNED NOT NULL DEFAULT 3,
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (layout_id),
    UNIQUE KEY uq_ra_layout_widget (user_id,dashboard_name,widget_id),
    CONSTRAINT chk_ra_layout_geometry CHECK (width BETWEEN 1 AND 12 AND height BETWEEN 1 AND 20),
    CONSTRAINT fk_ra_layout_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_layout_widget FOREIGN KEY (widget_id) REFERENCES ra_dashboard_widgets(widget_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_layout_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_layout_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ra_layout_user_dashboard (user_id,dashboard_name,visible),
    INDEX idx_ra_layout_widget (widget_id),
    INDEX idx_ra_layout_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Per-user dashboard layout preferences.';

INSERT INTO ra_dashboard_layouts
    (user_id,dashboard_name,widget_id,position_x,position_y,width,height,visible,created_by,updated_by)
VALUES
 (1,'Executive HSE Dashboard',30,0,0,12,4,TRUE,1,1),
 (1,'Executive HSE Dashboard',6,0,4,3,3,TRUE,1,1),
 (1,'Executive HSE Dashboard',16,3,4,3,3,TRUE,1,1),
 (2,'HSE Manager Dashboard',1,0,0,3,3,TRUE,1,1),
 (2,'HSE Manager Dashboard',2,3,0,3,3,TRUE,1,1),
 (2,'HSE Manager Dashboard',17,6,0,3,3,TRUE,1,1),
 (3,'Plant Performance',6,0,0,4,3,TRUE,1,1),
 (3,'Plant Performance',14,4,0,4,3,TRUE,1,1),
 (4,'Department Safety',11,0,0,4,3,TRUE,1,1),
 (4,'Department Safety',20,4,0,8,5,TRUE,1,1);

