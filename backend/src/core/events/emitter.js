'use strict';

const EventEmitter = require('events');

const EVENTS = Object.freeze({
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
  NOTIFICATION_CREATED: 'notification.created',
  HAZARD_CREATED: 'hazard.created',
  HAZARD_CLOSED: 'hazard.closed',
  INCIDENT_CREATED: 'incident.created',
  TRAINING_COMPLETED: 'training.completed',
  AUDIT_COMPLETED: 'audit.completed',
  DOCUMENT_APPROVED: 'document.approved',
  DASHBOARD_UPDATED: 'dashboard.updated',
  ASSIGNMENT_CREATED: 'assignment.created',
  APPROVAL_REQUESTED: 'approval.requested',
});

// Singleton EventEmitter
const emitter = new EventEmitter();
emitter.setMaxListeners(20);

// ─── Register Handlers ────────────────────────────────────────────────────────
const sendWelcomeEmailHandler = require('./handlers/sendWelcomeEmail.handler');
const sendPasswordResetHandler = require('./handlers/sendPasswordReset.handler');
const auditLogHandler = require('./handlers/auditLog.handler');

emitter.on(EVENTS.USER_REGISTERED, sendWelcomeEmailHandler);
emitter.on(EVENTS.PASSWORD_RESET_REQUESTED, sendPasswordResetHandler);
emitter.on(EVENTS.USER_LOGGED_IN, (data) => auditLogHandler({ action: 'USER_LOGIN', ...data }));

module.exports = { emitter, EVENTS };
