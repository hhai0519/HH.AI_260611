// scripts/switch_bot_env.js
const fs = require('fs');
const path = require('path');

const platform = process.argv[2];     // "line" 或 "tg"
const targetAccount = process.argv[3]; // e.g. "922dmfib" 或 "backup"

if (!platform || !['line', 'tg'].includes(platform.toLowerCase())) {
  console.error('[ERROR] 請指定正確的平台: line 或 tg');
  process.exit(1);
}
if (!targetAccount) {
  console.error('[ERROR] 請指定要切換的帳號字尾名稱 (如 922dmfib)');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '../');
const envPath = path.join(rootDir, '.env.local');
const backupPath = path.join(rootDir, `.env.local.bak.${Date.now()}`);

if (!fs.existsSync(envPath)) {
  console.error(`[ERROR] 找不到設定檔: ${envPath}`);
  process.exit(1);
}

try {
  // 1. 備份 env.local 防止寫入中斷 (OPT-02)
  fs.copyFileSync(envPath, backupPath);

  // 2. 讀取與解析環境變數 (主動清理 BOM 標頭)
  let envContent = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF+/, '');
  const lines = envContent.split(/\r?\n/);
  const envVars = {};

  lines.forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('#') || cleanLine.startsWith(';')) return; // 跳過全行註解

    const match = cleanLine.match(/^([\w.\-]+)\s*=(.*)$/);
    if (match) {
      let val = match[2].trim();
      // NEW-BUG-02: 僅切割帶空格 of ' #' 註解，保護金鑰內部合法的 '#' 符號
      const commentIndex = val.indexOf(' #');
      if (commentIndex !== -1) {
        val = val.slice(0, commentIndex).trim();
      }
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[match[1]] = val;
    }
  });

  // 3. 依據平台載入並覆寫
  let updatedContent = envContent;

  // BUG-02: 轉義特殊正則字元，防止正則注入攻擊
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function setEnvVar(content, key, value) {
    const escapedKey = escapeRegex(key);
    const regex = new RegExp(`^${escapedKey}\\s*=.*$`, 'm');
    if (regex.test(content)) {
      // NEW-BUG-01: 改用 Callback 函式傳入替換值，防止金鑰中的 $ 符號被 JavaScript replace 誤判為正則替換指令
      return content.replace(regex, () => `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  }

  if (platform.toLowerCase() === 'line') {
    const targetId = envVars[`LINE_CHANNEL_ID_${targetAccount}`];
    const targetSecret = envVars[`LINE_CHANNEL_SECRET_${targetAccount}`];
    const targetToken = envVars[`LINE_CHANNEL_ACCESS_TOKEN_${targetAccount}`];

    if (!targetId || !targetSecret || !targetToken) {
      throw new Error(`LINE 帳號 ${targetAccount} 的金鑰配置不完整。`);
    }

    updatedContent = setEnvVar(updatedContent, 'ACTIVE_LINE_ACCOUNT', targetAccount);
    updatedContent = setEnvVar(updatedContent, 'LINE_CHANNEL_ID', targetId);
    updatedContent = setEnvVar(updatedContent, 'LINE_CHANNEL_SECRET', targetSecret);
    updatedContent = setEnvVar(updatedContent, 'LINE_CHANNEL_ACCESS_TOKEN', targetToken);

  } else if (platform.toLowerCase() === 'tg') {
    const targetToken = envVars[`TELEGRAM_BOT_TOKEN_${targetAccount}`];

    if (!targetToken) {
      throw new Error(`Telegram 帳號 ${targetAccount} 的 Token 配置不完整。`);
    }

    updatedContent = setEnvVar(updatedContent, 'ACTIVE_TG_ACCOUNT', targetAccount);
    updatedContent = setEnvVar(updatedContent, 'TELEGRAM_BOT_TOKEN', `"${targetToken}"`);
  }

  // 4. 原子寫入 (同目錄 tmp 寫入並 renameSync 以保障原子性)
  const tmpPath = envPath + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmpPath, updatedContent, 'utf8');
  
  // BUG-03 & EBUSY Windows 退避機制
  function renameWithRetrySync(src, dest, retries = 5, delay = 100) {
    for (let i = 0; i <= retries; i++) {
      try {
        fs.renameSync(src, dest);
        return;
      } catch (err) {
        if (i === retries) throw err;
        if (err.code === 'EACCES' || err.code === 'EPERM' || err.code === 'EBUSY') {
          console.warn(`[RETRY] 檔案鎖定中，${delay}ms 後重新嘗試原子替換... (剩餘 ${retries - i} 次)`);
          const start = Date.now();
          while (Date.now() - start < delay) {} // 同步阻塞式等待
        } else {
          throw err;
        }
      }
    }
  }

  renameWithRetrySync(tmpPath, envPath);
  console.log(`[OK] 已成功將 active ${platform.toUpperCase()} 帳號切換為 @${targetAccount}`);
  process.exit(0);

} catch (err) {
  console.error(`[ERROR] 切換失敗: ${err.message}`);
  // 還原備份
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, envPath);
    fs.unlinkSync(backupPath);
  }
  process.exit(1);
}
