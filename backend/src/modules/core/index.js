'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('../auth/auth.routes');
const userRoutes = require('../users/user.routes');
const roleRoutes = require('../users/role.routes');
const notificationRoutes = require('./notification.routes');

// HSE Routes
const plantRoutes = require('../hse-foundation/plant.routes');
const departmentRoutes = require('../hse-foundation/department.routes');
const employeeRoutes = require('../hse-foundation/employee.routes');
const locationRoutes = require('../hse-foundation/location.routes');
const hazardRoutes = require('../hazards/hazard.routes');
const nearMissRoutes = require('../incidents/near-miss.routes');
const incidentRoutes = require('../incidents/incident.routes');
const trainingRoutes = require('./training.routes');
const auditRoutes = require('../audits/hse-audit.routes');
const inspectionRoutes = require('../audits/inspection.routes');
const correctiveActionRoutes = require('../actions/corrective-action.routes');
const attachmentRoutes = require('../actions/attachment.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/notifications', notificationRoutes);

// HSE Endpoints
router.use('/plants', plantRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/locations', locationRoutes);
router.use('/hazards', hazardRoutes);
router.use('/near-misses', nearMissRoutes);
router.use('/incidents', incidentRoutes);
router.use('/trainings', trainingRoutes);
router.use('/audits', auditRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/corrective-actions', correctiveActionRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
