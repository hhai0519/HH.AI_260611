const fs = require('fs');
const file = 'skills/03_Execution/line-bot-zero-delay/line-bot-project/bridge.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/async function checkRateLimit\(agentId\) \{\s*if \(\!useRedis\) return;/g, 'async function checkRateLimit(agentId) {\n  if (!useRedis) return;\n  if (String(agentId).startsWith(\\'Umock_\\')) return; // [SOP_14] Bypass rate limit for stress testers');
fs.writeFileSync(file, content);
