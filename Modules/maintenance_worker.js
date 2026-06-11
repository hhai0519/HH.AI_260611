/**
 * maintenance_worker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 本協作系統 V3.2.0 — 維護排程器（Database Worker 重構版）
 * 落地路徑：Modules/maintenance_worker.js
 *
 * V3.2.0 重構摘要：
 *   - 徹底廢除本地 JSON 讀取機制（舊 Data/Pending_Optimization.json）
 *   - 改採 Neon PostgreSQL 佇列，使用 FOR UPDATE SKIP LOCKED 防驚群效應
 *   - 死信佇列防護：retry_count >= 5 自動標記 FAILED（防無窮重試）
 *   - 空閒休眠：佇列清空時休眠 5 秒，避免資料庫連線轟炸
 *   - 依賴 db_state_manager.js 的共享連線池
 *
 * 執行方式：
 *   node Modules/maintenance_worker.js
 *   或由 Modules/Start-Maintenance.ps1 喚醒
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path = require('path');

// ── 環境變數載入（優先讀取 .env.local） ──────────────────────────────────────
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env.local'),
});

const { pool, initDB } = require('./db_state_manager');

// ── 常數設定 ───────────────────────────────────────────────────────────────────
const IDLE_SLEEP_MS    = 5_000;  // 佇列為空時的休眠間隔
const ERROR_SLEEP_MS   = 5_000;  // 嚴重錯誤後的退避間隔
const BATCH_SIZE       = 10;     // 每批次最多處理筆數
const MAX_RETRY_COUNT  = 4;      // 達此次數後標記 FAILED（第 5 次失敗觸發）

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ══════════════════════════════════════════════════════════════════════════════
// § 1  Mock 任務處理（未來替換為實際 sys-reflection-module 調用）
// ══════════════════════════════════════════════════════════════════════════════

/**
 * processTask(row)
 * 目前為 Mock 實作，構建標準化 Payload 並印出日誌。
 * 未來接駁：替換為 MCP invoke 或 HTTP call 至 sys-reflection-module。
 *
 * @param {Object} row - watchdog_pending_optimizations 資料列
 */
