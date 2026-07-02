// ============================================================================
// ecosystem.config.js — PM2 單核心高防禦配置 (V2.0 Final)
// 唯一真理：PM2 只管 bridge.js，隧道由 bridge.js 內部 startPinggyDaemon() 自主管理
// ============================================================================
const path = require('path');
const WORKSPACE = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../../../../');

module.exports = {
  apps: [
    {
      name: "line-bridge",
      script: "bridge.js",
      cwd: __dirname,
      interpreter: "node",
      
      // 🛡️ 高可用性核心
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      restart_delay: 3000,
      
      // 🛡️ 殭屍免疫機制 (Graceful Shutdown)
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      
      // 🛡️ 記憶體洩漏保護
      max_memory_restart: "300M",
      
      // 環境變數注入
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        WORKSPACE_ROOT: WORKSPACE,
        MAX_QUEUE_SIZE: 1000  // 降級癱瘓保護
      },
      
      // 日誌管理
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: path.join(WORKSPACE, "Data", "logs", "bridge_err.log"),
      out_file: path.join(WORKSPACE, "Data", "logs", "bridge_out.log"),
      merge_logs: true,
      
      watch: false,
      ignore_watch: ["node_modules", "public", "*.log"]
    }
  ]
};
