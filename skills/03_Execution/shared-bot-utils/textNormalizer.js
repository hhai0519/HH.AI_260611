/**
 * Shared Text Normalizer for LINE & Telegram Bots (SOP14 v3.0 Final)
 * 包含：Null/Undefined 防護與 Markdown 程式碼區塊保護
 */
const path = require('path');

let twConverter = null;
try {
  const OpenCC = require('opencc-js');
  twConverter = OpenCC.Converter({ from: 'cn', to: 'twp' });
} catch (e) {
  try {
    const WORKSPACE_ROOT = path.resolve(__dirname, '../../../');
    const openccPath = path.join(WORKSPACE_ROOT, 'skills/03_Execution/line-bot-zero-delay/line-bot-project/node_modules/opencc-js');
    const OpenCC = require(openccPath);
    twConverter = OpenCC.Converter({ from: 'cn', to: 'twp' });
  } catch (e2) {
    twConverter = (t) => t;
  }
}

/**
 * [SOP14-R16] 將傳入文字進行繁體中文規範化 (帶程式碼區塊保護)
 */
function normalizeToTraditionalChinese(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') text = String(text);
  if (text.trim() === '') return text;
  
  try {
    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map(part => {
        if (part.startsWith('```') && part.endsWith('```')) {
          return part;
        }
        return twConverter(part);
      }).join('');
    }
    return twConverter(text);
  } catch (e) {
    return text;
  }
}

module.exports = {
  normalizeToTraditionalChinese
};
