# 認知顧問 (Personas) 對接與調用指南

這份文件規範了在 Loki Swarm (Shannon v0.4.0) 架構中，系統大腦與各個代理人該如何安全且無縫地調用存放於此 `Data/personas/` 目錄下的思維模型。

## 1. 架構定位 (Configuration as Context)

這個資料夾中的 15+ 位人物（如馬斯克、賈伯斯），**不是獨立運行的代理人 (Agents)**，而是純粹的 **「設定檔與上下文 (Configuration Data)」**。
這樣的解耦設計確保了無限的橫向擴充能力（Zero-config extension）——未來若要新增顧問，只需將 Markdown 放進此資料夾即可，系統不需修改任何程式碼。

## 2. 如何在總管層 (Orchestrators) 調用？

當主大腦 `global-workspace` 或 `subagent-collaboration-skill` 正在執行 ReCAP 遞迴任務拆解時，若判斷某個子任務需要套用特定人物的思維模式：

**作法：**
在傳遞給下級 Action Agent 或 Cognitive Agent 的任務 Payload 中，夾帶標準的 **Persona Target** 屬性：
```json
{
  "task": "分析特斯拉最新的產品線佈局",
  "persona_target": "elon-musk"
}
```
引擎會自動將 `persona_target` 映射為 `Data/personas/elon-musk-perspective/SKILL.md`。

## 3. 認知引擎 (Cognitive) 如何處理它？

當帶有 `persona_target` 的任務進入 Cognitive 層時：
1. **Dynamic Tool Synthesizer (動態工具合成器)** 攔截到此需求。
2. 透過 `Persona Knowledge MCP` 讀取對應的人物 Markdown 文件與參考資料。
3. 執行 **Knowledge Compilation (知識編譯)**：將該顧問的思維框架與 Prompt 編譯為一個可執行的虛擬工具（或動態 Context Package）。
4. 將編譯後的思維注入給最終執行的 Agent。

## 4. 執行代理人 (Actions) 的合規設定

所有的 `05_Actions` 技能（如 `investment-aggregator`、`market-researcher`），在它們的 `SKILL.md` 配置中，必須宣告具備 `"Persona Knowledge MCP"` 的授權，才能合法接收被編譯的顧問知識。

---
> [!NOTE]  
> 只要遵循這套 Universal Docking Protocol，整個系統就能自由切換大腦，擁有頂尖專家的思考維度！
