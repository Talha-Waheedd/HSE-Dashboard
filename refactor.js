const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\CBL Project';
const backendDir = path.join(rootDir, 'backend');
const srcDir = path.join(backendDir, 'src');

// Define feature module mappings
const modules = {
  auth: ['auth'],
  users: ['user', 'role', 'permission', 'token'],
  'hse-foundation': ['plant', 'department', 'employee'],
  hazards: ['hazard'],
  incidents: ['incident', 'incident-injury', 'near-miss'],
  training: ['training-session', 'training-attendee'],
  audits: ['audit', 'audit-finding', 'inspection', 'inspection-item'],
  actions: ['corrective-action', 'attachment'],
  core: ['audit-log', 'notification']
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function moveItem(src, dest) {
  if (fs.existsSync(src)) {
    try {
      ensureDir(path.dirname(dest));
      fs.renameSync(src, dest);
      console.log(`Moved: ${src} -> ${dest}`);
    } catch (e) {
      console.error(`Failed to move ${src}:`, e.message);
    }
  }
}

console.log('Starting structural reorganization...');

// 1. Create backend structure
ensureDir(backendDir);
['core/middleware', 'core/events', 'core/cron', 'core/sockets', 
 'shared/utils', 'shared/helpers', 'shared/constants', 'shared/enums',
 'database/config', 'database/migrations', 'database/seeders', 'modules'].forEach(d => ensureDir(path.join(srcDir, d)));

Object.keys(modules).forEach(mod => ensureDir(path.join(srcDir, 'modules', mod)));

// 2. Move root backend files and directories to backend/
const rootItems = [
  'package.json', 'package-lock.json', 'server.js', 'nodemon.json', 
  '.env', '.env.example', '.eslintrc.js', '.prettierrc', 'jest.config.js',
  '.sequelizerc', 'tests', 'logs', 'uploads', 'storage', 'templates', 'cache', 'scripts',
  'app.js'
];

rootItems.forEach(item => {
  moveItem(path.join(rootDir, item), path.join(backendDir, item));
});

// 3. Move src/ to backend/src/
const oldSrcDir = path.join(rootDir, 'src');
if (fs.existsSync(oldSrcDir)) {
  const srcContents = fs.readdirSync(oldSrcDir);
  srcContents.forEach(item => {
    const oldPath = path.join(oldSrcDir, item);
    const newPath = path.join(srcDir, item);
    if (!fs.existsSync(newPath)) {
      moveItem(oldPath, newPath);
    } else if (fs.statSync(oldPath).isDirectory()) {
      const subItems = fs.readdirSync(oldPath);
      subItems.forEach(sub => {
        moveItem(path.join(oldPath, sub), path.join(newPath, sub));
      });
    }
  });
}

// 4. Relocate to Feature Modules
function getModuleForName(name) {
  for (const [mod, prefixes] of Object.entries(modules)) {
    if (prefixes.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
      return mod;
    }
  }
  return 'core';
}

const findFiles = (dir, ext) => {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push(fullPath);
    }
  });
  return results;
};

// Models
const modelsDir = path.join(srcDir, 'models');
if (fs.existsSync(modelsDir)) {
  const models = fs.readdirSync(modelsDir).filter(f => f.endsWith('.model.js'));
  models.forEach(model => {
    const mod = getModuleForName(model);
    moveItem(path.join(modelsDir, model), path.join(srcDir, 'modules', mod, model));
  });
  moveItem(path.join(modelsDir, 'index.js'), path.join(srcDir, 'database', 'models.js'));
}

// Controllers
const controllersDir = path.join(srcDir, 'api', 'v1', 'controllers');
if (fs.existsSync(controllersDir)) {
  const controllers = findFiles(controllersDir, '.js');
  controllers.forEach(controller => {
    const mod = getModuleForName(path.basename(controller));
    moveItem(controller, path.join(srcDir, 'modules', mod, path.basename(controller)));
  });
}

// Routes
const routesDir = path.join(srcDir, 'api', 'v1', 'routes');
if (fs.existsSync(routesDir)) {
  const routes = findFiles(routesDir, '.js');
  routes.forEach(route => {
    const mod = getModuleForName(path.basename(route));
    moveItem(route, path.join(srcDir, 'modules', mod, path.basename(route)));
  });
}

// Services
const servicesDir = path.join(srcDir, 'services');
if (fs.existsSync(servicesDir)) {
  const services = findFiles(servicesDir, '.js');
  services.forEach(service => {
    const mod = getModuleForName(path.basename(service));
    moveItem(service, path.join(srcDir, 'modules', mod, path.basename(service)));
  });
}

// Schemas
const schemasDir = path.join(srcDir, 'api', 'v1', 'schemas');
if (fs.existsSync(schemasDir)) {
  const schemas = findFiles(schemasDir, '.js');
  schemas.forEach(schema => {
    const mod = getModuleForName(path.basename(schema));
    moveItem(schema, path.join(srcDir, 'modules', mod, path.basename(schema)));
  });
}

console.log('Reorganization script completed.');
