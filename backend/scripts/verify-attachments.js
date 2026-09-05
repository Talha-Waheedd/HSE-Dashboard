require('dotenv').config();

const assert = require('assert');
const {
  User, Plant, Department, Incident, Attachment,
} = require('../src/database/models');
const userRepository = require('../src/repositories/user.repository');
const attachmentService = require('../src/modules/actions/attachment.service');
const { generateTokenPair } = require('../src/shared/utils/tokenGenerator');
const { sequelize } = require('../src/database/connection');

const API_BASE = process.env.ATTACHMENT_VERIFY_API_URL || 'http://127.0.0.1:5000/api/v1';
const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8aUAAAAASUVORK5CYII=', 'base64');

const upload = async (incidentId, token, contents, filename, mimeType) => {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: mimeType }), filename);
  form.append('sourceType', 'incident');
  form.append('sourceId', incidentId);
  form.append('attachmentType', 'EVIDENCE_PHOTO');
  return fetch(`${API_BASE}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
};

const main = async () => {
  let incident;
  try {
    const userRow = await User.findOne();
    const user = userRow && await userRepository.findByIdWithRole(userRow.id);
    const plant = await Plant.findOne();
    const department = await Department.findOne({ where: { isActive: true } });
    assert(user && plant && department, 'User, plant, and active Department seed data are required.');
    const token = generateTokenPair(user).accessToken;

    incident = await Incident.create({
      reportedBy: user.id,
      plantId: plant.id,
      departmentId: department.id,
      incidentType: 'first_aid',
      status: 'reported',
      severityLevel: 'low',
      title: 'Attachment deployment verification',
      description: 'Temporary integration record; always removed.',
      incidentDate: new Date().toISOString().slice(0, 10),
      createdBy: user.id,
    });

    const accepted = [];
    // The uploads must be sequential so the fifth-file limit is tested after
    // four committed attachment rows, rather than racing concurrent requests.
    // eslint-disable-next-line no-restricted-syntax
    for (let index = 1; index <= 4; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      const response = await upload(incident.id, token, onePixelPng, `verification-${index}.png`, 'image/png');
      assert.strictEqual(response.status, 201, `Valid image ${index} was not accepted.`);
      accepted.push(response.status);
    }

    const fifth = await upload(incident.id, token, onePixelPng, 'verification-5.png', 'image/png');
    assert.strictEqual(fifth.status, 400, 'A fifth evidence image was not rejected.');
    const fifthBody = await fifth.json();
    assert.match(String(fifthBody.message || ''), /Maximum 4 images/i);

    const invalidType = await upload(incident.id, token, Buffer.from('not an image'), 'verification.txt', 'text/plain');
    assert.strictEqual(invalidType.status, 400, 'An unsupported evidence type was not rejected.');

    const oversized = await upload(incident.id, token, Buffer.alloc((10 * 1024 * 1024) + 1), 'oversized.jpg', 'image/jpeg');
    assert([400, 413].includes(oversized.status), `Oversized evidence returned unexpected HTTP ${oversized.status}.`);

    const list = await fetch(`${API_BASE}/attachments/source/incident/${incident.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(list.status, 200, 'Persisted attachment list could not be reloaded.');
    const listBody = await list.json();
    assert.strictEqual(listBody.data.length, 4, 'Reloaded attachment count is not four.');

    process.stdout.write(`${JSON.stringify({
      verified: true,
      accepted,
      fifth: { status: fifth.status, message: fifthBody.message },
      invalidType: invalidType.status,
      oversized: oversized.status,
      persistedAfterReload: listBody.data.length,
    }, null, 2)}\n`);
  } finally {
    if (incident) {
      const attachments = await Attachment.findAll({ where: { sourceType: 'incident', sourceId: incident.id } });
      await Promise.all(attachments.map(
        (attachment) => attachmentService.deleteAttachment(attachment.id),
      ));
      await Incident.destroy({ where: { id: incident.id }, force: true });
    }
    await sequelize.close();
  }
};

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
