'use strict';

require('dotenv').config();

const { sequelize } = require('../src/database/connection');
const {
  User, Department, Hazard, Attachment,
} = require('../src/database/models');
const userRepository = require('../src/repositories/user.repository');
const attachmentService = require('../src/modules/actions/attachment.service');
const { generateTokenPair } = require('../src/shared/utils/tokenGenerator');
const HazardStatus = require('../src/shared/enums/HazardStatus');

const API_BASE = process.env.RBAC_VERIFY_API_URL || 'http://127.0.0.1:5000/api/v1';
const TEST_EMAILS = {
  adm: 'test.adm.manager@cbl.com',
  esd: 'test.esd.manager@cbl.com',
  prd: 'test.prd.manager@cbl.com',
  hse: 'test.hse.manager@cbl.com',
};

const expectStatus = (actual, expected, label) => {
  if (actual !== expected) throw new Error(`${label}: expected HTTP ${expected}, received ${actual}`);
};

const request = async (path, { token, method = 'GET', body, headers = {} } = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  return { status: response.status, payload };
};

const accessTokenFor = async (email) => {
  const user = await userRepository.findByIdWithRole((await User.findOne({ where: { email } })).id);
  return generateTokenPair(user).accessToken;
};

const main = async () => {
  const results = [];
  let hazard = null;
  const createdHazards = [];
  try {
    const health = await fetch('http://127.0.0.1:5000/api/health');
    expectStatus(health.status, 200, 'Backend health check');

    const users = Object.fromEntries(await Promise.all(Object.entries(TEST_EMAILS).map(async ([key, email]) => {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error(`Application test user is missing: ${email}`);
      return [key, user];
    })));
    const tokens = Object.fromEntries(await Promise.all(Object.entries(TEST_EMAILS).map(async ([key, email]) => [key, await accessTokenFor(email)])));
    const esdDepartment = await Department.findOne({ where: { name: 'ESD', isActive: true } });
    if (!esdDepartment) throw new Error('Active ESD department is missing');

    hazard = await Hazard.create({
      reportedBy: users.esd.id,
      plantId: esdDepartment.plantId,
      departmentId: esdDepartment.id,
      responsibleDepartmentId: esdDepartment.id,
      category: 'physical',
      severityLevel: 'medium',
      title: 'RBAC closure verification hazard',
      description: 'Temporary integration record used to verify department and HSE closure authorization.',
      status: HazardStatus.SUBMITTED,
      reportedAt: new Date(),
      createdBy: users.esd.id,
      metadata: {
        responsible_department_id: esdDepartment.id,
        responsible_department: 'ESD',
        integration_test: 'hazard_closure_rbac',
      },
    });
    createdHazards.push(hazard);

    let response = await request('/hazards?limit=1');
    expectStatus(response.status, 401, 'No token');
    results.push({ test: 'no token', status: response.status });

    response = await request('/hazards?limit=1', { token: 'invalid.token.value' });
    expectStatus(response.status, 401, 'Invalid token');
    results.push({ test: 'invalid token', status: response.status });

    response = await request('/hazards?limit=1', { headers: { 'X-Preview-Auth': 'true' } });
    expectStatus(response.status, 401, 'Disabled preview bypass');
    results.push({ test: 'preview header with bypass disabled', status: response.status });

    response = await request(`/hazards/${hazard.id}/closure-submission`, { token: tokens.prd, method: 'POST', body: { remarks: 'Wrong department' } });
    expectStatus(response.status, 403, 'PRD manager on ESD hazard');
    results.push({ test: 'valid role, wrong department', actor: 'PRD Manager', status: response.status });

    response = await request(`/hazards/${hazard.id}/closure-submission`, { token: tokens.adm, method: 'POST', body: { remarks: 'Wrong department' } });
    expectStatus(response.status, 403, 'ADM manager on ESD hazard');
    results.push({ test: 'valid role, wrong department', actor: 'ADM Manager', status: response.status });

    response = await request(`/hazards/${hazard.id}/status`, { token: tokens.esd, method: 'PATCH', body: { status: 'closed' } });
    expectStatus(response.status, 403, 'Department manager generic close bypass');
    results.push({ test: 'department manager generic status bypass', status: response.status });

    response = await request(`/hazards/${hazard.id}/closure-submission`, { token: tokens.esd, method: 'POST', body: { remarks: 'No proof' } });
    expectStatus(response.status, 400, 'Closure without proof');
    results.push({ test: 'correct department without proof', status: response.status });

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8aUAAAAASUVORK5CYII=', 'base64');
    const wrongDepartmentForm = new FormData();
    wrongDepartmentForm.append('file', new Blob([png], { type: 'image/png' }), 'wrong-department-proof.png');
    wrongDepartmentForm.append('sourceType', 'hazard');
    wrongDepartmentForm.append('sourceId', hazard.id);
    wrongDepartmentForm.append('attachmentType', 'CLOSING_PROOF_PHOTO');
    response = await request('/attachments', { token: tokens.prd, method: 'POST', body: wrongDepartmentForm });
    expectStatus(response.status, 403, 'Wrong department proof upload');
    results.push({ test: 'wrong department closing proof upload', status: response.status });

    const proofForm = new FormData();
    proofForm.append('file', new Blob([png], { type: 'image/png' }), 'esd-closing-proof.png');
    proofForm.append('sourceType', 'hazard');
    proofForm.append('sourceId', hazard.id);
    proofForm.append('attachmentType', 'CLOSING_PROOF_PHOTO');
    response = await request('/attachments', { token: tokens.esd, method: 'POST', body: proofForm });
    expectStatus(response.status, 201, 'ESD proof upload');
    results.push({ test: 'correct department proof upload', status: response.status });

    response = await request(`/hazards/${hazard.id}/closure-submission`, { token: tokens.esd, method: 'POST', body: { remarks: 'Corrective work completed and proof attached.' } });
    expectStatus(response.status, 200, 'ESD closure submission');
    if (response.payload?.data?.status !== HazardStatus.UNDER_REVIEW) throw new Error('Department submission closed the hazard instead of moving it to under_review');
    results.push({ test: 'correct role and department submit', status: response.status, hazardStatus: response.payload.data.status });

    response = await request(`/hazards/${hazard.id}/closure-submission`, { token: tokens.esd, method: 'POST', body: { remarks: 'Duplicate submission' } });
    expectStatus(response.status, 409, 'Duplicate closure submission');
    results.push({ test: 'same hazard resubmission', status: response.status });

    response = await request('/hazards?status=under_review&limit=100', { token: tokens.hse });
    expectStatus(response.status, 200, 'HSE review queue');
    const queueRecords = response.payload?.records || response.payload?.data || [];
    if (!queueRecords.some((record) => record.id === hazard.id)) throw new Error('Submitted ESD hazard was not visible in HSE review query');
    results.push({ test: 'HSE review queue contains submitted hazard', status: response.status });

    response = await request(`/hazards/${hazard.id}/hse-review`, { token: tokens.esd, method: 'POST', body: { decision: 'approved', remarks: 'Unauthorized approval' } });
    expectStatus(response.status, 403, 'ESD manager HSE approval');
    results.push({ test: 'department manager final approval', status: response.status });

    response = await request(`/hazards/${hazard.id}/hse-review`, { token: tokens.hse, method: 'POST', body: { decision: 'approved', remarks: 'Closure proof verified.' } });
    expectStatus(response.status, 200, 'HSE manager approval');
    if (response.payload?.data?.status !== HazardStatus.CLOSED) throw new Error('HSE approval did not set the hazard to closed');
    results.push({ test: 'HSE manager final approval', status: response.status, hazardStatus: response.payload.data.status });

    const persisted = await Hazard.findByPk(hazard.id);
    if (persisted.closedBy !== users.hse.id || !persisted.closedAt) throw new Error('HSE closure audit fields were not persisted');
    if (persisted.metadata?.closure_submission?.submitted_by !== users.esd.id) throw new Error('Department submission audit identity was not persisted');
    if (persisted.metadata?.hse_review?.reviewed_by !== users.hse.id) throw new Error('HSE review audit identity was not persisted');
    results.push({
      test: 'audit identities persisted',
      closureSubmittedBy: persisted.metadata.closure_submission.submitted_by,
      reviewedBy: persisted.metadata.hse_review.reviewed_by,
      closedBy: persisted.closedBy,
    });

    const returnedHazard = await Hazard.create({
      reportedBy: users.esd.id,
      plantId: esdDepartment.plantId,
      departmentId: esdDepartment.id,
      responsibleDepartmentId: esdDepartment.id,
      category: 'physical',
      severityLevel: 'medium',
      title: 'RBAC return-path verification hazard',
      description: 'Temporary integration record used to verify HSE return-to-department behavior.',
      status: HazardStatus.SUBMITTED,
      reportedAt: new Date(),
      createdBy: users.esd.id,
      metadata: {
        responsible_department_id: esdDepartment.id,
        responsible_department: 'ESD',
        integration_test: 'hazard_closure_rbac_return',
      },
    });
    createdHazards.push(returnedHazard);

    const returnedProofForm = new FormData();
    returnedProofForm.append('file', new Blob([png], { type: 'image/png' }), 'esd-return-proof.png');
    returnedProofForm.append('sourceType', 'hazard');
    returnedProofForm.append('sourceId', returnedHazard.id);
    returnedProofForm.append('attachmentType', 'CLOSING_PROOF_PHOTO');
    response = await request('/attachments', { token: tokens.esd, method: 'POST', body: returnedProofForm });
    expectStatus(response.status, 201, 'Return-path proof upload');

    response = await request(`/hazards/${returnedHazard.id}/closure-submission`, { token: tokens.esd, method: 'POST', body: { remarks: 'Submit for return-path test.' } });
    expectStatus(response.status, 200, 'Return-path closure submission');
    response = await request(`/hazards/${returnedHazard.id}/hse-review`, { token: tokens.hse, method: 'POST', body: { decision: 'rejected', remarks: 'More evidence required.', reason: 'Proof is incomplete.' } });
    expectStatus(response.status, 200, 'HSE return to department');
    if (response.payload?.data?.status !== HazardStatus.SUBMITTED) throw new Error('Rejected closure did not return to submitted state');
    if (response.payload?.data?.closedAt || response.payload?.data?.closedBy) throw new Error('Rejected closure retained final closure audit fields');
    results.push({ test: 'HSE manager return to department', status: response.status, hazardStatus: response.payload.data.status });

    process.stdout.write(`${JSON.stringify({ verified: true, results }, null, 2)}\n`);
  } finally {
    for (const createdHazard of createdHazards) {
      const attachments = await Attachment.findAll({ where: { sourceType: 'hazard', sourceId: createdHazard.id } });
      for (const attachment of attachments) await attachmentService.deleteAttachment(attachment.id);
      await Hazard.destroy({ where: { id: createdHazard.id }, force: true });
    }
    await sequelize.close();
  }
};

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
