// reply_tg.js
// 發送回覆 (REPLY_TEXT)
// SOP14 修正：完全不使用 fetch，以 Node 原生 http 模組重構，排除 ExperimentalWarning
// V2.2 修正：新增實體檔案與 stdin 讀取，整合多編碼自癒 (UTF-16 LE/BOM) 與 .env 尋根加載
// SOP14-R11.0 修正：對齊 LINE reply.js 存檔機制，支援話題資料夾建立、個案存檔與暫存檔清理
const http = require('http');
const fs = require('fs');
const path = require('path');

const chatId = process.argv[2];
// [AUDIT-11] 補齊對話紀錄與歸檔所需參數
const agentLabel = process.argv[4];    // e.g. "[Gemini 3.1 Pro] 測試"
const topicCategory = process.argv[5]; // e.g. "永光"
const questionBrief = process.argv[6]; // e.g. "分析基本面"

// ────────────────────────────────────────────────────────
// [AUDIT-10] 自動尋根載入 .env.local 以確保自訂埠口一致性
// ────────────────────────────────────────────────────────
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || (() => {
  let current = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, '.env.local'))) return current;
    current = path.dirname(current);
  }
  return current;
})();

// [AUDIT-11] 載入 DLP 淨化器
const dlpSanitizerPath = path.join(WORKSPACE_ROOT, 'Modules', 'shared', 'dlpSanitizer.js');
const { sanitizeDlp: sanitizeContentForDLP } = require(dlpSanitizerPath);

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

// [AUDIT-11] 寫入原子寫入函數與自癒退避 (與 reply.js 完全一致)
function writeStateAtomic(targetFilePath, data, maxRetries = 5, baseDelayMs = 100) {
    const tmpFilePath = targetFilePath + '.' + process.pid + '.tmp';
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            fs.writeFileSync(tmpFilePath, data, 'utf8');
            fs.renameSync(tmpFilePath, targetFilePath);
            return true;
        } catch (err) {
            attempt++;
            if (fs.existsSync(tmpFilePath)) {
                try { fs.unlinkSync(tmpFilePath); } catch (e) {}
            }
            if (attempt >= maxRetries) {
                console.error(`[AtomicWrite] 放棄寫入 ${targetFilePath}，已重試 ${maxRetries} 次。錯誤: ${err.message}`);
                throw err;
            }
            const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 50;
            console.warn(`[AtomicWrite] 檔案鎖死，${Math.round(delay)}ms 後重試 (${attempt}/${maxRetries}): ${targetFilePath}`);
            const waitTill = new Date(new Date().getTime() + delay);
            while (waitTill > new Date()) {}
        }
    }
    return false;
}

// 取得輸入文字的主函數
async function getReplyText() {
  // 0. 優先順序：如果系統參數為 'env'，直接從環境變數讀取 (對齊 LINE reply.js，防範檔案型 IPC 違規)
  if (process.argv[3] === 'env') {
    return process.env.REPLY_TEXT;
  }

  // 1. 優先順序：如果提供了系統參數且為現有檔案路徑，則自檔案讀取
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
  let text = await getReplyText();
  
  if (!text) {
    console.error('[ERROR] 找不到任何回覆文字輸入來源！');
    process.exit(1);
  }

  // [AUDIT-11] 自動在回覆內容開頭加上 Agent 身份識別
  if (agentLabel) {
    text = `【由 ${agentLabel} 提供回覆】\n\n` + text;
  }

  // [AUDIT-11] 雙生對齊：自動存檔邏輯 (TG_萬能總管 話題歸檔)
  if (agentLabel && topicCategory && questionBrief) {
    try {
        const desktopPath = process.env.DESKTOP_PATH || path.join(require('os').homedir(), 'Desktop');
        const baseRecordDir = path.join(desktopPath, 'Line對話紀錄');
        if (!fs.existsSync(baseRecordDir)) fs.mkdirSync(baseRecordDir, { recursive: true });

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const timeStr = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;

        // 目標資料夾：統一歸併在「TG_萬能總管」模式
        const targetDir = path.join(baseRecordDir, 'TG_萬能總管');
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const safeCategory = topicCategory.replace(/[<>:"/\\|?*]/g, '_');
        const safeBrief = questionBrief.replace(/[<>:"/\\|?*]/g, '_');
        
        const items = fs.readdirSync(targetDir, { withFileTypes: true });
        let maxQ = 0;
        let matchedQDir = null;
        
        // 第一階段：精確比對
        for (const item of items) {
            if (item.isDirectory()) {
                const match = item.name.match(/^Q(\d{2})_(.*)$/);
                if (match) {
                    const qSeq = parseInt(match[1], 10);
                    const qName = match[2];
                    if (qSeq > maxQ) maxQ = qSeq;
                    if (qName === safeCategory) {
                        matchedQDir = item.name;
                        break;
                    }
                }
            }
        }

        // 第二階段：模糊比對
        if (!matchedQDir) {
            for (const item of items) {
                if (item.isDirectory()) {
                    const match = item.name.match(/^Q(\d{2})_(.*)$/);
                    if (match) {
                        const qName = match[2];
                        if (safeCategory.length >= 2 && qName.length >= 2) {
                            if (qName.includes(safeCategory) || safeCategory.includes(qName)) {
                                matchedQDir = item.name;
                                break;
                            }
                        }
                    }
                }
            }
        }

        let threadDirName;
        if (matchedQDir) {
            threadDirName = matchedQDir;
        } else {
            maxQ++;
            const qStr = String(maxQ).padStart(2, '0');
            threadDirName = `Q${qStr}_${safeCategory}`;
            fs.mkdirSync(path.join(targetDir, threadDirName));
        }

        const threadDirPath = path.join(targetDir, threadDirName);

        // 計算流水號
        const files = fs.readdirSync(threadDirPath).filter(f => f.endsWith('.txt'));
        let maxSeq = 0;
        files.forEach(f => {
            const match = f.match(/^(\d{3})_/);
            if (match) {
                const seq = parseInt(match[1], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        });

        const currentSeq = maxSeq + 1;
        const currentSeqStr = String(currentSeq).padStart(3, '0');

        const fileName = `${currentSeqStr}_${safeCategory}_${safeBrief}_${timeStr}.txt`;
        const filePath = path.join(threadDirPath, fileName);

        const sanitizedText = sanitizeContentForDLP(text);
        writeStateAtomic(filePath, sanitizedText);
        console.log(`[系統] 對話紀錄已自動保存至: ${filePath} (DLP已套用)`);

    } catch (err) {
        console.error(`[警告] 無法寫入對話紀錄: ${err.message}`);
    }
  }

  // 執行 API 傳送
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
        
        // [AUDIT-11] 回覆成功後，自動清理專案根目錄的暫存檔 (與 LINE 一致)
        if (process.argv[3] && process.argv[3].endsWith('.txt') && fs.existsSync(process.argv[3])) {
            try {
                fs.unlinkSync(process.argv[3]);
                console.log(`[系統] 已自動清理暫存檔: ${process.argv[3]}`);
            } catch (_) {}
        }
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
