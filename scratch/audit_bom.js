const fs = require('fs');
const path = require('path');

function checkBOM(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        checkBOM(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.md')) {
      const buffer = fs.readFileSync(fullPath);
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        console.log(`[BOM] ${fullPath}`);
      }
    }
  });
}

console.log('Checking for UTF-8 BOM...');
checkBOM(process.cwd());
console.log('Check complete.');
