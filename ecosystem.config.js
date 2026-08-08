const path = require('path');

const WORKSPACE_ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: 'line-bridge',
      script: 'skills/03_Execution/line-bot-zero-delay/line-bot-project/bridge.js',
      cwd: WORKSPACE_ROOT,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        WORKSPACE_ROOT: WORKSPACE_ROOT
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },
    {
      name: 'tg-bridge-zero-delay',
      script: 'skills/03_Execution/telegram-bot-cdp-bridge/telegram-bot-project/dist/bin/cli-zero-delay.js',
      cwd: WORKSPACE_ROOT,
      env: {
        NODE_ENV: 'production',
        TG_BRIDGE_PORT: '3001',
        WORKSPACE_ROOT: WORKSPACE_ROOT
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },
    {
      name: 'line-tunnel',
      script: path.join(WORKSPACE_ROOT, '_archive_legacy_docs', 'bin', 'cloudflared.exe'),
      interpreter: 'none',
      args: 'tunnel --url http://127.0.0.1:3000',
      out_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'tunnel_out.log'),
      error_file: path.join(WORKSPACE_ROOT, 'Data', 'logs', 'tunnel_err.log'),
      autorestart: true,
      restart_delay: 5000
    },
    {
      name: 'sync-tunnel',
      script: 'scripts/sync_tunnel_url.js',
      cwd: WORKSPACE_ROOT,
      autorestart: true,
      restart_delay: 3000
    }
  ]
};
