// poll_tg.js
// 長輪詢任務取得，含 5 秒網路抖動指數退避
// SOP14 修正：完全不使用 fetch，以 Node 原生 http 模組重構，排除 ExperimentalWarning
// V2.3：比照 poll_inbox.js 加入內部 loop，整合 65s Socket 逾時防禦與 triggerNextPoll 排他鎖
const http = require('http');
const fs = require('fs');
const path = require('path');

// [AUDIT-01] 自動尋根載入 .env.local 確保埠口一致性
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
  try {
    require('dotenv').config({ path: envPath });
  } catch (_) {
    try {
      fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const m = line.split('#')[0].trim().match(/^([\w.\-]+)\s*=\s*(.*)/);
        if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      });
    } catch (_) {}
  }
}

const agentId = process.argv[2];
const port = parseInt(process.env.TG_BRIDGE_PORT || '3001', 10);
if (!agentId) { console.error('Usage: node poll_tg.js <agentId>'); process.exit(1); }

console.log("Antigravity Telegram Polling 監聽器已啟動，等待事件中...");

function poll() {
  // [AUDIT-05] 每輪請求獨立的排他鎖，防止 error 與 timeout 同時觸發雙花重啟
  let isFinished = false;
  const triggerNextPoll = (delayMs) => {
    if (isFinished) return;
    isFinished = true;
    setTimeout(poll, delayMs);
  };

  const req = http.request({
    hostname: '127.0.0.1',
    port: port,
    path: `/api/inbox?token=${encodeURIComponent(agentId)}`,
    method: 'GET',
    timeout: 65000 // [AUDIT-03] 65s Socket 逾時，防止 Bridge 掛起時無限卡死
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      // [核心修復] 遇到 204 No Content (逾時無訊息)，在進程內靜默續期，不退出
      if (res.statusCode === 204) {
        triggerNextPoll(1000);
        return;
      }

      if (res.statusCode === 403) {
        console.log('[AGENT_TRANSFER]');
        isFinished = true;
        process.exit(0);
      }

      // [AUDIT-02] 503 改為內部重試，不退出進程，避免觸發 Agent 洗版
      if (res.statusCode === 503) {
        console.error('Bridge 正在重啟/優雅關機，退避 5 秒後重試...');
        triggerNextPoll(5000);
        return;
      }

      if (res.statusCode !== 200) {
        console.error(`HTTP Error ${res.statusCode}`);
        triggerNextPoll(5000);
        return;
      }

      try {
        const msg = JSON.parse(data);
        if (msg && msg.chatId) {
          const safeText = (msg.text || '').replace(/\n/g, '\\n');
          console.log(`[TG_REQUEST] ${msg.chatId} : ${safeText}`);
        }
        isFinished = true;
        process.exit(0); // 只有收到真實訊息時才退出，喚醒 Agent
      } catch (e) {
        console.error('JSON 解析失敗:', e.message);
        triggerNextPoll(5000);
      }
    });
  });

  // [AUDIT-03] 逾時後銷毀 Socket，觸發 ECONNRESET/ECONNABORTED 錯誤（下方靜默處理）
  req.on('timeout', () => {
    req.destroy();
  });

  req.on('error', (err) => {
    // [AUDIT-03] Socket 被 destroy() 後的預期錯誤，靜默重試，不輸出雜訊
    if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' ||
        err.message === 'socket hang up') {
      triggerNextPoll(1000);
    } else {
      console.error('連線異常，退避 5 秒:', err.message);
      triggerNextPoll(5000);
    }
  });

  req.end();
}

poll();
