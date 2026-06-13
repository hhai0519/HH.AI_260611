# Session 透明度與跨工作階段狀態追蹤

靈感來源：
1. Claude Code statusline 文章（2026-04）：「Claude 什麼都知道，只是不主動告訴你」
2. 官方 Claude Design 系統提示詞：`snip` 工具的脈絡管理概念

## 核心哲學

**主動揭露，而非被動等待。** 設計任務的複雜度、已完成的進度、還缺什麼資產——這些資訊 Claude 都知道，但不會自動說出來。這份指南規定在工作流的關鍵節點主動把資訊浮出來。

---

## 開工前：複雜度預估（必做）

接到任務後、問 clarifying questions 之前，先做一次快速複雜度預估，主動告訴使用者：

```markdown
**本次任務預估：**
- 複雜度：輕量 / 中等 / 重型
- 預計 Pass 數：2 / 3 / 4 輪
- 需要的資產：品牌 logo ✓ / 產品圖 ⚠️ 需搜尋 / UI 截圖 ❌ 需使用者提供
- Context 消耗：低 / 中 / 高
```

**重型任務（滿足任一條件時必須預警）**：
- 動畫 + 音效 + 影片匯出（通常需要 4+ 輪，context 消耗大）
- 完整 App 原型（> 8 屏）
- 需從多個外部來源搜尋並下載資產
- 涉及多個品牌的設計比對

---

## 跨工作階段：專案狀態檔案

長工作的設計任務（預計 > 2 次對話），在專案目錄建立 `_project-state.json`：

```json
{
  "project": "DJI Pocket 4 Launch Animation",
  "created": "2026-04-22",
  "last_updated": "2026-04-22T15:30:00",
  "status": "in_progress",
  "passes_completed": ["Pass 1 - Assumptions + Placeholders"],
  "passes_pending": ["Pass 2 - Full Components", "Pass 3 - Polish", "Pass 4 - Video Export"],
  "assets": {
    "logo": { "status": "done", "path": "assets/dji-brand/logo.svg" },
    "product_hero": { "status": "done", "path": "assets/dji-brand/pocket4-hero.png" },
    "color_spec": { "status": "done", "path": "assets/dji-brand/brand-spec.md" }
  },
  "user_decisions": [
    "風格方向：Kenya Hara 極簡 + DJI 工業感",
    "色調：深黑底 + 白字 + 橙 accent",
    "動畫時長：45 秒"
  ],
  "open_questions": [
    "配樂選哪首？bgm-tech.mp3 還是 bgm-ad.mp3？"
  ]
}
```

**何時更新**：每完成一個 Pass、每次重要使用者決策後立刻寫入。下次工作階段開始時讀取，不用從頭問同樣的問題。

---

## 工作中：進度摘要（約每 10 則訊息觸發一次）

長對話進行約 10 則訊息後，主動給使用者一個簡短的進度快照：

```markdown
**目前進度快照：**
✅ 已完成：品牌資產下載（logo + 3 張產品圖）、Pass 1 假設確認
🔄 進行中：Pass 2 - 動畫關鍵幀填充（第 3/6 個場景）
⏳ 待處理：音效時間軸、影片匯出
❓ 等使用者決定：Pocket 4 特寫鏡頭要幾秒？
```

目的：讓使用者在長對話中不會失去方向感，方便在 context 被壓縮後快速重建認知。

---

## 脈絡管理：「已完成工作」標記

靈感來自官方 Claude Design 的 `snip` 機制：已完成且確認的工作段落，應主動告知使用者這部分討論已可低優先順序儲存，讓 context window 優先保留當前最需要的資訊。

**何時主動告知使用者「這段可以低優先」**：
- Pass 1 已被確認、正進入 Pass 2 → Pass 1 細節討論
- 資產搜尋已完成並寫入 `brand-spec.md` → 搜尋過程細節
- 使用者明確放棄某個 variation → 該 variation 的所有討論

**告知範例**：
```
「Pass 1 假設已確認，進入 Pass 2。
  Pass 1 的詳細討論已記入 _project-state.json；
  如果 context 被壓縮，用這個檔案就能重建進度，不需要重讀早期訊息。」
```

---

## 自動命名工作階段

任務名稱不明確時，在 Pass 1 結束後給這次設計工作命名，格式：

`{品牌/產品} · {輸出型別} · {風格關鍵詞}`

範例：
- `DJI Pocket 4 · Launch Animation · 極簡工業風`
- `Lovart · iOS App Overview · Editorial Serif`
- `未命名 SaaS · Landing Page · 3 Variations`

存入 `_project-state.json` 的 `"project"` 欄位，方便在多個設計專案中快速識別對應的工作。
