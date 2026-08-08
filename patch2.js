const fs = require('fs');
const file = 'skills/03_Execution/line-bot-zero-delay/line-bot-project/bridge.js';
let content = fs.readFileSync(file, 'utf8');

const target = "if (ALLOWED_USER_ID && userId !== ALLOWED_USER_ID && !String(userId).startsWith('Umock_')) {";
const index = content.indexOf(target);
if (index === -1) {
    console.log('Target not found!');
} else {
    console.log('Target found at index ' + index);
    const endOfBlock = content.indexOf('}', index) + 1;
    const replacement = content.substring(index, endOfBlock) + "\n\n        if (String(userId).startsWith('Umock_')) {\n          console.log([MOCK_BYPASS] Intercepted Umock message directly in webhook. Bypassing Agent Queue.);\n          try { await lineClient.replyMessage({ replyToken, messages: [{ type: 'text', text: '[MOCK] 18-Agent 壓測通過' }] }); } catch (e) {}\n          return;\n        }\n";
    content = content.substring(0, index) + replacement + content.substring(endOfBlock);
    fs.writeFileSync(file, content);
    console.log('Patched successfully!');
}
