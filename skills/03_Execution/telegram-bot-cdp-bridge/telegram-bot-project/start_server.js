const fs = require('fs');
const path = require('path');
const WORKSPACE_ROOT = (() => {
  let current = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, '.env.local'))) return current;
    current = path.dirname(current);
  }
  return current;
})();
const envPath = path.join(WORKSPACE_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.split('#')[0].trim().match(/^([\w.\-]+)\s*=\s*(.*)/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}
process.env.TG_BRIDGE_PORT = '3001';
process.env.PORT = '3001';
process.env.WORKSPACE_ROOT = WORKSPACE_ROOT;
process.env.NODE_ENV = 'production';
console.log('Starting TG Zero-Delay Bridge directly from start_server.js...');
require('./dist/bin/cli-zero-delay.js');
