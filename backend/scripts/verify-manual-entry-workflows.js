require('dotenv').config();

const assert = require('assert');
const {
  User,
  Plant,
  Department,
  TrainingSession,
  HseAudit,
  AuditFinding,
  CorrectiveAction,
  Attachment,
} = require('../src/database/models');
const userRepository = require('../src/repositories/user.repository');
const attachmentService = require('../src/modules/actions/attachment.service');
const { generateTokenPair } = require('../src/shared/utils/tokenGenerator');
const { sequelize } = require('../src/database/connection');

const API_BASE = process.env.WORKFLOW_VERIFY_API_URL || 'http://127.0.0.1:5000/api/v1';
const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8aUAAAAASUVORK5CYII=', 'base64');

const request = async (path, token, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
};

const uploadTrainingProof = async (trainingId, token) => {
  const form = new FormData();
  form.append('file', new Blob([onePixelPng], { type: 'image/png' }), 'attendance-proof.png');
  form.append('sourceType', 'training');
  form.append('sourceId', trainingId);
  form.append('attachmentType', 'ATTENDANCE_PROOF');
  return fetch(`${API_BASE}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
};

const main = async () => {
  let trainingId;
  let completedTrainingId;
  let futureTrainingId;
  let auditId;
  try {
    const userRow = await User.findOne({ where: { email: 'superadmin@cblapp.com' } }) || await User.findOne();
    const user = userRow && await userRepository.findByIdWithRole(userRow.id);
    const plant = await Plant.findOne();
    const department = await Department.findOne({ where: { isActive: true } });
    assert(user && plant && department, 'Administrator, Plant, and active Department data are required.');
    const token = generateTokenPair(user).accessToken;

    let response = await request('/trainings', token, {
      method: 'POST',
      body: JSON.stringify({
        plantId: plant.id,
        departmentId: null,
        status: 'draft',
        title: '',
      }),
    });
    assert.strictEqual(response.status, 201, `Training draft creation failed: ${JSON.stringify(response.body)}`);
    trainingId = response.body.data.id;

    response = await request(`/trainings/${trainingId}`, token);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.data.departmentId, null, 'New Training draft silently selected a Department.');

    response = await request(`/trainings/${trainingId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ departmentId: department.id }),
    });
    assert.strictEqual(response.status, 200, 'Training Department selection could not be saved.');
    response = await request(`/trainings/${trainingId}`, token);
    assert.strictEqual(response.body.data.departmentId, department.id, 'Training edit did not reload the selected Department.');

    response = await request(`/trainings/${trainingId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ departmentId: null }),
    });
    assert.strictEqual(response.status, 200, 'Training Department could not be cleared.');
    response = await request(`/trainings/${trainingId}`, token);
    assert.strictEqual(response.body.data.departmentId, null, 'Cleared Training Department did not persist.');

    const today = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date();
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);
    const trainingPayload = {
      plantId: plant.id,
      departmentId: department.id,
      title: 'Date and attendance-proof verification',
      trainingType: 'other',
      scheduledDate: today,
      trainerName: 'Verification Trainer',
      participantCount: 2,
      maxAttendees: 2,
      durationMinutes: 30,
      venue: 'Verification Room',
      status: 'scheduled',
    };
    response = await request('/trainings', token, {
      method: 'POST',
      body: JSON.stringify(trainingPayload),
    });
    assert.strictEqual(response.status, 201, `Current-date Training creation failed: ${JSON.stringify(response.body)}`);
    completedTrainingId = response.body.data.id;
    assert.strictEqual(response.body.data.status, 'completed', 'A current-date Training was not classified as completed.');

    const proofUpload = await uploadTrainingProof(completedTrainingId, token);
    assert.strictEqual(proofUpload.status, 201, `Training attendance proof upload failed: ${await proofUpload.text()}`);
    response = await request(`/attachments/source/training/${completedTrainingId}`, token);
    assert.strictEqual(response.status, 200, 'Training attendance proof could not be reloaded.');
    assert.strictEqual(response.body.data.length, 1, 'Training attendance proof did not persist exactly once.');
    assert.strictEqual(response.body.data[0].attachmentType, 'ATTENDANCE_PROOF');
    const proofFile = await fetch(`${API_BASE}/attachments/${response.body.data[0].id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(proofFile.status, 200, 'Persisted Training attendance-proof image could not be downloaded.');
    assert.strictEqual(proofFile.headers.get('content-type'), 'image/png');

    response = await request('/trainings', token, {
      method: 'POST',
      body: JSON.stringify({ ...trainingPayload, title: 'Future Training verification', scheduledDate: tomorrow }),
    });
    assert.strictEqual(response.status, 201, `Future Training creation failed: ${JSON.stringify(response.body)}`);
    futureTrainingId = response.body.data.id;
    assert.strictEqual(response.body.data.status, 'scheduled', 'A future Training was not classified as scheduled.');

    response = await request('/audits', token, {
      method: 'POST',
      body: JSON.stringify({
        plantId: plant.id,
        departmentId: department.id,
        source: 'manual',
        title: 'Deployment verification manual audit',
        auditType: 'internal',
        scheduledDate: new Date().toISOString().slice(0, 10),
        status: 'planned',
        areaOwner: 'Verification area',
        auditObjective: 'Verify manual Audit Log persistence and CAPA synchronization.',
        findings: [{
          standardReference: 'VERIFY-1',
          description: 'Temporary verification finding',
          standardLimitRequirement: 'Verification only',
          score: 3,
          severityLevel: 'low',
          recommendation: 'Initial temporary verification action',
          targetDate: new Date().toISOString().slice(0, 10),
          responsibility: 'Verification owner',
          responsibleDepartmentId: department.id,
          status: 'open',
        }],
      }),
    });
    assert.strictEqual(response.status, 201, `Manual Audit creation failed: ${JSON.stringify(response.body)}`);
    auditId = response.body.data.id;

    response = await request('/audits?page=1&limit=25&sortBy=createdAt&sortOrder=desc', token);
    assert.strictEqual(response.status, 200, 'Audit Log register could not be reloaded after create.');
    assert(response.body.data.some((entry) => entry.id === auditId), 'The newly saved Audit was not visible on the first register page.');

    response = await request(`/audits/${auditId}`, token);
    assert.strictEqual(response.status, 200, 'Manual Audit could not be reopened.');
    assert.strictEqual(response.body.data.source, 'manual');
    assert.strictEqual(response.body.data.criticalAuditPlanId, null);
    assert.strictEqual(response.body.data.overallCompliance, 75);
    const finding = response.body.data.findings[0];
    assert(finding?.id, 'Manual Audit finding was not persisted.');
    assert.strictEqual(await CorrectiveAction.count({ where: { sourceType: 'audit', sourceId: auditId } }), 1, 'Manual Audit action was not synchronized to CAPA.');

    response = await request(`/audits/${auditId}`, token, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Deployment verification manual audit updated',
        findings: [{
          id: finding.id,
          standardReference: finding.standardReference,
          description: finding.description,
          standardLimitRequirement: finding.standardLimitRequirement,
          score: 4,
          severityLevel: finding.severityLevel,
          recommendation: 'Updated temporary verification action',
          targetDate: finding.targetDate,
          responsibility: finding.responsibility,
          responsibleDepartmentId: finding.responsibleDepartmentId,
          status: finding.status,
        }],
      }),
    });
    assert.strictEqual(response.status, 200, 'Manual Audit edit failed.');
    assert.strictEqual(response.body.data.title, 'Deployment verification manual audit updated');
    assert.strictEqual(response.body.data.overallCompliance, 100);
    const linkedActions = await CorrectiveAction.findAll({ where: { sourceType: 'audit', sourceId: auditId } });
    assert.strictEqual(linkedActions.length, 1, 'Manual Audit edit duplicated its CAPA action.');
    assert.strictEqual(linkedActions[0].description, 'Updated temporary verification action');

    response = await request(`/audits/${auditId}`, token, { method: 'DELETE' });
    assert.strictEqual(response.status, 200, 'Manual Audit deletion failed.');
    assert.strictEqual(await CorrectiveAction.count({ where: { sourceType: 'audit', sourceId: auditId } }), 0, 'Deleted Manual Audit left an active CAPA action.');

    process.stdout.write(`${JSON.stringify({
      verified: true,
      training: {
        newDepartment: null,
        selectedDepartmentPersisted: department.id,
        clearedDepartmentPersisted: null,
        currentDateStatus: 'completed',
        futureDateStatus: 'scheduled',
        attendanceProofsAfterReload: 1,
      },
      manualAudit: {
        source: 'manual',
        view: 200,
        edit: 200,
        complianceBefore: 75,
        complianceAfter: 100,
        capaActionsAfterCreate: 1,
        capaActionsAfterEdit: linkedActions.length,
        capaActionsAfterDelete: 0,
        visibleOnFirstRegisterPage: true,
      },
    }, null, 2)}\n`);
  } finally {
    if (trainingId) await TrainingSession.destroy({ where: { id: trainingId }, force: true });
    await Promise.all([completedTrainingId, futureTrainingId].filter(Boolean).map(async (id) => {
      const attachments = await Attachment.findAll({
        where: { sourceType: 'training', sourceId: id },
      });
      await Promise.all(attachments.map(
        (attachment) => attachmentService.deleteAttachment(attachment.id),
      ));
      await TrainingSession.destroy({ where: { id }, force: true });
    }));
    if (auditId) {
      await CorrectiveAction.destroy({ where: { sourceType: 'audit', sourceId: auditId }, force: true });
      await AuditFinding.destroy({ where: { auditId }, force: true });
      await HseAudit.destroy({ where: { id: auditId }, force: true });
    }
    await sequelize.close();
  }
};

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
