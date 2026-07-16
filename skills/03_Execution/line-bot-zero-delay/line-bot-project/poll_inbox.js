const http = require('http');

let agentId = process.argv[2];
let fencingToken = process.env.FENCING_TOKEN || '';

const fs = require('fs');
const path = require('path');
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../../../../');

try {
  const stateFile = path.join(WORKSPACE_ROOT, '.state', 'agent_state.json');
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (!agentId && state.agentId) agentId = state.agentId;
    if (state.fencingToken) fencingToken = state.fencingToken;
  }
} catch (e) {
  // ignore
}

if (!agentId) {
  console.error("Usage: node poll_inbox.js [agentId]\n(Or ensure .agent_state.json exists)");
  process.exit(1);
}

const POLL_INTERVAL = 1000; // 1 秒
const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 1 });

console.log("Antigravity API Polling 監聽器已啟動，等待事件中...");

function poll() {
  const targetPath = `/api/inbox?token=${encodeURIComponent(agentId)}&fencingToken=${encodeURIComponent(fencingToken)}`;
  console.log(`[DEBUG] Polling target path: ${targetPath}`);

  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: targetPath,
    method: 'GET',
    agent: keepAliveAgent
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 403) {
        console.log("\n[AGENT_TRANSFER] ⚠️ LINE 控制權已被其他 Agent 接管！此監聽器已自動停止。");
        process.exit(0);
      }
      
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(data);
          if (json.message) {
            const msg = json.message;
            // 輸出給 Agent 看
            console.log(`[LINE_REQUEST] ${msg.userId} : ${msg.text}`);
            console.log("[SYSTEM] 偵測到新訊息，即將自我結束以觸發系統喚醒...");
            process.exit(0); // 喚醒 Agent
          }
        } catch (e) {
          // JSON 解析錯誤，忽略
        }
      }
      
      // 繼續 poll
      setTimeout(poll, POLL_INTERVAL);
    });
  });

  req.on('error', (e) => {
    // 若 bridge 沒啟動，等待後重試
    setTimeout(poll, 3000);
  });

  req.end();
}

poll();
