const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const WORKSPACE_ROOT = (() => {
  let current = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, '.env.local'))) return current;
    current = path.dirname(current);
  }
  return path.resolve(__dirname, '../../../../');
})();

const dbPath = path.join(WORKSPACE_ROOT, 'Data', 'telegram_remoat.db');
const envPath = path.join(WORKSPACE_ROOT, '.env.local');

// 讀取 ALLOWED_USER_IDS
let allowedUserId = '';
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
        const cleanLine = line.split('#')[0].trim();
        const match = cleanLine.match(/^\s*ALLOWED_USER_IDS\s*=\s*(.*)?\s*$/);
        if (match) {
            let val = (match[1] || '').trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            allowedUserId = val.split(',')[0].trim(); // 拿第一個 ID
        }
    });
}

if (!allowedUserId) {
    console.error('⚠️ 無法從 .env.local 取得 ALLOWED_USER_IDS');
    process.exit(1);
}

const workspaceName = path.basename(WORKSPACE_ROOT);

console.log(`[Auto-Bind] User ID: ${allowedUserId}`);
console.log(`[Auto-Bind] Workspace: ${workspaceName}`);

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS workspace_bindings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL UNIQUE,
        workspace_path TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
`);

const stmtUpsert = db.prepare(`
    INSERT INTO workspace_bindings (channel_id, workspace_path, guild_id)
    VALUES (?, ?, ?)
    ON CONFLICT(channel_id) DO UPDATE SET
        workspace_path = excluded.workspace_path,
        guild_id = excluded.guild_id
`);

stmtUpsert.run(allowedUserId, workspaceName, allowedUserId);
console.log(`✅ 成功將 Telegram 帳號 ${allowedUserId} 綁定至專案 ${workspaceName}！`);
db.close();