async function processTask(row) {
  const payload = {
    dispatch_id  : `maint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source       : 'maintenance_worker@v3.2.0',
    target_skill : 'sys-reflection-module',
    dispatched_at: new Date().toISOString(),
    anomaly      : {
      db_id      : row.id,
      priority   : row.priority,
      task_data  : row.task_data,
      retry_count: row.retry_count,
      created_at : row.created_at,
    },
    instructions : [
      '分析異常根因',
      '比對 SOP_00_Skill_Lifecycle_Management.md 相關條款',
      '提出修復建議並寫入 task.md',
    ],
  };

  // Mock：印出結構化 Payload（未來替換為實際調用）
  if (process.env.DEBUG === 'true') {
    console.log(
      `[maintenance_worker] 📤 [MOCK] 派發至 sys-reflection-module：\n` +
      JSON.stringify(payload, null, 2)
    );
  }

  // 模擬非同步處理延遲
  await sleep(50);
}

// ══════════════════════════════════════════════════════════════════════════════
// § 2  核心 Worker 迴圈
// ══════════════════════════════════════════════════════════════════════════════

async function runWorker() {
  if (process.env.DEBUG === 'true') {
    console.log('═'.repeat(70));
    console.log('[maintenance_worker] 🚀 維護排程器啟動 (Database Worker V3.2.0)');
    console.log(`[maintenance_worker] 時間戳：${new Date().toISOString()}`);
    console.log('═'.repeat(70));
  }

  // 確保資料表存在（冪等性初始化）
  await initDB();

  while (true) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // ── SKIP LOCKED 拉取機制（防驚群效應）──────────────────────────────────
      // FOR UPDATE SKIP LOCKED：跳過其他 Worker 已鎖定的列，
      // 確保多個 Worker 實例不會搶奪同一筆任務。
      // ORDER BY priority DESC（MEDIUM > LOW）確保中優先級優先處理。
      const res = await client.query(`
        SELECT *
        FROM watchdog_pending_optimizations
        WHERE status = 'PENDING'
          AND priority IN ('LOW', 'MEDIUM')
        ORDER BY
          CASE priority WHEN 'MEDIUM' THEN 1 WHEN 'LOW' THEN 2 ELSE 3 END,
          created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $1
      `, [BATCH_SIZE]);

      // ── 空閒休眠機制 ──────────────────────────────────────────────────────────
      if (res.rows.length === 0) {
        await client.query('COMMIT');
        client.release();
        if (process.env.DEBUG === 'true') {
          console.log(
            `[maintenance_worker] 💤 佇列為空，休眠 ${IDLE_SLEEP_MS / 1000}s...`
          );
        }
        await sleep(IDLE_SLEEP_MS);
        continue;
      }

      if (process.env.DEBUG === 'true') {
        console.log(
          `[maintenance_worker] 🎯 本批次取得 ${res.rows.length} 筆任務（SKIP LOCKED 模式）`
        );
      }

      // ── 逐筆處理 ──────────────────────────────────────────────────────────────
      for (const row of res.rows) {
        try {
          if (process.env.DEBUG === 'true') {
            console.log(
              `[maintenance_worker] ⚙️  處理任務 ID: ${row.id} ` +
              `| priority: ${row.priority} | retry: ${row.retry_count}`
            );
          }

          await processTask(row);

          // 處理成功：標記 RESOLVED
          await client.query(`
            UPDATE watchdog_pending_optimizations
            SET status            = 'RESOLVED',
                last_attempted_at = NOW()
            WHERE id = $1
          `, [row.id]);

          if (process.env.DEBUG === 'true') console.log(`[maintenance_worker] ✅ 任務 ID: ${row.id} 標記為 RESOLVED`);

        } catch (taskErr) {
          console.error(
            `[maintenance_worker] ❌ 任務 ID: ${row.id} 處理失敗：`,
            taskErr.message
          );

          // ── 死信佇列防護（Dead-Letter Queue）─────────────────────────────────
          // retry_count 達到 MAX_RETRY_COUNT 後自動標記 FAILED，
          // 防止無窮重試耗盡系統資源。
          await client.query(`
            UPDATE watchdog_pending_optimizations
            SET retry_count       = retry_count + 1,
                last_attempted_at = NOW(),
                status = CASE
                  WHEN retry_count >= $1 THEN 'FAILED'
                  ELSE 'PENDING'
                END
            WHERE id = $2
          `, [MAX_RETRY_COUNT, row.id]);

          const newRetryCount = row.retry_count + 1;
          if (newRetryCount > MAX_RETRY_COUNT) {
            if (process.env.DEBUG === 'true') {
              console.warn(
                `[maintenance_worker] ☠️  任務 ID: ${row.id} 已達最大重試次數 ` +
                `(${MAX_RETRY_COUNT})，標記為 FAILED（死信佇列）`
              );
            }
          }
        }
      }

      await client.query('COMMIT');

    } catch (err) {
      // 嚴重錯誤：整批次 ROLLBACK 並退避
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error(
        `[maintenance_worker] 💥 Worker 執行週期發生嚴重錯誤，` +
        `ROLLBACK 並退避 ${ERROR_SLEEP_MS / 1000}s：`,
        err.message
      );
      await sleep(ERROR_SLEEP_MS);

    } finally {
      // 確保連線歸還至 Pool
      try { client.release(); } catch (_) {}
    }
  }
}

// ── 執行入口 ───────────────────────────────────────────────────────────────────
runWorker().catch(err => {
  console.error('[maintenance_worker] 💥 未捕獲的致命錯誤，Worker 中止：', err);
  process.exit(1);
});
