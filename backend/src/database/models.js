'use strict';

// ─── Existing Core Models ─────────────────────────────────────────────────────
const User = require('../modules/users/user.model');
const Role = require('../modules/users/role.model');
const Permission = require('../modules/users/permission.model');
const Token = require('../modules/users/token.model');
const AuditLog = require('../modules/audits/audit-log.model');
const Notification = require('../modules/core/notification.model');
const MasterAnalysis = require('../modules/analysis/master-analysis.model');

// ─── HSE Foundation Models ────────────────────────────────────────────────────
const Plant = require('../modules/hse-foundation/plant.model');
const Department = require('../modules/hse-foundation/department.model');
const Employee = require('../modules/hse-foundation/employee.model');
const Location = require('../modules/hse-foundation/location.model');

// ─── HSE Reporting Models ─────────────────────────────────────────────────────
const Hazard = require('../modules/hazards/hazard.model');
const NearMiss = require('../modules/incidents/near-miss.model');
const Incident = require('../modules/incidents/incident.model');
const IncidentInjury = require('../modules/incidents/incident-injury.model');

// ─── HSE Training Models ──────────────────────────────────────────────────────
const TrainingSession = require('../modules/training/training-session.model');
const TrainingAttendee = require('../modules/training/training-attendee.model');

// ─── HSE Audit & Inspection Models ───────────────────────────────────────────
const HseAudit = require('../modules/audits/audit.model');
const AuditFinding = require('../modules/audits/audit-finding.model');
const Inspection = require('../modules/audits/inspection.model');
const InspectionItem = require('../modules/audits/inspection-item.model');

// ─── HSE Action & Attachment Models ──────────────────────────────────────────
const CorrectiveAction = require('../modules/actions/corrective-action.model');
const Attachment = require('../modules/actions/attachment.model');

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Existing (DO NOT MODIFY)
// ═══════════════════════════════════════════════════════════════════════════════

// User ↔ Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Role ↔ Permission (many-to-many)
Role.belongsToMany(Permission, {
  through: 'role_permissions',
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: 'role_permissions',
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

// User → Tokens
User.hasMany(Token, { foreignKey: 'userId', as: 'tokens' });
Token.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → AuditLogs
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — HSE Foundation
// ═══════════════════════════════════════════════════════════════════════════════

// Plant ↔ Department
Plant.hasMany(Department, { foreignKey: 'plantId', as: 'departments' });
Department.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });
Plant.hasMany(Location, { foreignKey: 'plantId', as: 'locations' });
Location.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

// User ↔ Department (manager)
User.hasMany(Department, { foreignKey: 'managerId', as: 'managedDepartments' });
Department.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Employee ↔ User (1:1)
User.hasOne(Employee, { foreignKey: 'userId', as: 'employeeProfile' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Employee ↔ Plant
Plant.hasMany(Employee, { foreignKey: 'plantId', as: 'employees' });
Employee.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

// Employee ↔ Department
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Hazards
// ═══════════════════════════════════════════════════════════════════════════════

User.hasMany(Hazard, { foreignKey: 'reportedBy', as: 'reportedHazards' });
Hazard.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });

Plant.hasMany(Hazard, { foreignKey: 'plantId', as: 'hazards' });
Hazard.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

Department.hasMany(Hazard, { foreignKey: 'departmentId', as: 'hazards' });
Hazard.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasMany(Hazard, { foreignKey: 'assignedTo', as: 'assignedHazards' });
Hazard.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Near Misses
// ═══════════════════════════════════════════════════════════════════════════════

User.hasMany(NearMiss, { foreignKey: 'reportedBy', as: 'reportedNearMisses' });
NearMiss.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });

Plant.hasMany(NearMiss, { foreignKey: 'plantId', as: 'nearMisses' });
NearMiss.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

Department.hasMany(NearMiss, { foreignKey: 'departmentId', as: 'nearMisses' });
NearMiss.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Incidents
// ═══════════════════════════════════════════════════════════════════════════════

User.hasMany(Incident, { foreignKey: 'reportedBy', as: 'reportedIncidents' });
Incident.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });

