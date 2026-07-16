// reply_tg.js
// 發送回覆 (REPLY_TEXT)
// SOP14 修正：完全不使用 fetch，以 Node 原生 http 模組重構，排除 ExperimentalWarning
// V2.2 修正：新增實體檔案與 stdin 讀取，整合多編碼自癒 (UTF-16 LE/BOM) 與 .env 尋根加載
const http = require('http');
const fs = require('fs');
const path = require('path');

const chatId = process.argv[2];

// ────────────────────────────────────────────────────────
// [AUDIT-10] 自動尋根載入 .env.local 以確保自訂埠口一致性
// ────────────────────────────────────────────────────────
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
    const dotenv = require('dotenv');
    dotenv.config({ path: envPath });
  } catch (e) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const cleanLine = line.split('#')[0].trim();
        const match = cleanLine.match(/^\s*([\w.\-]+)\s*=\s*(.*)?[\s]*$/);
        if (match) {
          let val = (match[2] || '').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env[match[1]] = val;
        }
      });
    } catch (_) {}
  }
}

const port = parseInt(process.env.TG_BRIDGE_PORT || '3001', 10);

// [AUDIT-05] Chat ID 正則格式驗證
if (!chatId || !/^-?\d+$/.test(chatId)) {
  console.error('[ERROR] 無效的 Telegram Chat ID。須為數字格式。');
  process.exit(1);
}

// [AUDIT-03] 讀取檔案並處理編碼自癒 (UTF-8 / UTF-16 LE / UTF-16 BE)
function readTextFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return buffer.toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return buffer.swap16().toString('utf16le');
  }
  let text = buffer.toString('utf8');
  if (text.startsWith('\uFEFF')) {
    text = text.slice(1);
  }
  return text;
}

// 取得輸入文字的主函數
async function getReplyText() {
  // 1. 優先順序：如果提供了第三個引數且為現有檔案路徑，則自檔案讀取
  if (process.argv[3]) {
    const filePath = process.argv[3];
    try {
      if (fs.existsSync(filePath)) {
        return readTextFile(filePath);
      } else {
        console.warn(`[WARNING] Specified file "${filePath}" does not exist. Falling back to env/stdin...`);
      }
    } catch (err) {
      console.warn(`[WARNING] Failed to read file ${filePath}, falling back...`);
    }
  }

  // 2. 優先順序：如果環境變數有值，則使用環境變數 (保持相容舊有指令)
  if (process.env.REPLY_TEXT) {
    return process.env.REPLY_TEXT;
  }

  // 3. 優先順序：若以上皆無，則嘗試從 stdin 讀取 (支援管道操作)
  return new Promise((resolve) => {
    // [AUDIT-02] 互動 TTY 加速跳過，防掛起
    if (process.stdin.isTTY) {
      return resolve('');
    }

    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      resolve(input.trim());
    });
    process.stdin.resume();
  });
}

async function run() {
  const text = await getReplyText();
  
  if (!text) {
    console.error('[ERROR] 找不到任何回覆文字輸入來源！');
    process.exit(1);
  }

  const postData = JSON.stringify({ chatId, text });

  const req = http.request({
    hostname: '127.0.0.1',
    port: port,
    path: '/api/send',
    method: 'POST',
    timeout: 10000, // [AUDIT-04] 10秒請求逾時防掛起
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ TG 回覆發送成功');
        process.exit(0);
      } else {
        console.error(`TG 回覆發送失敗: HTTP ${res.statusCode} - ${data}`);
        process.exit(1);
      }
    });
  });

  // [AUDIT-04] 逾時事件銷毀 socket
  req.on('timeout', () => {
    req.destroy(new Error('Request timeout after 10s'));
  });

  req.on('error', (e) => {
    console.error('TG 回覆發送失敗:', e.message);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

run();
