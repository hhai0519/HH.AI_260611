const { spawnSync } = require('child_process');
const path = require('path');

const targetScript = path.resolve(__dirname, '../skills/04_大腦認知分析層_Cognitive/json-to-flex-renderer/run.js');

const sampleJsonOutput = {
  "summary": "這是一份模擬的總管彙整報告。從鉅祥的財報與籌碼動向來看，目前的表現符合市場預期。",
  "details": {
    "financial-analyst": {
      "analysis": "financial-analyst 分析完成",
      "key_insights": [
        "指標正常",
        "符合預期"
      ]
    },
    "pe-river-map": {
      "analysis": "pe-river-map 分析完成",
      "key_insights": [
        "本益比偏低",
        "位於河流圖安全區間"
      ]
    }
  },
  "conclusions": [
    "這是一項值得投資的標的 (Mock)",
    "建議分批佈局，降低短期波動風險"
  ]
};

console.log("=== 正在測試 04_大腦認知分析層_Cognitive/json-to-flex-renderer ===");
console.log("Input JSON Payload:");
console.dir(sampleJsonOutput, { depth: null });
console.log("--------------------------------------------------------------------------------");

const child = spawnSync('node', [targetScript, JSON.stringify(sampleJsonOutput)], {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 10000 
});

if (child.error) {
    console.error("執行發生錯誤:", child.error);
} else {
    console.log("STDOUT 輸出 (Flex Message JSON):");
    console.log(child.stdout);
    
    if (child.stderr) {
        console.error("STDERR 輸出:");
        console.error(child.stderr);
    }
}
