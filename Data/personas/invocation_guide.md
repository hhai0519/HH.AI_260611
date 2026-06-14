# 認知顧問 (Personas) 對接與呼叫指南

這份檔案規範了在 Loki Swarm (Shannon v0.4.0) 架構中，系統大腦與各個代理人該如何安全且無縫地呼叫存放於此 `Data/personas/` 目錄下的思維模型。

## 1. 架構定位 (Configuration as Context)

這個資料夾中的 15+ 位人物（如馬斯克、賈伯斯），**不是獨立執行的代理人 (Agents)**，而是純粹的 **「設定檔與上下文 (Configuration Data)」**。
這樣的解耦設計確保了無限的橫向擴充能力（Zero-config extension）——未來若要新增顧問，只需將 Markdown 放進此資料夾即可，系統不需修改任何程式碼。

## 2. 如何在總管層 (Orchestrators) 呼叫？

當主大腦 `global-workspace` 或 `subagent-collaboration-skill` 正在執行 ReCAP 遞迴任務拆解時，若判斷某個子任務需要套用特定人物的思維模式：

**作法：**
在傳遞給下級 Action Agent 或 Cognitive Agent 的任務 Payload 中，夾帶標準的 **Persona Target** 屬性：
```json
{
  "task": "分析特斯拉最新的產品線佈局",
  "persona_target": "elon-musk"
}
```
引擎會自動將 `persona_target` 對映為 `Data/personas/elon-musk-perspective/SKILL.md`。

## 3. 認知引擎 (Cognitive) 如何處理它？

當帶有 `persona_target` 的任務進入 Cognitive 層時：
1. **Dynamic Tool Synthesizer (動態工具合成器)** 攔截到此需求。
2. 透過 `Persona Knowledge MCP` 讀取對應的人物 Markdown 檔案與參考資料。
3. 執行 **Knowledge Compilation (知識編譯)**：將該顧問的思維框架與 Prompt 編譯為一個可執行的虛擬工具（或動態 Context Package）。
4. 將編譯後的思維注入給最終執行的 Agent。

## 4. 執行代理人 (Actions) 的合規設定

所有的 `05_Actions` 技能（如 `investment-aggregator`、`market-researcher`），在它們的 `SKILL.md` 配置中，必須宣告具備 `"Persona Knowledge MCP"` 的授權，才能合法接收被編譯的顧問知識。

## 5. 自主蒸餾與學習引擎 (Autonomous Distillation)

這套系統具備**自我擴展能力**。當使用者需要系統中尚未存在的專家時：
1. **呼叫與分發**：使用者向 `global-workspace` 總管提出要求（例如：「幫我蒸餾黃仁勳的思維」）。
2. **Cognitive Distiller 接手**：總管會啟動 `skills/02_Cognitive/persona-distiller`。它會透過 Child Workflows 平行收集該人物的著作、對話與他者評價。
3. **品質閘門 (SMARt Validation)**：收集完畢後，系統會利用 Reflection 與 Debate 模式進行自我批判與多方評審。只有在多個 Agent 達成共識 (`disagree = 0`) 時，才會認定心智模型提煉成功。
4. **熱加載上線**：蒸餾器會自動將格式化好的 Markdown 寫入本目錄 `Data/personas/[name]-perspective/`。下一秒，全網所有 Agent 皆可立即透過 `persona_target` 調閱，無需重新啟動系統。

---
> [!NOTE]  
> 只要遵循這套 Universal Docking Protocol，整個系統就能自由切換大腦，擁有頂尖專家的思考維度！
