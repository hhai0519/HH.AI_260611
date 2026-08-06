const path = require('path');
const fs = require('fs');

const WORKSPACE_ROOT = (() => {
  let current = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, '.env.local'))) return current;
    current = path.dirname(current);
  }
  return path.resolve(__dirname, '../../../../');
})();

const envPath = path.join(WORKSPACE_ROOT, '.env.local');
let envConfig = {};
if (fs.existsSync(envPath)) {
  try {
    const dotenv = require('dotenv');
    const result = dotenv.config({ path: envPath });
    if (!result.error) envConfig = result.parsed || {};
  } catch (e) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const cleanLine = line.split('#')[0].trim();
      const match = cleanLine.match(/^\s*([\w.\-]+)\s*=\s*(.*)?[\s]*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        envConfig[match[1]] = val;
      }
    });
  }
}

const ALLOWED_KEYS = ['TELEGRAM_BOT_TOKEN', 'ALLOWED_USER_IDS', 'WORKSPACE_ROOT', 'NODE_ENV', 'AGENT_MODEL_NAME'];

function buildFilteredEnv(keys) {
  const env = {};
  keys.forEach(key => {
    if (process.env[key]) env[key] = process.env[key];
    else if (envConfig[key]) env[key] = envConfig[key];
  });
  return env;
}

module.exports = {
  apps: [
    // ─── Zero-Delay 輕量橋接器 (唯一 Telegram 橋接 App) ────────────────────────
    {
      name: "tg-bridge-zero-delay",
      script: path.join(__dirname, "dist", "bin", "cli-zero-delay.js"),
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000,
      exp_backoff_restart_delay: 1000, // [NODE-01] 補回指數退避保護
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: path.join(WORKSPACE_ROOT, "Data", "logs", "tg_zero_delay_err.log"),
      out_file: path.join(WORKSPACE_ROOT, "Data", "logs", "tg_zero_delay_out.log"),
      merge_logs: true,
      ignore_watch: ["node_modules", "dist", "*.log"],
      env: Object.assign({
        NODE_ENV: "production",
        WORKSPACE_ROOT: WORKSPACE_ROOT,
        WORKSPACE_BASE_DIR: path.dirname(WORKSPACE_ROOT), // [CODE-03] 恢復相依環境變數
        AGENT_MODEL_NAME: "Gemini"
      }, buildFilteredEnv(ALLOWED_KEYS), {
        TG_BRIDGE_PORT: "3001"   // 強制覆蓋，確保獨立
      })
    }
  ]
};
