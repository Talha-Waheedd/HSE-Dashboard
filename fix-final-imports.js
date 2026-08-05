const fs = require('fs');
const path = require('path');

const fixes = [
  { file: 'backend/src/app.js', search: './api/v1/routes', replace: './modules/core' },
  { file: 'backend/src/core/events/handlers/sendPasswordReset.handler.js', search: '../../config', replace: '../../../database/config' },
  { file: 'backend/src/core/events/handlers/sendWelcomeEmail.handler.js', search: '../../config', replace: '../../../database/config' },
  { file: 'backend/src/modules/actions/attachment.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/actions/corrective-action.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/audits/hse-audit.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/audits/inspection.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/auth/auth.controller.js', search: '../../../config', replace: '../../database/config' },
  { file: 'backend/src/modules/core/training.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/hazards/hazard.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/hse-foundation/department.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/hse-foundation/employee.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/hse-foundation/plant.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/incidents/incident.service.js', search: '../constants', replace: '../../shared/constants' },
  { file: 'backend/src/modules/incidents/near-miss.service.js', search: '../constants', replace: '../../shared/constants' }
];

fixes.forEach(fix => {
  const fullPath = path.join('d:\\CBL Project', fix.file);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(`require('${fix.search}')`, `require('${fix.replace}')`);
  content = content.replace(`require("${fix.search}")`, `require('${fix.replace}')`);
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', fix.file);
});
