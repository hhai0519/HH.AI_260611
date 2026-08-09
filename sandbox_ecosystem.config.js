const path = require('path');
const dotenv = require('dotenv');

const WORKSPACE_ROOT = __dirname;
dotenv.config({ path: path.join(WORKSPACE_ROOT, '.env.local') });

module.exports = {
  apps: [
    {
      name: 'line-bridge-sandbox',
      script: 'skills/03_Execution/line-bot-zero-delay/line-bot-project/bridge.js',
      cwd: WORKSPACE_ROOT,
      out_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'line_bridge_out.log'),
      error_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'line_bridge_err.log'),
      env: { PORT: 3000 },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'tg-bridge-zero-delay-sandbox',
      script: 'skills/03_Execution/telegram-bot-cdp-bridge/telegram-bot-project/dist/bin/cli-zero-delay.js',
      cwd: WORKSPACE_ROOT,
      out_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'tg_zero_delay_out.log'),
      error_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'tg_zero_delay_err.log'),
      env: { PORT: 3001 },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'line-daemon-sandbox',
      script: 'skills/03_Execution/line-bot-zero-delay/line-bot-project/start_line.js',
      args: 'Antigravity-Master "[Gemini] 萬能總管" true',
      cwd: WORKSPACE_ROOT,
      out_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'line_daemon_out.log'),
      error_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'line_daemon_err.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
