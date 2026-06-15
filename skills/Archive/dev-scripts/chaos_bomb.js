'use strict';
const { spawn } = require('child_process');
const path = require('path');

const ROUTER_PATH = path.resolve(__dirname, 'skills/01_Orchestrators/subagent-collaboration-skill/run.js');

console.log("🚀 [Red Team] 啟動 V3.2.0 混沌轟炸機 (Chaos Bomb)...");
console.log("🎯 目標: 實體路由引擎 (stdin 模式) | 總彈藥: 50 發\n");

const payloads = [];

// 1. 併發鎖定攻擊 (10發) - 真實非同步併發
for(let i=0; i<10; i++) {
  payloads.push({ type: 'concurrent', data: `[SYSTEM-CALL: 02_Cognitive/lock-target | PAYLOAD: {"test": "concurrency_${i}"}]` });
}

// 2. 畸形 JSON 攻擊 (10發) - 破壞解析器
const badJsons = ['{', '}', '{"a": 1', '{"b": "c"', 'undefined', 'null', 'NaN', '{"bad": \\n}', '{"x": "\\\'y\\\'"}', '"{""""}"'];
badJsons.forEach(bad => payloads.push({ type: 'sync', data: `[SYSTEM-CALL: 03_Execution/dummy | PAYLOAD: ${bad}]` }));

// 3. Cognitive 越權污染 (10發) - 塞入不該出現的技術參數
for(let i=0; i<10; i++) {
  payloads.push({ type: 'sync', data: `[SYSTEM-CALL: 02_Cognitive/thinker | PAYLOAD: {"objective": "plan", "sql_query": "DROP TABLE users;", "bash_command": "rm -rf /"}]` });
}

// 4. Execution 越權污染 (10發) - 塞入不該出現的情緒參數
for(let i=0; i<10; i++) {
  payloads.push({ type: 'sync', data: `[SYSTEM-CALL: 03_Execution/worker | PAYLOAD: {"action": "build", "tone": "angry", "persona": "hacker", "emotion": "sad"}]` });
}

// 5. 空值與邊界攻擊 (10發) - 挑戰 Regex 極限
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
boundaries.forEach(b => payloads.push({ type: 'sync', data: b }));

let successBlocked = 0;
let systemCrashed = 0;

// 執行單發攻擊 (透過 stdin)
function fire(payloadData) {
  return new Promise((resolve) => {
    const child = spawn('node', [ROUTER_PATH]);
    let out = '', err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    
    // 透過 stdin 寫入 Payload
    child.stdin.write(payloadData);
    child.stdin.end();

    child.on('close', () => {
      if (out.includes('[SYSTEM-RETURN: FAILED') || out.includes('Failed to start') || err.includes('Error') || out.includes('Invalid') || out.includes('size exceeded')) {
        successBlocked++;
      } else {
        systemCrashed++;
      }
      resolve();
    });
  });
}

async function runAll() {
  console.log("🔥 開始進行 50 連發物理轟炸...\n");
  
  // 第一波：10 發真實併發攻擊 (模擬高併發搶鎖)
  const concurrentPayloads = payloads.filter(p => p.type === 'concurrent').map(p => fire(p.data));
  await Promise.all(concurrentPayloads);
  
  // 第二波：40 發序列攻擊 (邊界與污染測試)
  for (const p of payloads.filter(p => p.type === 'sync')) {
    await fire(p.data);
  }

  console.log("========================================");
  console.log("🛡️ 《V3.2.0 混沌工程戰損報告》");
  console.log(`總攻擊次數 : 50 次`);
  console.log(`成功防禦/攔截: ${successBlocked} 次`);
  console.log(`系統異常崩潰 : ${systemCrashed} 次 (若大於0代表防禦被突破)`);
  console.log("========================================");

  // 驗證死信佇列
  try {
    const { pool } = require('./Modules/db_state_manager.js');
    const res = await pool.query('SELECT COUNT(*) FROM watchdog_pending_optimizations');
    console.log(`📊 戰後驗證：死信佇列目前已記錄 ${res.rows[0].count} 筆異常攔截事件。`);
    await pool.end();
  } catch(e) {
    console.log('無法連線驗證 DB 或無死信佇列:', e.message);
  }
}

runAll();
