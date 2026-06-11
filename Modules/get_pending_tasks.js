/**
 * get_pending_tasks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 本協作系統 V3.2.0 — CLI 輔助工具
 * 用途：供 00_Master_Menu.ps1 查詢 Neon DB 中的 pending tasks。
 * 輸出格式：JSON
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { pool } = require('./db_state_manager');

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, priority, task_data, created_at, retry_count
      FROM watchdog_pending_optimizations
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
    `);
    
    // Output JSON for PowerShell to parse
    console.log(JSON.stringify(res.rows));
    process.exit(0);
  } catch (err) {
    console.error('[]');
    process.exit(1);
  }
}

main();
