const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'api', 'v1', 'controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.controller.js') && (f !== 'auth.controller.js' && f !== 'user.controller.js' && f !== 'role.controller.js' && f !== 'notification.controller.js'));

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix path to services
  content = content.replace(/\.\.\/\.\.\/services\//g, '../../../services/');
  
  // Fix path to utils
  content = content.replace(/\.\.\/\.\.\/utils/g, '../../../utils');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
}

console.log('All controller files have been fixed successfully!');
