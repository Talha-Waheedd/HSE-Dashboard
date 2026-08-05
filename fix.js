const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'api', 'v1', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f !== 'index.js' && f.endsWith('.routes.js') && (f !== 'auth.routes.js' && f !== 'user.routes.js' && f !== 'role.routes.js' && f !== 'notification.routes.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix paths
  content = content.replace(/\.\.\/\.\.\/middlewares\/validate\.middleware/g, '../../../middleware/validate.middleware');
  content = content.replace(/const { requireAuth, requirePermission } = require\('\.\.\/\.\.\/middlewares\/auth\.middleware'\);/g, 
    "const { authenticate } = require('../../../middleware/auth.middleware');\nconst { requirePermissions } = require('../../../middleware/rbac.middleware');");
  
  // Some files might just have requireAuth
  content = content.replace(/const { requireAuth } = require\('\.\.\/\.\.\/middlewares\/auth\.middleware'\);/g, 
    "const { authenticate } = require('../../../middleware/auth.middleware');");

  content = content.replace(/\.\.\/\.\.\/controllers\//g, '../controllers/');
  content = content.replace(/\.\.\/\.\.\/schemas\//g, '../schemas/');

  // Fix function names
  content = content.replace(/validateRequest/g, 'validate');
  content = content.replace(/requireAuth/g, 'authenticate');

  // Fix requirePermissions syntax: requirePermission(PERMISSIONS.XYZ) -> requirePermissions([PERMISSIONS.XYZ])
  content = content.replace(/requirePermission\((PERMISSIONS\.[A-Z_]+)\)/g, 'requirePermissions([$1])');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
}

console.log('All route files have been fixed successfully!');
