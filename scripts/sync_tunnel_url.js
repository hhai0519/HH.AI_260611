/**
 * 🛡️ AU-05 / N-01 修正版 (sync_tunnel_url.js)
 * 1. 使用內部 setInterval 降低 PM2 重啟頻率，統一讀取 Data/logs 日誌。
 * 2. 徹底移除 default_gateway_token 降級，無金鑰時主動靜默跳過。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const WORKSPACE_ROOT = path.join(__dirname, '..');
const LOG_DIR = path.join(WORKSPACE_ROOT, 'Data', 'logs');
const ERR_LOG_PATH = path.join(LOG_DIR, 'tunnel_err.log');
const OUT_LOG_PATH = path.join(LOG_DIR, 'tunnel_out.log');
const ENV_PATH = path.join(WORKSPACE_ROOT, '.env.local');

let workerUrl = 'https://line-proxy.hh-ai-19850519.workers.dev';
let gatewayToken = '';

function loadConfig() {
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const match = line.split('#')[0].trim().match(/^([\w.\-]+)\s*=\s*(.*)/);
      if (match) {
        if (match[1] === 'WORKER_URL') workerUrl = match[2].trim().replace(/^["']|["']$/g, '');
        if (match[1] === 'INTERNAL_GATEWAY_TOKEN') gatewayToken = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

function getLogMatches(filePath) {
  if (!fs.existsSync(filePath)) return [];
  let fd = null;
  try {
    const stat = fs.statSync(filePath);
    const readSize = Math.min(stat.size, 65536); // 64KB Window
    const buffer = Buffer.alloc(readSize);
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, readSize, Math.max(0, stat.size - readSize));
    fs.closeSync(fd);
    fd = null;
    return buffer.toString('utf8').match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/g) || [];
  } catch (_) {
    if (fd) try { fs.closeSync(fd); } catch (_) {}
  }
  return [];
}

let lastSyncedUrl = null;

async function syncToWorker(tunnelUrl) {
  if (!gatewayToken) {
    console.warn('[Sync] INTERNAL_GATEWAY_TOKEN 未設定，跳過本次同步');
    return;
  }
  
  if (tunnelUrl === lastSyncedUrl) return; 
  
  const payload = JSON.stringify({ tunnel_url: tunnelUrl });
  const req = https.request(new URL('/admin/update-tunnel', workerUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Gateway-Token': gatewayToken,
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`[Sync Worker] HTTP 200 - 成功更新 URL: ${tunnelUrl}`);
        lastSyncedUrl = tunnelUrl;
      } else {
        console.error(`[Sync Worker Error] HTTP ${res.statusCode} : ${body}`);
      }
    });
  });
  req.on('error', (e) => console.error('[Worker Sync Failure]', e.message));
  req.write(payload);
  req.end();
}

function runSync() {
  loadConfig();
  const allMatches = [...getLogMatches(ERR_LOG_PATH), ...getLogMatches(OUT_LOG_PATH)];
  const latest = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null;
  if (latest) {
    syncToWorker(latest);
  }
}

runSync();
setInterval(runSync, 15000);
console.log('🔄 啟動隧道自動同步器 (每 15 秒巡檢一次)...');
