const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'backend', 'src');

// 1. Build a map of filename -> absolute path
const fileMap = {};

function buildFileMap(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      buildFileMap(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      fileMap[file] = fullPath;
    }
  });
}

buildFileMap(srcDir);

// Special mapping for index.js files which might be ambiguous
// We manually add them if needed, but usually imports specify the folder
fileMap['models.js'] = path.join(srcDir, 'database', 'models.js');

// 2. Iterate through all JS files and replace requires
function rewriteImports(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      rewriteImports(fullPath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Regex to find require statements
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
      let match;
      let newContent = content;

      while ((match = requireRegex.exec(content)) !== null) {
        let importPath = match[1];
        
        // Skip node_modules or built-ins
        if (!importPath.startsWith('.')) continue;

        // Try to figure out what file it was pointing to
        // Commonly: '../../models/user.model', '../services/auth.service', '../../utils/logger'
        let baseName = path.basename(importPath);
        
        // If it lacks extension, assume .js
        let searchName = baseName;
        if (!searchName.endsWith('.js') && !searchName.endsWith('.json')) {
          searchName += '.js';
        }

        // If it was pointing to a folder index, e.g., '../models', the baseName is 'models'
        // In our new structure, 'models' became 'models.js' inside 'database'.
        if (baseName === 'models') {
          searchName = 'models.js';
        } else if (baseName === 'utils' || baseName === 'helpers' || baseName === 'middleware') {
          // If it was pointing to a folder index
          searchName = 'index.js';
          // Actually, this is tricky. Let's just find the file if we can.
        }

        const targetAbsPath = fileMap[searchName];
        
        if (targetAbsPath) {
          // Compute new relative path
          let newRelPath = path.relative(path.dirname(fullPath), targetAbsPath);
          // Normalize to posix for require
          newRelPath = newRelPath.split(path.sep).join('/');
          if (!newRelPath.startsWith('.')) {
            newRelPath = './' + newRelPath;
          }
          
          // Remove .js extension for cleaner imports
          if (newRelPath.endsWith('.js')) {
            newRelPath = newRelPath.slice(0, -3);
          }

          if (newRelPath !== importPath) {
            newContent = newContent.replace(`require('${match[1]}')`, `require('${newRelPath}')`);
            newContent = newContent.replace(`require("${match[1]}")`, `require('${newRelPath}')`);
            changed = true;
          }
        } else {
          // If not found in map, maybe it's requiring a folder index like '../middleware'
          // We can try to see if there's an index.js in that folder
          // Let's log it for manual review
          console.log(`Could not resolve import: ${importPath} in ${fullPath}`);
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated imports in: ${fullPath.replace(srcDir, '')}`);
      }
    }
  });
}

rewriteImports(srcDir);

// 3. Fix app.js and server.js manually as they are special
let serverJs = path.join(__dirname, 'backend', 'server.js');
if (fs.existsSync(serverJs)) {
  let sContent = fs.readFileSync(serverJs, 'utf8');
  sContent = sContent.replace(/'\.\/src\/app'/g, "'./src/app'");
  fs.writeFileSync(serverJs, sContent, 'utf8');
}
