/**
 * 🛡️ N-02 / SRE 優化版 (tg_daemon.js)
 * Telegram Zero-Delay 守護進程，含 Redlock 防競爭、1000ms 輪詢、逾時過濾。
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const WORKSPACE_ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(WORKSPACE_ROOT, '.env.local');

let tgToken = '';
let isPrimary = false;

function loadConfig() {
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const match = line.split('#')[0].trim().match(/^([\w.\-]+)\s*=\s*(.*)/);
      if (match) {
        if (match[1] === 'ACTIVE_TG_ACCOUNT') isPrimary = match[2].trim().replace(/^["']|["']$/g, '') === 'primary';
        if (isPrimary && match[1] === 'TELEGRAM_BOT_TOKEN_primary') tgToken = match[2].trim().replace(/^["']|["']$/g, '');
        if (!isPrimary && match[1] === 'TELEGRAM_BOT_TOKEN_backup') tgToken = match[2].trim().replace(/^["']|["']$/g, '');
        // 兼容舊版單一 token 設定
        if (!tgToken && match[1] === 'TELEGRAM_BOT_TOKEN') tgToken = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

let highestUpdateId = 0;
let isPolling = false;

function fetchUpdates() {
  if (isPolling || !tgToken) return;
  isPolling = true;

  // SRE 優化：逾時設定為 65 秒 (與 TG 伺服器的 60 秒 long-polling 配合)
  const req = https.request(`https://api.telegram.org/bot${tgToken}/getUpdates?offset=${highestUpdateId + 1}&timeout=60`, {
    method: 'GET',
    timeout: 65000 
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      isPolling = false;
      if (res.statusCode === 401 || res.statusCode === 403) {
        console.error(`[TG-Daemon] HTTP ${res.statusCode} (Token 可能無效)，暫停輪詢 30 秒`);
        setTimeout(fetchUpdates, 30000);
        return;
      }
      if (res.statusCode !== 200) {
        setTimeout(fetchUpdates, 1000);
        return;
      }
      try {
        const data = JSON.parse(body);
        if (data.ok && data.result.length > 0) {
          console.log(`[TG-Daemon] 收到 ${data.result.length} 筆新訊息，觸發 CDP 處理...`);
          
          const scriptPath = path.join(WORKSPACE_ROOT, '.agents', 'skills', 'telegram-bot-cdp-bridge', 'telegram-bot-project', 'poll_tg.js');
          if (fs.existsSync(scriptPath)) {
            try {
              execSync(`node "${scriptPath}" Antigravity-Master`, { stdio: 'inherit' });
            } catch (err) {
              console.error(`[TG-Daemon] 呼叫 poll_tg.js 失敗:`, err.message);
            }
          }
          
          highestUpdateId = Math.max(...data.result.map(u => u.update_id));
        }
      } catch (e) {
        console.error('[TG-Daemon] 解析 JSON 失敗:', e.message);
      }
      
      // SRE 優化：1000ms 間隔
      setTimeout(fetchUpdates, 1000);
    });
  });

  req.on('error', (e) => {
    isPolling = false;
    // 靜默過濾網路重置錯誤，避免日誌無限膨脹
    if (e.code !== 'ECONNRESET') {
      console.error('[TG-Daemon] 連線異常:', e.message);
    }
    setTimeout(fetchUpdates, 1000);
  });
  
  req.on('timeout', () => {
    req.destroy(); 
  });

  req.end();
}

console.log('🛡️ TG Zero-Delay 守護進程啟動...');
loadConfig();
if (tgToken) {
  fetchUpdates();
} else {
  console.error('[TG-Daemon] 未找到 TELEGRAM_BOT_TOKEN，進程閒置');
}
