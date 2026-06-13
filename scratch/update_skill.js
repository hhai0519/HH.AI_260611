const fs = require('fs');

// 1. Update SKILL.md
let content = fs.readFileSync('skills/05_自動化業務行動層_Actions/ui-prototype-builder/SKILL.md', 'utf8');
content = content.replace(/^\uFEFF+/, ''); // Remove BOM

content = content.replace(/name: claude-canva-design/, 'name: ui-prototype-builder');
if (!content.includes('type: "execution"')) {
  content = content.replace(/description: (.*)/, 'description: $1\ntype: "execution"\ncapabilities:\n  tool_category: "Web & UI Prototyping, Animation, Canvas Design"\n  execution_env: "HTML/React (Standalone), Node.js, Playwright"\n  io_format: "HTML, MP4, GIF, PDF, PPTX"');
}

if (!content.includes('### 【摘要】觸發條件與 DLP 聲明')) {
  content = content.replace(/# Claude Design/, '# Claude Design\n\n### 【摘要】觸發條件與 DLP 聲明\n- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議');
}

if (!content.includes('【系統通訊層宣告 (System Comms Layer)】')) {
  content += `

---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
\`[SYSTEM-CALL: ui-prototype-builder | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]\`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 \`Execution\` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
\`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]\` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 \`[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]\`。
`;
}

fs.writeFileSync('skills/05_自動化業務行動層_Actions/ui-prototype-builder/SKILL.md', content, 'utf8');

// 2. Update Manifest
const manifestPath = 'Data/00_Skill_Manifest.json';
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest['ui-prototype-builder'] = {
  "description": "Claude Design——用HTML做高保真原型、互動Demo、幻燈片、動畫、設計變體探索的一體化設計能力。",
  "version": "1.4.0",
  "type": "skill",
  "path": "./skills/05_自動化業務行動層_Actions/ui-prototype-builder/SKILL.md",
  "capabilities": {}
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

// 3. Update Translations
const translationsPath = 'Data/skill_translations.json';
let trans = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
if (!trans.translations.find(t => t.name === 'ui-prototype-builder')) {
  trans.translations.push({
    "name": "ui-prototype-builder",
    "folder_path": "05_自動化業務行動層_Actions/ui-prototype-builder",
    "layer": "05_自動化業務行動層_Actions",
    "aliases": [
      "claude-design",
      "claude-canva-design",
      "互動原型",
      "HTML演示",
      "設計變體"
    ]
  });
  trans._total_skills = trans.translations.length;
  fs.writeFileSync(translationsPath, JSON.stringify(trans, null, 2), 'utf8');
}