User.hasMany(Incident, { foreignKey: 'investigatedBy', as: 'investigatedIncidents' });
Incident.belongsTo(User, { foreignKey: 'investigatedBy', as: 'investigatedBy_user' });

Plant.hasMany(Incident, { foreignKey: 'plantId', as: 'incidents' });
Incident.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

Department.hasMany(Incident, { foreignKey: 'departmentId', as: 'incidents' });
Incident.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Incident.hasMany(IncidentInjury, { foreignKey: 'incidentId', as: 'injuries' });
IncidentInjury.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Training
// ═══════════════════════════════════════════════════════════════════════════════

Plant.hasMany(TrainingSession, { foreignKey: 'plantId', as: 'trainingSessions' });
TrainingSession.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

Department.hasMany(TrainingSession, { foreignKey: 'departmentId', as: 'trainingSessions' });
TrainingSession.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasMany(TrainingSession, { foreignKey: 'trainerId', as: 'conductedTrainings' });
TrainingSession.belongsTo(User, { foreignKey: 'trainerId', as: 'trainer' });

TrainingSession.hasMany(TrainingAttendee, { foreignKey: 'sessionId', as: 'attendees' });
TrainingAttendee.belongsTo(TrainingSession, { foreignKey: 'sessionId', as: 'session' });

User.hasMany(TrainingAttendee, { foreignKey: 'userId', as: 'trainingAttendances' });
TrainingAttendee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Audits
// ═══════════════════════════════════════════════════════════════════════════════

Plant.hasMany(HseAudit, { foreignKey: 'plantId', as: 'hseAudits' });
HseAudit.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

Department.hasMany(HseAudit, { foreignKey: 'departmentId', as: 'hseAudits' });
HseAudit.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasMany(HseAudit, { foreignKey: 'auditedBy', as: 'conductedAudits' });
HseAudit.belongsTo(User, { foreignKey: 'auditedBy', as: 'auditor' });

HseAudit.hasMany(AuditFinding, { foreignKey: 'auditId', as: 'findings' });
AuditFinding.belongsTo(HseAudit, { foreignKey: 'auditId', as: 'audit' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Inspections
// ═══════════════════════════════════════════════════════════════════════════════

Plant.hasMany(Inspection, { foreignKey: 'plantId', as: 'inspections' });
Inspection.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

Department.hasMany(Inspection, { foreignKey: 'departmentId', as: 'inspections' });
Inspection.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasMany(Inspection, { foreignKey: 'inspectedBy', as: 'conductedInspections' });
Inspection.belongsTo(User, { foreignKey: 'inspectedBy', as: 'inspector' });

Inspection.hasMany(InspectionItem, { foreignKey: 'inspectionId', as: 'items' });
InspectionItem.belongsTo(Inspection, { foreignKey: 'inspectionId', as: 'inspection' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Corrective Actions (polymorphic — no Sequelize association on sourceId)
// ═══════════════════════════════════════════════════════════════════════════════

Plant.hasMany(CorrectiveAction, { foreignKey: 'plantId', as: 'correctiveActions' });
CorrectiveAction.belongsTo(Plant, { foreignKey: 'plantId', as: 'plant' });

User.hasMany(CorrectiveAction, { foreignKey: 'assignedTo', as: 'assignedCorrectiveActions' });
CorrectiveAction.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

User.hasMany(CorrectiveAction, { foreignKey: 'assignedBy', as: 'createdCorrectiveActions' });
CorrectiveAction.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

// ═══════════════════════════════════════════════════════════════════════════════
// Associations — Attachments (polymorphic — no Sequelize association on sourceId)
// ═══════════════════════════════════════════════════════════════════════════════

User.hasMany(Attachment, { foreignKey: 'uploadedBy', as: 'uploads' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

module.exports = {
  // Core
  User, Role, Permission, Token, AuditLog, Notification,
  // HSE Foundation
  Plant, Department, Employee, Location,
  // HSE Reporting
  Hazard, NearMiss, Incident, IncidentInjury,
  // HSE Training
  TrainingSession, TrainingAttendee,
  // HSE Audits & Inspections
  HseAudit, AuditFinding, Inspection, InspectionItem,
  // HSE Actions & Attachments
  CorrectiveAction, Attachment, MasterAnalysis,
};

