---
name: gemma-4-api
type: execution

version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "AI/LLM"
  execution_env: "Python/REST"
  io_format: "JSON/Stream"
---

# Gemma 4 API：設定與 SOP 技能 (Setup & SOP Skill)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

## 概覽 (Overview)
本技能 (Skill) 定義了在 本協作系統 平臺或任何透過 Gemini API 存取 **Gemma 4 (26B/31B)** 系列模型時的標準作業程式 (SOP) 與防坑指南。當使用者要求串接 Gemma 4 服務、建立 AI 助理或處理 API Rate Limit 錯誤時，應優先遵循此技能指引。

## 一、 模型與核心設定 (Models & Core Configurations)

由於 Gemma 4 是部署在 Google AI Studio 供免費呼叫，請依照以下標準步驟進行設定：

1. **獲取 API Key**：導引至 Google AI Studio 產生 API Key。
2. **選用正確的模型 ID**：
   - `gemma-4-31b-it`：適用於數學推理、深度程式碼審閱等**高精度任務**。
   - `gemma-4-26b-a4b-it`：適用於工具呼叫 (Tool use)、即時對話等**低延遲任務**。
3. **配額認知 (Free Tier)**：
   - 限制基準為**每分鐘約 15 RPM**，**每天約 1,500 RPD**。
   - 配額是繫結 **Google Cloud 專案 (Project)**，而非單一 API 金鑰。

## 二、 開發環境與 SDK 實作 (SDK Implementation)

一律優先使用最新的 Python `google-genai` SDK，而非舊版的 `google-generativeai`。

```python
from google import genai
from google.genai import types

# 初始化客戶端 (環境變數需包含 GEMINI_API_KEY)
client = genai.Client()

# 基本呼叫
response = client.models.generate_content(
    model="gemma-4-26b-a4b-it",
    contents="Hello Gemma!"
)
```

## 三、 進階特性實務 (Advanced Features)

### 1. Function Calling (JSON Schema 設計)
Gemma 4 內建工具呼叫能力。為避免 MoE (26B) 模型可能產生的格式錯誤，需極力確保 JSON Schema 嚴謹：
- 必須定義為 `function_declarations`，並由 `types.GenerateContentConfig(tools=[...])` 傳入。
- **嚴格驗證**：若使用 `gemma-4-26b-a4b-it` 產出 JSON 時發生錯誤，建議在送出前先進行自訂的 3-stage 格式檢查，或降級至更穩定的 `gemma-4-31b-it`。

### 2. 思考模式 (Thinking Mode)
若需要啟用 Gemma 4 的強大推理能力：
```python
config = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(thinking_level="high")
)
```
- **極重要警告**：在多輪對話中，**絕對不能**將前一次 `<|channel>thought` ... `<channel|>` 區塊內的思考內容傳回給模型。歷史紀錄「只能包含最終答案」，否則會嚴重浪費 Token 並造成邏輯錯亂。

### 3. 多模態 (Vision Token Budget)
遇到圖片輸入時，依據任務選擇對應的 Token 預算以最佳化成本與速度：
- 一般場景分類/影片理解：`70` ~ `280` tokens
- 檔案 OCR / 微小字型 / UI 解析：`1120` tokens

## 四、 避坑指南：解決 429 Rate Limit (Mitigating Resource Exhaustion)

當發生 `429 RESOURCE_EXHAUSTED` 錯誤時，採取以下步驟排解：

1. **專案隔離**：檢查是否有多個指令碼、Web App 同時共用同一個 Google Cloud 專案的 API Key。若是，請將高頻工作負載拆分至不同專案。
2. **指數退避演演算法 (Exponential Backoff + Jitter)**：程式碼層次在發出 API 請求時，必須實作重試與亂數抖動等候機制，以免「雪崩效應」使限流更加嚴重。
3. **防範格式錯誤損耗配額**：即便是送出引發 400 或 500 的錯誤請求（例如 Schema 寫錯），依然會被計算在 RPD 與 RPM 額度內。確保請求在客戶端先過 validation。

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: gemma-4-api | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知引數。

傳送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。

---
> [!WARNING]
> **全域鐵律：NotebookLM 研究遵從指示**
> 1. 當任務指示「透過 NotebookLM 進行研究/查詢」時，必須嚴格呼叫 `notebooklm` 相關 MCP 工具。
> 2. 若遇到無法連線、憑證過期 (`auth_status: stale` 或 `Authentication expired`) 等錯誤時，**絕對禁止**未經同意自行改用常規網路搜尋 (Web Search) 或其他工具替代。
> 3. 遇到錯誤時，請**立刻中斷動作並主動告知使用者**，請使用者協助登入或修復連線後，再繼續研究任務。
