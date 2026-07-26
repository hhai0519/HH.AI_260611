/**
 * PM2 Native Daemon - LINE Autonomous Inbox Listener (v10.0 Master Flawless)
 * 24/7 Permanent Service | Passive Backoff Lock Architecture | Zero Lock Contention
 */
const http = require('http');
const path = require('path');

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../');
require('dotenv').config({ path: path.join(WORKSPACE_ROOT, '.env.local') });

const HOST = '127.0.0.1';
const PORT = 3000;
const AGENT_ID = 'Antigravity-Master';
const AGENT_SECRET = process.env.CURRENT_AGENT_SECRET || 'sec_agent_8f93a12d904b7e12e3a9041b';

let fencingToken = '0:0';
let isAcquired = false;

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   Antigravity LINE PM2 Autonomous Daemon v10.0 Master  ║');
console.log('╚════════════════════════════════════════════════════════╝');

// 1. 步驟 1：被動試探取鎖 (force: false, 絕不硬搶 IDE 的鎖)
function acquireLock(forceAcquire = false) {
  const payload = JSON.stringify({ agentId: AGENT_ID, secret: AGENT_SECRET, force: forceAcquire });
  const req = http.request({
    hostname: HOST,
    port: PORT,
    path: '/api/lock/acquire',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(body);
          if (json.success && json.fencingToken) {
            fencingToken = json.fencingToken;
            isAcquired = true;
            console.log(`[LINE-Daemon] Redlock 取得成功！Fencing Token: ${fencingToken}`);
            startPollingLoop();
            startHeartbeatLoop();
            return;
          }
        } catch (e) {}
      }
      // 取鎖失敗代表 IDE 正在主導，進入被動等待退避模式 (不硬搶)
      console.log(`[LINE-Daemon] 偵測到 IDE 前景監聽中，進入被動守望模式 (60 秒後重試)...`);
      setTimeout(() => acquireLock(false), 60000);
    });
  });

  req.on('error', (err) => {
    console.error('[LINE-Daemon Error] 取鎖連線異常:', err.message);
    setTimeout(() => acquireLock(false), 10000);
  });

  req.write(payload);
  req.end();
}

// 2. 步驟 2：心跳續命 (每 10 秒)
function startHeartbeatLoop() {
  setInterval(() => {
    if (!isAcquired) return;
    const payload = JSON.stringify({ agentId: AGENT_ID, fencingToken: fencingToken, secret: AGENT_SECRET });
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: '/api/lock/heartbeat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      res.resume(); // 確保 Socket 被釋放
      if (res.statusCode !== 200) {
        console.warn('[LINE-Daemon] 心跳續命遭拒，轉為被動守望模式...');
        isAcquired = false;
        setTimeout(() => acquireLock(false), 3000);
      }
    });
    req.on('error', () => {});
    req.write(payload);
    req.end();
  }, 10000);
}

// 3. 步驟 3：24/7 輪詢 /api/inbox 端點
function startPollingLoop() {
  function pollOnce() {
    if (!isAcquired) return;
    const pathUrl = `/api/inbox?token=${encodeURIComponent(AGENT_ID)}&fencingToken=${encodeURIComponent(fencingToken)}`;
    
    http.get({ hostname: HOST, port: PORT, path: pathUrl }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.message && json.message.userId) {
              const msg = json.message;
              console.log(`[LINE_REQUEST] ${msg.userId} : ${msg.text}`);
            }
          } catch (e) {}
        } else if (res.statusCode === 403) {
          // 🛡️ 核心修正：遭遇 403 時 100% 禮讓 IDE，轉入被動退避，絕不安裝 force: true 搶鎖！
          console.log('[LINE-Daemon] 鎖已移交給 IDE 前景 Agent，進入被動禮讓模式...');
          isAcquired = false;
          setTimeout(() => acquireLock(false), 60000);
          return;
        }
        setTimeout(pollOnce, 2000);
      });
    }).on('error', (err) => {
      console.error('[LINE-Daemon Error] 輪詢連線異常:', err.message);
      setTimeout(pollOnce, 5000);
    });
  }

  pollOnce();
}

// 啟動點火 (預設非強制搶鎖)
acquireLock(false);
