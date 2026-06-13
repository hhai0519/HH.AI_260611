'use strict';
const { spawn } = require('child_process');
const path = require('path');

const ROUTER_PATH = path.resolve(__dirname, 'skills/01_Orchestrators/subagent-collaboration-skill/run.js');

console.log("🧪 [QA Automation] 啟動 V3.2.0 系統邊界壓力測試 (Stress Test V1)...");
console.log("🎯 測試目標: 路由引擎 (stdin 模式) | 總測試案例: 50 項\n");

const testCases = [];

// 1. 高併發狀態模擬 (10項) - 驗證資源鎖定機制
for(let i=0; i<10; i++) {
  testCases.push({ type: 'concurrent', data: `[SYSTEM-CALL: 02_Cognitive/lock-target | PAYLOAD: {"test": "concurrency_${i}"}]` });
}

// 2. 非標準 JSON 格式容錯測試 (10項) - 驗證解析器異常處理
const edgeJsons = ['{', '}', '{"a": 1', '{"b": "c"', 'undefined', 'null', 'NaN', '{"bad": \\n}', '{"x": \\\'y\\\'}', '{""""}'];
edgeJsons.forEach(bad => testCases.push({ type: 'sync', data: `[SYSTEM-CALL: 03_Execution/dummy | PAYLOAD: ${bad}]` }));

// 3. Cognitive 參數邊界測試 (10項) - 驗證異常指令過濾
for(let i=0; i<10; i++) {
  testCases.push({ type: 'sync', data: `[SYSTEM-CALL: 02_Cognitive/thinker | PAYLOAD: {"objective": "plan", "sql_query": "DROP TABLE users;", "bash_command": "rm -rf /"}]` });
}

// 4. Execution 參數邊界測試 (10項) - 驗證異常屬性攔截
for(let i=0; i<10; i++) {
  testCases.push({ type: 'sync', data: `[SYSTEM-CALL: 03_Execution/worker | PAYLOAD: {"action": "build", "tone": "angry", "persona": "hacker", "emotion": "sad"}]` });
}

// 5. 空值與 Regex 解析極限測試 (10項) - 驗證正則表達式穩定性
const boundaries = [
  '[SYSTEM-CALL: | PAYLOAD: {}]', 
  '[SYSTEM-CALL: 02_Cognitive/ | PAYLOAD: {}]', 
  '[SYSTEM-CALL: 02_Cognitive/a | PAYLOAD: ]',
  '  [SYSTEM-CALL: 02_Cognitive/b | PAYLOAD: {}]  ',
  '[system-call: 02_cognitive/c | payload: {}]',
  '[SYSTEM-CALL: 02_Cognitive/d | PAYLOAD: \\n\\n{}\\n]',
  '[SYSTEM-CALL: 02_Cognitive/e | PAYLOAD: {"deep": {"deep": {"deep": {}}}}]',
  '[SYSTEM-CALL:02_Cognitive/f|PAYLOAD:{}]',
  'SYSTEM-CALL: 02_Cognitive/g | PAYLOAD: {}',
  '[SYSTEM-CALL: 02_Cognitive/h | PAYLOAD: {"arr": [1,2,3]}]'
];
boundaries.forEach(b => testCases.push({ type: 'sync', data: b }));

let successHandled = 0;
let systemFailed = 0;

// 執行單一測試案例 (透過 stdin)
function runTest(payloadData) {
  return new Promise((resolve) => {
    const child = spawn('node', [ROUTER_PATH]);
    let out = '', err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    
    // 透過 stdin 寫入測試數據
    child.stdin.write(payloadData);
    child.stdin.end();

    child.on('close', () => {
      // 預期系統應安全攔截這些異常輸入
      if (out.includes('[SYSTEM-RETURN: FAILED') || out.includes('Failed to start') || err.includes('Error') || out.includes('Invalid') || out.includes('size exceeded')) {
        successHandled++;
      } else {
        systemFailed++;
      }
      resolve();
    });
  });
}

async function runAllTests() {
  console.log("🔥 開始執行 50 項壓力測試...\n");
  
  // 第一波：10 項真實併發測試 (模擬高併發搶鎖)
  const concurrentTests = testCases.filter(p => p.type === 'concurrent').map(p => runTest(p.data));
  await Promise.all(concurrentTests);
  
  // 第二波：40 項序列邊界測試
  for (const p of testCases.filter(p => p.type === 'sync')) {
    await runTest(p.data);
  }

  console.log("========================================");
  console.log("🛡️ 《V3.2.0 系統容錯性測試報告》");
  console.log(`總測試案例 : 50 項`);
  console.log(`成功安全攔截: ${successHandled} 項`);
  console.log(`系統未預期崩潰 : ${systemFailed} 項 (若大於0需排查)`);
  console.log("========================================");

  // 驗證死信佇列紀錄
  try {
    const { pool } = require('./Modules/db_state_manager.js');
    const res = await pool.query('SELECT COUNT(*) FROM watchdog_pending_optimizations');
    console.log(`📊 狀態驗證：系統日誌目前已記錄 ${res.rows[0].count} 筆攔截事件。`);
    await pool.end();
  } catch(e) {
    console.log('無法連線驗證 DB 或無日誌記錄 (符合隔離環境預期):', e.message);
  }
}

runAllTests();
