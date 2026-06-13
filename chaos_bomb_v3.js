'use strict';
const { spawn } = require('child_process');
const path = require('path');

const ROUTER_PATH = path.resolve(__dirname, 'skills/01_Orchestrators/subagent-collaboration-skill/run.js');

console.log("🌌 [Red Team] 啟動 V3.2.0 混沌轟炸機 V3 (深淵測試 - stdin 併發版)...");
console.log("🎯 目標: 實體路由引擎 | 總彈藥: 50 發 (毫秒級併發)\n");

const payloads = [];

// 1. 編碼幻覺與 BOM 污染 (Encoding & BOM Pollution) - 10發
payloads.push(`[SYSTEM-CALL: 0２_Cognitive/t | PAYLOAD: {}]`); 
payloads.push(`\u202E[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {"test": "\uD83D"}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {"a\u200Db": 1}]`); 
payloads.push(`\uFEFF\uFEFF\uFEFF[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 02_ℂognitive/t | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {"flag": "🇹🇼"}]`); 
payloads.push(`[SYSTEM-CALL:\v02_Cognitive/t\f| PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t${" ".repeat(1000)}| PAYLOAD: {}]`); 
payloads.push(`[sYsTeM-cAlL: 02_CoGnItIvE/t | PaYlOaD: {}]`); 

// 2. JSON 規範漏洞 (JSON Specification Abuse) - 10發
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"a": 1, "a": 2, "a": 3}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"a": NaN}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"a": Infinity}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"big": 999999999999999999999999999999999}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"\\"k\\"": 1}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"k": "line\nbreak"}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"arr": [1, , 3]}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"a": 1,}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {'a': 1}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"constructor": "Array"}]`); 

// 3. OS 保留字與引數走私 (OS Reserved & Argument Smuggling) - 10發
payloads.push(`[SYSTEM-CALL: --eval | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: --inspect=127.0.0.1:9229 | PAYLOAD: {}]`);
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/skill" --version " | PAYLOAD: {}]`);
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/skill.js -e "console.log(1)" | PAYLOAD: {}]`);
payloads.push(`[SYSTEM-CALL: CON | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: PRN | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: AUX | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: NUL | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: COM1 | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: LPT1 | PAYLOAD: {}]`); 

// 4. 正則錯視與解析失步 (Regex Illusion & Parsing Desync) - 10發
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {}] [SYSTEM-CALL: 03/x | PAYLOAD: {"a":1}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"a": "[SYSTEM-CALL: 03/x | PAYLOAD: {}]"}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t ||| PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"str": "]"}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: ""]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: 123]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/t | PAYLOAD: {"a":[[[[[[[[[[[[1]]]]]]]]]]]]}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/skill. | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 04_大腦認知分析層_Cognitive/skill  | PAYLOAD: {}]`); 

// 5. 執行層級豁免混淆 (Tier Exemption Confusion) - 10發
payloads.push(`[SYSTEM-CALL: 02_Cognitive/../03_Execution/worker | PAYLOAD: {"tone": "angry"}]`); 
payloads.push(`[SYSTEM-CALL: 03_Execution/../02_Cognitive/thinker | PAYLOAD: {"sql_query": "DROP"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/03_Execution/mix | PAYLOAD: {}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive\\03_Execution | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {"sql_query": "SELECT", "tone": "angry"}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {"__proto__": {"sql_query": "DROP"}}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/skill#hash | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/skill?query=1 | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: //02_Cognitive//skill// | PAYLOAD: {}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t | PAYLOAD: {"a": 1} | EXTRA: trash]`); 

let successBlocked = 0;
let systemCrashed = 0;

console.log("🔥 系統鎖定：全非同步齊射發射中 (50 個進程同毫秒透過 stdin 甦醒)...\\n");

const promises = payloads.map((payload, index) => {
  return new Promise((resolve) => {
    // 移除取代 Null Byte 的邏輯。透過 stdin，我們可以直接將原始的惡意字元流注入 Node.js 進程
    try {
      const child = spawn('node', [ROUTER_PATH]);
      let out = '';
      let err = '';

      child.stdout.on('data', data => out += data.toString());
      child.stderr.on('data', data => err += data.toString());

      // 實體寫入 stdin 緩衝區
      child.stdin.write(payload);
      child.stdin.end();

      child.on('close', code => {
        // 增加攔截條件，涵蓋解析異常與 Invalid Payload
        if (out.includes('[SYSTEM-RETURN: FAILED') || out.includes('Failed to start') || err.includes('Error') || err.includes('Warning') || out.includes('Invalid') || err.includes('size exceeded') || err.includes('SyntaxError')) {
          successBlocked++;
        } else {
          systemCrashed++;
          console.log(`[防禦突破] Payload ${index+1} 未被正確攔截！輸出:`, out.substring(0, 100));
        }
        resolve();
      });
    } catch (spawnErr) {
      console.log(`[啟動攔截/崩潰] Payload ${index+1} spawn() 同步拋出: ${spawnErr.code}`);
      successBlocked++;
      resolve();
    }
  });
});

Promise.all(promises).then(() => {
  console.log("========================================");
  console.log("🛡️ 《V3.2.0 混沌工程 V3 戰損報告 (深淵測試)》");
  console.log(`總攻擊次數 : 50 次`);
  console.log(`成功防禦/攔截: ${successBlocked} 次`);
  console.log(`系統異常崩潰 : ${systemCrashed} 次 (若大於0代表防禦被突破)`);
  console.log("========================================");

  try {
    const { pool } = require('./Modules/db_state_manager.js');
    pool.query('SELECT COUNT(*) FROM watchdog_pending_optimizations').then(res => {
      console.log(`📊 戰後驗證：死信佇列總數已達 ${res.rows[0].count} 筆。`);
      pool.end();
    }).catch(e => console.log('無法連線驗證 DB (符合去識別化預期):', e.message));
  } catch (err) {
    console.log('無法載入 db_state_manager:', err.message);
  }
});
