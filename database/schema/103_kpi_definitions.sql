-- ==================================================
-- TABLE NAME
--   ra_kpi_definitions
--
-- Purpose
--   Enterprise KPI catalogue for leading, lagging, operational, compliance,
--   and executive HSE performance indicators.
--
-- Relationships
--   Referenced by KPI targets; source modules remain normalized and are queried
--   by the formula metadata or reporting views.
--
-- Indexes
--   Unique KPI name, module/frequency, active state, and soft deletion.
--
-- Workflow
--   Define -> approve formula -> configure targets -> snapshot -> dashboard.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS ra_kpi_definitions (
    kpi_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    kpi_name        VARCHAR(180) NOT NULL,
    formula         TEXT NOT NULL,
    module_name     VARCHAR(80) NOT NULL,
    frequency       ENUM('Daily','Weekly','Monthly','Quarterly','Yearly','On Demand') NOT NULL,
    target_value    DECIMAL(18,4) NULL,
    unit            VARCHAR(40) NOT NULL,
    description     TEXT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (kpi_id),
    UNIQUE KEY uq_ra_kpi_name (kpi_name),
    CONSTRAINT fk_ra_kpi_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_kpi_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ra_kpi_module_frequency (module_name,frequency,active),
    INDEX idx_ra_kpi_unit (unit),
    INDEX idx_ra_kpi_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master KPI definition and formula catalogue.';

INSERT INTO ra_kpi_definitions
    (kpi_name,formula,module_name,frequency,target_value,unit,description,created_by,updated_by)
VALUES
 ('Total Hazards','COUNT(hazards.hazard_id)','Hazards','Monthly',NULL,'count','All active hazard observations.',1,1),
 ('Open Hazards','COUNT(open hazards)','Hazards','Weekly',0,'count','Hazards not in a closed status.',1,1),
 ('Closed Hazards','COUNT(closed hazards)','Hazards','Monthly',NULL,'count','Hazards closed after review and action.',1,1),
 ('High Risk Hazards','COUNT(risk_rating IN EXTREME,HIGH)','Hazards','Monthly',0,'count','Extreme and high-risk hazard population.',1,1),
 ('Hazard Closure Rate','closed hazards / total hazards * 100','Hazards','Monthly',95,'percent','Percentage of hazards closed in period.',1,1),
 ('Average Hazard Closure Days','AVG(closure_date - reported_datetime)','Hazards','Monthly',14,'days','Average elapsed hazard closure time.',1,1),
 ('Total Near Misses','COUNT(near_misses.near_miss_id)','Near Misses','Monthly',NULL,'count','All active near miss observations.',1,1),
 ('Open Near Misses','COUNT(open near misses)','Near Misses','Weekly',0,'count','Near misses awaiting closure.',1,1),
 ('Near Miss Reporting Rate','near misses / 100 employees','Near Misses','Monthly',5,'per 100 employees','Leading participation indicator.',1,1),
 ('Near Miss Closure Rate','closed near misses / total * 100','Near Misses','Monthly',95,'percent','Near miss closure performance.',1,1),
 ('Total Incidents','COUNT(incidents.incident_id)','Incidents','Monthly',0,'count','All workplace incidents.',1,1),
 ('First Aid Cases','COUNT(first aid incidents)','Incidents','Monthly',0,'count','Incidents requiring first aid only.',1,1),
 ('Medical Treatment Cases','COUNT(MTC incidents)','Incidents','Monthly',0,'count','Medical treatment cases.',1,1),
 ('Restricted Work Cases','COUNT(RWC incidents)','Incidents','Monthly',0,'count','Restricted work cases.',1,1),
 ('Lost Time Injuries','COUNT(LTI incidents)','Incidents','Monthly',0,'count','Lost time injury cases.',1,1),
 ('Fatalities','COUNT(fatal incidents)','Incidents','Yearly',0,'count','Work-related fatalities.',1,1),
 ('TRIR','recordable cases * 200000 / manhours','Incidents','Monthly',0,'rate','Total recordable incident rate.',1,1),
 ('LTIFR','lost time injuries * 1000000 / manhours','Incidents','Monthly',0,'rate','Lost time injury frequency rate.',1,1),
 ('Severity Rate','lost days * 1000000 / manhours','Incidents','Monthly',0,'rate','Lost-time injury severity rate.',1,1),
 ('Lost Time Days','SUM(injury_details.days_lost)','Incidents','Monthly',0,'days','Aggregate days lost to injury.',1,1),
 ('Incident Closure Rate','closed incidents / total incidents * 100','Incidents','Monthly',95,'percent','Incident lifecycle closure rate.',1,1),
 ('Average Incident Closure Days','AVG(closure - event date)','Incidents','Monthly',30,'days','Average investigation and closure time.',1,1),
 ('Contractor Incident Rate','contractor incidents / total incidents * 100','Incidents','Monthly',0,'percent','Contractor event proportion.',1,1),
 ('Environmental Incident Count','COUNT(environmental impacts)','Environment','Monthly',0,'count','Environmental incident population.',1,1),
 ('Total Training Manhours','SUM(training attendance manhours)','Training','Monthly',NULL,'hours','Employee participation hours.',1,1),
 ('Mandatory Training Compliance','completed mandatory / required * 100','Training','Monthly',98,'percent','Mandatory training completion.',1,1),
 ('Training Attendance Rate','present participants / planned * 100','Training','Monthly',95,'percent','Participation effectiveness.',1,1),
 ('Training Effectiveness','AVG(training evaluation score)','Training','Monthly',85,'percent','Post-training evaluation result.',1,1),
 ('Expired Certifications','COUNT(expired certifications)','Training','Weekly',0,'count','Certificates requiring renewal.',1,1),
 ('Training Cost per Employee','training cost / attendees','Training','Monthly',500,'currency/employee','Cost efficiency.',1,1),
 ('Audit Score','AVG(audit compliance percentage)','Audits','Monthly',90,'percent','Average audit result.',1,1),
 ('Audit Completion Rate','completed audits / planned audits * 100','Audits','Monthly',95,'percent','Audit plan completion.',1,1),
 ('Open Audit Findings','COUNT(open audit findings)','Audits','Weekly',0,'count','Open audit observations and NCs.',1,1),
 ('Major Finding Rate','major findings / total findings * 100','Audits','Monthly',0,'percent','Share of major or critical findings.',1,1),
 ('Inspection Pass Rate','passed inspections / total * 100','Inspections','Monthly',95,'percent','Inspection result performance.',1,1),
 ('CAPA Closure Rate','verified CAPA / total CAPA * 100','CAPA','Monthly',95,'percent','Corrective action effectiveness.',1,1),
 ('Overdue CAPA','COUNT(CAPA due date < today)','CAPA','Weekly',0,'count','Actions beyond target date.',1,1),
 ('Average CAPA Closure Days','AVG(completion date - created date)','CAPA','Monthly',21,'days','CAPA cycle-time indicator.',1,1),
 ('CAPA Verification Rate','verified actions / completed actions * 100','CAPA','Monthly',98,'percent','Verification discipline.',1,1),
 ('Compliance Percentage','compliant reviews / total reviews * 100','Compliance','Monthly',100,'percent','Legal and standard compliance.',1,1),
 ('Overdue Compliance Items','COUNT(overdue compliance tracking)','Compliance','Weekly',0,'count','Overdue regulatory obligations.',1,1),
 ('Compliance Review Completion','completed reviews / scheduled * 100','Compliance','Monthly',100,'percent','Compliance review plan delivery.',1,1),
 ('Employee Participation Rate','employees with HSE activity / active employees * 100','People','Monthly',90,'percent','Employee engagement indicator.',1,1),
 ('Department Safety Score','weighted department KPI score','Executive','Monthly',90,'percent','Department composite score.',1,1),
 ('Leading Indicator Index','weighted hazards + near misses + training + inspections','Executive','Monthly',90,'index','Composite leading indicator.',1,1),
 ('Lagging Indicator Index','weighted incidents + lost days + severity','Executive','Monthly',0,'index','Composite lagging indicator.',1,1),
 ('HSE Cost','incident + CAPA + training cost','Finance','Monthly',NULL,'currency','HSE-related cost profile.',1,1),
 ('Production Loss Cost','SUM(incident production loss)','Finance','Monthly',0,'currency','Production interruption cost.',1,1),
 ('Risk Exposure Index','SUM(probability * severity)','Risk','Monthly',0,'index','Current risk heat-map exposure.',1,1),
 ('Management Review Action Rate','closed management actions / total * 100','Executive','Quarterly',95,'percent','Management review follow-through.',1,1);

