/**
 * Phase A 階段性驗證腳本
 */
const mediaDownloader = require('./mediaDownloader');
const textNormalizer = require('./textNormalizer');
const path = require('path');
const fs = require('fs');

console.log('🧪 執行 Phase A 階段性單元測試...');

// 測試 1: formatImagePrompt
const promptResult = mediaDownloader.formatImagePrompt('c:/test.jpg', '測試照片');
if (!promptResult.includes('[IMAGE:c:/test.jpg]') || !promptResult.includes('使用者說明：測試照片')) {
  console.error('❌ Phase A 測試失敗: formatImagePrompt 格式不符');
  process.exit(1);
}
console.log('🟢 [PASS] formatImagePrompt 測試通過');

// 測試 2: normalizeToTraditionalChinese
const normResult = textNormalizer.normalizeToTraditionalChinese('服务器与数据库');
if (normResult !== '伺服器與資料庫') {
  console.error('❌ Phase A 測試失敗: normalizeToTraditionalChinese 轉換不符');
  process.exit(1);
}
console.log('🟢 [PASS] normalizeToTraditionalChinese 測試通過');

// 測試 3: autoCleanupOldImages
try {
  mediaDownloader.autoCleanupOldImages();
  console.log('🟢 [PASS] autoCleanupOldImages 執行成功');
} catch (e) {
  console.error('❌ Phase A 測試失敗: autoCleanupOldImages 拋出 Exception', e.message);
  process.exit(1);
}

console.log('✅ Phase A 所有單元測試 100% 通過！');
