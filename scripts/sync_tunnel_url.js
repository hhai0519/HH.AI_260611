const fs = require('fs');
const path = require('path');
const https = require('https');

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../');
const ENV_PATH = path.join(WORKSPACE_ROOT, '.env.local');

let workerUrl = 'https://line-proxy.hh-ai-19850519.workers.dev';
let gatewayToken = 'gw_tok_92e811c402a73b56a1008f1c';

if (fs.existsSync(ENV_PATH)) {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const match = line.split('#')[0].trim().match(/^([\w.\-]+)\s*=\s*(.*)/);
      if (match) {
        const k = match[1];
        const v = match[2].trim().replace(/^["']|["']$/g, '');
        if (k === 'WORKER_URL') workerUrl = v;
        if (k === 'INTERNAL_GATEWAY_TOKEN') gatewayToken = v;
      }
    });
  } catch (_) {}
}

function getLogMatches(filePath) {
  if (!fs.existsSync(filePath)) return [];
  let fd = null;
  try {
    const stat = fs.statSync(filePath);
    const readSize = Math.min(stat.size, 65536);
    const buffer = Buffer.alloc(readSize);
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, readSize, Math.max(0, stat.size - readSize));
    fs.closeSync(fd);
    fd = null;
    const chunk = buffer.toString('utf8');
    return chunk.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/g) || [];
  } catch (_) {
    if (fd) try { fs.closeSync(fd); } catch (_) {}
  }
  return [];
}

function getLatestTunnelUrl() {
  const logPath = path.join(WORKSPACE_ROOT, 'Data', 'logs', 'tunnel_out.log');
  const errLogPath = path.join(WORKSPACE_ROOT, 'Data', 'logs', 'tunnel_err.log');
  const allMatches = [...getLogMatches(logPath), ...getLogMatches(errLogPath)];
  return allMatches.length > 0 ? allMatches[allMatches.length - 1] : null;
}

function updateEnvFile(newUrl) {
  if (!fs.existsSync(ENV_PATH)) return;
  try {
    let content = fs.readFileSync(ENV_PATH, 'utf8');
    if (content.includes('TUNNEL_URL=')) {
      content = content.replace(/TUNNEL_URL=.*/g, `TUNNEL_URL=${newUrl}`);
    } else {
      content += `\nTUNNEL_URL=${newUrl}\n`;
    }
    fs.writeFileSync(ENV_PATH, content, 'utf8');
  } catch (_) {}
}

async function syncToWorker(tunnelUrl) {
  console.log(`[Sync v20.0] 檢測到 Quick Tunnel 最新網址: ${tunnelUrl}`);
  updateEnvFile(tunnelUrl);

  const payload = JSON.stringify({ tunnel_url: tunnelUrl });
  try {
    const adminUrl = new URL('/admin/update-tunnel', workerUrl);
    const req = https.request(adminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Gateway-Token': gatewayToken,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => console.log(`[Worker Sync Result] HTTP ${res.statusCode}: ${body}`));
    });
    req.on('error', e => console.error('[Worker Sync Failure]', e.message));
    req.write(payload);
    req.end();
  } catch (e) {
    console.error('[Worker URL Error]', e.message);
  }
}

let lastSyncedUrl = '';
async function doSync() {
  const latest = getLatestTunnelUrl();
  if (latest && latest !== lastSyncedUrl) {
    lastSyncedUrl = latest;
    await syncToWorker(latest);
  }
}

console.log('☁️ [Sync Tunnel Daemon v20.0] 啟動自動同步監控 (每 15 秒巡檢)...');
doSync();
setInterval(doSync, 15000);
