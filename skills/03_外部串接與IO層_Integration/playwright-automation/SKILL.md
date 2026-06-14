---
name: playwright-automation
type: execution
description: 使用 Playwright 進行完整的瀏覽器自動化。自動偵測開發伺服器，編寫乾淨的測試指令碼。測試頁面、填寫表單、擷取螢幕截圖、檢查響應式設計、驗證 UX、測試登入流程、檢查連結，並自動化任何瀏覽器任務。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "Browser Automation"
  execution_env: "Node.js/Playwright"
  io_format: "HTML/PNG/JSON"
---

# Playwright 瀏覽器自動化 (Playwright Automation)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能使用 **Playwright** 實現完整的瀏覽器端到端自動化，包含 E2E 測試指令碼撰寫、表單填寫、截圖擷取、響應式驗證、登入流程測試、連結檢查與跨瀏覽器相容性驗證。

---

## 🎯 觸發條件

- 需要撰寫 E2E 測試指令碼
- 自動化填寫表單或執行重複性 UI 操作
- 驗證頁面在不同裝置的響應式表現
- 測試登入/認證流程
- 批次截圖（多頁面/多裝置）
- 監控頁面是否有死連結或 JS 錯誤

---

## 🛠️ 初始化與環境

```bash
# 安裝
npm install -D @playwright/test
npx playwright install  # 安裝所有瀏覽器（chromium, firefox, webkit）

# 只安裝 chromium（最快）
npx playwright install chromium
```

---

## 📋 核心測試指令碼模板

### 基本頁面測試

```javascript
const { test, expect, chromium } = require('@playwright/test');

test.describe('Skills Dashboard', () => {
  let browser, page;
  
  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });
  
  test.afterAll(async () => {
    await browser.close();
  });
  
  test.beforeEach(async () => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    page = await context.newPage();
    
    // 捕獲所有控制臺錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
    
    // 捕獲頁面崩潰
    page.on('pageerror', err => {
      console.error(`[JS CRASH] ${err.message}`);
    });
  });
  
  test('首頁正常載入', async () => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/Skills Dashboard/);
    
    // 確認關鍵元素存在
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.skill-card').first()).toBeVisible();
  });
  
  test('技能卡片可以點選開啟 Modal', async () => {
    await page.goto('http://localhost:3000');
    
    // 等待卡片載入
    await page.waitForSelector('.skill-card', { timeout: 5000 });
    
    // 點選第一張卡片
    await page.locator('.skill-card').first().click();
    
    // 確認 Modal 出現
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal-content')).toBeVisible();
    
    // 截圖存證
    await page.screenshot({ path: 'test-modal.png', fullPage: false });
  });
  
  test('搜尋功能正常', async () => {
    await page.goto('http://localhost:3000');
    
    const searchInput = page.locator('#search-input');
    await searchInput.fill('技術分析');
    
    // 等待過濾結果
    await page.waitForTimeout(500);
    
    const visibleCards = await page.locator('.skill-card:visible').count();
    expect(visibleCards).toBeGreaterThan(0);
  });
});
```

### 響應式設計測試

```javascript
const VIEWPORTS = [
  { name: 'Mobile', width: 375, height: 812 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1440, height: 900 },
  { name: '4K', width: 2560, height: 1440 }
];

test('響應式佈局驗證', async ({ browser }) => {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000');
    
    // 截圖
    await page.screenshot({ 
      path: `screenshots/${viewport.name.toLowerCase()}.png`,
      fullPage: true 
    });
    
    // 確認沒有水平捲軸（響應式問題的常見指標）
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5);
    
    console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) 透過`);
    await context.close();
  }
});
```

### 表單自動填寫

```javascript
async function fill_and_submit_form(page, formData) {
  for (const [selector, value] of Object.entries(formData)) {
    const element = page.locator(selector);
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    
    if (tagName === 'select') {
      await element.selectOption(value);
    } else if (tagName === 'input' && await element.getAttribute('type') === 'checkbox') {
      if (value) await element.check(); else await element.uncheck();
    } else {
      await element.fill(value);
    }
  }
  
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle' });
}

// 使用範例
await fill_and_submit_form(page, {
  '#username': 'testuser@example.com',
  '#password': '<SECRET_PASSWORD>',
  '#remember-me': true
});
```

### 連結檢查器

```javascript
async function check_all_links(page, base_url) {
  await page.goto(base_url);
  
  const links = await page.$$eval('a[href]', els => 
    els.map(el => el.href).filter(href => href.startsWith('http'))
  );
  
  console.log(`檢查 ${links.length} 個連結...`);
  const broken = [];
  
  for (const url of [...new Set(links)]) {
    try {
      const response = await page.request.get(url, { timeout: 10000 });
      if (!response.ok()) {
        broken.push({ url, status: response.status() });
        console.log(`❌ ${response.status()} - ${url}`);
      }
    } catch (e) {
      broken.push({ url, error: e.message });
      console.log(`❌ ERROR - ${url}: ${e.message}`);
    }
  }
  
  console.log(`\n完成！${links.length - broken.length}/${links.length} 連結正常`);
  return broken;
}
```

---

## 📊 測試報告配置

```javascript
// playwright.config.js
module.exports = {
  testDir: './tests',
  timeout: 30000,
  retries: 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
};
```

---

## 🤝 協同技能

- `webapp-testing`：快速即時除錯（截圖+日誌）
- `webapp-testing-skill`：臺股網站的完整測試流程
- `systematic-debugging-skill`：深層問題排障

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: playwright-automation | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
