/**
 * 3-Tier Fallback 機制模組 (高可用性 API 請求)
 * 目的：在主 API 失敗時，自動降級使用備用方案，確保背景服務不中斷。
 */

const axios = require('axios'); // 假設專案有 axios，或者可以使用內建的 fetch (Node 18+)

/**
 * 執行具有 3-Tier 降級機制的非同步請求
 * @param {Array<Function>} strategies - 一個包含多個請求策略的陣列 (依照優先順序)
 * @returns {Promise<any>} - 請求結果
 */
async function executeWithFallback(strategies) {
  let lastError = null;

  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`[Fallback System] 嘗試執行策略 ${i + 1}/${strategies.length}...`);
      const result = await strategies[i]();
      console.log(`[Fallback System] 策略 ${i + 1} 執行成功！`);
      return result;
    } catch (error) {
      console.warn(`[Fallback System] 策略 ${i + 1} 失敗: ${error.message}`);
      lastError = error;
    }
  }

  console.error('[Fallback System] 所有降級策略均已失敗！');
  throw new Error(`Fallback failed. Last error: ${lastError.message}`);
}

/**
 * 範例：3-Tier 搜尋 API (DuckDuckGo 概念展示)
 * 1. 優先嘗試官方/穩定版 API
 * 2. 失敗則嘗試 Lite/備用端點
 * 3. 再失敗則嘗試網頁 HTML 爬蟲模式
 */
async function sampleSearchFallback(query) {
  const strategies = [
    // Tier 1: 優先策略 (例如：正式版 API)
    async () => {
      // 這裡只是範例，實際應該放 axios.get('https://api.duckduckgo.com/...')
      if (Math.random() > 0.5) throw new Error('Tier 1 API Rate Limited');
      return { source: 'Tier 1 API', data: `Results for ${query}` };
    },
    // Tier 2: 備用策略 (例如：Lite 版 API 或備用伺服器)
    async () => {
      if (Math.random() > 0.5) throw new Error('Tier 2 Endpoint Down');
      return { source: 'Tier 2 Lite API', data: `Results for ${query}` };
    },
    // Tier 3: 最終底線策略 (例如：直接爬取 HTML 網頁)
    async () => {
      return { source: 'Tier 3 HTML Scraper', data: `Results for ${query} (scraped)` };
    }
  ];

  return await executeWithFallback(strategies);
}

module.exports = {
  executeWithFallback,
  sampleSearchFallback
};
