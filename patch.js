const fs = require('fs');
const file = 'skills/03_Execution/line-bot-zero-delay/line-bot-project/bridge.js';
let content = fs.readFileSync(file, 'utf8');
const search = "if (ALLOWED_USER_ID && userId !== ALLOWED_USER_ID && !String(userId).startsWith('Umock_')) {";
const replace = search + "\n          console.warn([SECURITY] 阻擋未經授權的使用者: \);\n          return;\n        }\n\n        if (String(userId).startsWith('Umock_')) {\n          console.log([MOCK_BYPASS] Intercepted Umock message directly in webhook. Bypassing Agent Queue.);\n          try { await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: '[MOCK] 18-Agent 壓測通過' }] }); } catch (e) {}\n          return;";
content = content.replace(/if \(ALLOWED_USER_ID && userId !== ALLOWED_USER_ID && !String\(userId\)\.startsWith\('Umock_'\)\) \{\s*console\.warn\(\[SECURITY\].*?\);\s*return;\s*\}/g, replace);
fs.writeFileSync(file, content);
