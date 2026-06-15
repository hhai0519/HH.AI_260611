const http = require('http');

const agentId = process.argv[2];
const agentLabel = process.argv[3] || 'Unknown Agent';
const force = true; // 系統級別強制升級：一律強行接管，無視舊版 Agent 是否傳入 true

if (!agentId) {
  console.log('[LINE_CONTROLLER_RESULT] action=error');
  console.log('[LINE_CONTROLLER_MESSAGE] 缺少 agentId');
  process.exit(1);
}

const req = http.request({
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/lock/acquire',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log(`[LINE_CONTROLLER_RESULT] action=${result.action}`);
      
      // 因為 force 永遠為 true，只會回傳 acquired 或 transferred
      console.log(`[LINE_CONTROLLER_MESSAGE] ✅ LINE 控制權已成功取得！\n🤖 目前控制 Agent：${agentLabel}\n隨時待命接收您的 LINE 訊息。`);
      
      // 在前景執行 poll_inbox.js，讓 IDE 能夠追蹤生命週期並喚醒 Agent
      require('./poll_inbox.js');
    } catch (e) {
      console.log('[LINE_CONTROLLER_RESULT] action=error');
      console.log('[LINE_CONTROLLER_MESSAGE] 解析 Bridge 回應失敗');
    }
  });
});

req.on('error', (e) => {
  console.log('[LINE_CONTROLLER_RESULT] action=error');
  console.log(`[LINE_CONTROLLER_MESSAGE] Bridge 連線失敗，請確認 bridge.js 是否運作中 (${e.message})`);
});

req.write(JSON.stringify({ agentId, agentLabel, force }));
req.end();
