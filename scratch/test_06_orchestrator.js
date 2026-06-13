const { spawnSync } = require('child_process');
const path = require('path');

const targetScript = path.resolve(__dirname, '../skills/06_股票分析與量化層_Stock_Analysis/stock-orchestrator-skill/run.js');

const payload = {
    objective: "分析鉅祥的財報與籌碼動向，請給我投資建議。",
    target_audience: "投資人",
    tone_variables: "專業且保守"
};

console.log("=== 正在測試 06_股票分析與量化層_Stock_Analysis/stock-orchestrator-skill ===");
console.log("Input Payload:", payload);
console.log("--------------------------------------------------------------------------------");

const child = spawnSync('node', [targetScript, JSON.stringify(payload)], {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 600000 // 10 minutes timeout for LLM
});

if (child.error) {
    console.error("執行發生錯誤:", child.error);
} else {
    console.log("STDOUT 輸出:");
    console.log(child.stdout);
    if (child.stderr) {
        console.error("STDERR 輸出:");
        console.error(child.stderr);
    }
}
