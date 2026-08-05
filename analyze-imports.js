const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'backend', 'src'));
let errors = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match require('...') or require("...")
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = requireRegex.exec(content)) !== null) {
    let modulePath = match[1];
    
    // Skip built-in modules or node_modules
    if (!modulePath.startsWith('.')) continue;

    const fileDir = path.dirname(file);
    try {
      // Create a custom resolve module to safely check existence without throwing on missing env vars inside the required file
      let resolvedPath = require.resolve(path.resolve(fileDir, modulePath));
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
         errors.push({ 
           file: file.replace(__dirname, ''), 
           brokenImport: modulePath 
         });
      }
    }
  }
});

if (errors.length === 0) {
  console.log("No broken relative imports found! 🎉");
} else {
  console.log("Found " + errors.length + " broken imports:");
  console.log(JSON.stringify(errors, null, 2));
}
