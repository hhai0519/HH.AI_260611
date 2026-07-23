const http = require('http');
const path = require('path');
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../../../../');
require('dotenv').config({ path: require('path').join(WORKSPACE_ROOT, '.env.local') });

// 動態讀取命令列參數，不再寫死
const agentId = process.argv[2] || 'Antigravity';
const agentLabel = process.argv[3] || 'Master_Mode';
const force = process.argv.length >= 5 ? process.argv[4] === 'true' : true;
if (!agentId) {
  console.log('[LINE_CONTROLLER_RESULT] action=error');
  console.log('[LINE_CONTROLLER_MESSAGE] 缺少 agentId');
  process.exit(1);
}

const agentSecret = process.env.CURRENT_AGENT_SECRET;
if (!agentSecret || agentSecret === 'default_agent_secret') {
  console.log('[LINE_CONTROLLER_RESULT] action=error');
  console.log('[LINE_CONTROLLER_MESSAGE] ❌ 安全錯誤：環境變數 CURRENT_AGENT_SECRET 未於 .env.local 正確設定，請先配置後再試！');
  process.exit(1);
}

const dbState = require(path.join(WORKSPACE_ROOT, 'Modules', 'db_state_manager'));
const useDb = !dbState.isPlaceholderDb() && dbState.pool !== null;

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
      // console.log(`[DEBUG] raw data:`, data);
      
      if (result.error) {
        console.log(`[LINE_CONTROLLER_RESULT] action=error`);
        console.log(`[LINE_CONTROLLER_MESSAGE] ❌ 取得控制權失敗: ${result.message}`);
        process.exit(1);
      }
      
      // 因為 force 永遠為 true，只會回傳 acquired 或 transferred
      console.log(`[LINE_CONTROLLER_MESSAGE] ✅ LINE 控制權已成功取得！\n🤖 目前控制 Agent：${agentLabel}\n隨時待命接收您的 LINE 訊息。`);
      
      if (useDb) {
        console.log(`[LINE_CONTROLLER] 💓 資料庫模式：啟動鎖心跳續命機制 (60s TTL)`);
        dbState.startLockHeartbeat('line_bridge_lock', agentId, 60);
      }
      
      if (result.fencingToken) {
        process.env.FENCING_TOKEN = result.fencingToken;
        // 將狀態寫入實體 JSON 檔，供 poll_inbox.js 與 reply.js 讀取 (Zero-Config State Persistence)
        const fs = require('fs');
        try {
          const stateData = JSON.stringify({
            agentId: agentId,
            fencingToken: result.fencingToken
          }, null, 2);
          fs.writeFileSync(path.join(WORKSPACE_ROOT, '.state', 'agent_state.json'), stateData, 'utf8');
        } catch (err) {
          console.log(`[LINE_CONTROLLER_MESSAGE] 寫入 State 檔案失敗: ${err.message}`);
        }
      }
      // console.log('[DEBUG] FENCING_TOKEN in result:', result.fencingToken);
      // console.log('[DEBUG] process.env.FENCING_TOKEN:', process.env.FENCING_TOKEN);
      
      // 在前景執行 poll_inbox.js，讓 IDE 能夠追蹤生命週期並喚醒 Agent
      require('./poll_inbox.js');
    } catch (e) {
      console.log('[LINE_CONTROLLER_RESULT] action=error');
      console.log('[LINE_CONTROLLER_MESSAGE] 解析 Bridge 回應失敗');
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.log('[LINE_CONTROLLER_RESULT] action=error');
  console.log(`[LINE_CONTROLLER_MESSAGE] Bridge 連線失敗，請確認 bridge.js 是否運作中 (${e.message})`);
  process.exit(1);
});

req.write(JSON.stringify({ 
  agentId, 
  agentLabel, 
  force, 
  secret: agentSecret
}));
req.end();
