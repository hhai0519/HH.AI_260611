// scripts/switch_bot_env.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // ★ Hash Diff 備份策略

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

// ★ 備份管理常數（單一修改點）
const MAX_BACKUPS_TO_KEEP = 3;
const CHECKSUM_FILE = path.join(rootDir, '.env.local.bak.checksum');

if (!fs.existsSync(envPath)) {
  console.error(`[ERROR] 找不到設定檔: ${envPath}`);
  process.exit(1);
}

// ★ 計算 SHA256 Hash（接受任意檔案路徑，預留加密版接口）
function calculateHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (err) {
    // [SOP14-R2] 計算失敗返回空字串，強制觸發備份（Fail-Closed 方向）
    console.warn(`[WARN] 無法計算 Checksum（${err.message}），將強制觸發備份。`);
    return '';
  }
}

// ★ Hash Diff 備份（只有內容真正改變才建立備份）
function backupIfChanged() {
  const currentHash = calculateHash(envPath);

  // 讀取上次備份的 Hash
  let lastHash = '';
  if (fs.existsSync(CHECKSUM_FILE)) {
    try {
      lastHash = fs.readFileSync(CHECKSUM_FILE, 'utf8').trim();
    } catch (e) {
      lastHash = ''; // 讀取失敗視為無記錄，強制備份
    }
  }

  // Hash 相同 → 內容未變，跳過備份
  if (currentHash !== '' && currentHash === lastHash) {
    console.log('[Backup] 內容未變更 (Checksum 一致)，跳過備份作業。');
    return null;
  }

  // Hash 不同 → 建立備份
  const backupPath = path.join(rootDir, `.env.local.bak.${Date.now()}`);
  fs.copyFileSync(envPath, backupPath);

  // [SOP14-R3] 備份成功後才更新 Checksum，防止備份失敗造成 Checksum 誤更新
  fs.writeFileSync(CHECKSUM_FILE, currentHash, 'utf8');
  console.log(`[Backup] 內容已變更，建立備份：${path.basename(backupPath)}（Checksum: ${currentHash.slice(0, 8)}...）`);
  return backupPath;
}

// ★ Auto TTL 清理（保留最新 N 個時間戳備份）
function cleanupOldBackups() {
  try {
    const allFiles = fs.readdirSync(rootDir);
    const backupFiles = allFiles
      .filter(f => /^\.env\.local\.bak\.\d+$/.test(f))
      .map(f => ({
        name: f,
        fullPath: path.join(rootDir, f),
        ts: parseInt(f.replace('.env.local.bak.', ''), 10)
      }))
      .sort((a, b) => a.ts - b.ts);

    // [SOP14-R3] 執行前打印當前備份數量
    console.log(`[Backup] 開始執行備份清理，目前共 ${backupFiles.length} 個時間戳備份，保留最新 ${MAX_BACKUPS_TO_KEEP} 個...`);

    const toDelete = backupFiles.slice(0, Math.max(0, backupFiles.length - MAX_BACKUPS_TO_KEEP));
    if (toDelete.length === 0) {
      console.log('[Backup] 備份數量未超出限制，無需清理。');
      return;
    }

    toDelete.forEach(({ name, fullPath }) => {
      try {
        // [SOP14-R1] 逐一捕捉刪除失敗，只 warn 不中斷主流程（防 EBUSY 鎖定）
        fs.unlinkSync(fullPath);
        console.log(`[Backup] 已清理舊備份: ${name}`);
      } catch (delErr) {
        console.warn(`[WARN] 無法刪除備份 ${name}: ${delErr.message}`);
      }
    });

    console.log(`[Backup] 清理完成，目前保留 ${Math.min(backupFiles.length, MAX_BACKUPS_TO_KEEP)} 個備份 + .bak.init 基準。`);
  } catch (err) {
    console.warn(`[WARN] 備份清理執行異常: ${err.message}`);
  }
}

try {
  // 1. 備份 env.local（Hash Diff 策略，只有內容改變才備份）
  backupIfChanged();

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
      // NEW-BUG-01: 改用 Callback 函式傳入替換值，防止金鑰中的 $ 符號被誤判
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
          while (Date.now() - start < delay) {}
        } else {
          throw err;
        }
      }
    }
  }

  renameWithRetrySync(tmpPath, envPath);

  // 5. Auto TTL 清理（保留最新 MAX_BACKUPS_TO_KEEP 個備份）
  cleanupOldBackups();

  // 6. [SRE 自動排障] 自動清理殘留進程，防止舊快取連線搶鎖 (SOP14-R12.1-3Rounds)
  try {
    const zombieScriptPath = path.join(__dirname, 'kill_zombies.js');
    if (fs.existsSync(zombieScriptPath)) {
      const { spawnSync } = require('child_process');
      console.log('[System] Triggering automatic zombie process cleanup...');
      spawnSync('node', [zombieScriptPath], { stdio: 'inherit' });
    }
  } catch (cleanErr) {
    console.warn(`[WARN] 自動清理殘留進程執行異常: ${cleanErr.message}`);
  }

  console.log(`[OK] 已成功將 active ${platform.toUpperCase()} 帳號切換為 @${targetAccount}`);
  process.exit(0);

} catch (err) {
  console.error(`[ERROR] 切換失敗: ${err.message}`);
  // 切換失敗：不執行 cleanupOldBackups，確保最近備份可用於回滾
  process.exit(1);
}
