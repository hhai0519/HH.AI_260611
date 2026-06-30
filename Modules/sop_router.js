/**
 * SOP 機器索引路由器 v1.0
 * 依據 tag 精準取得 SOP 絕對路徑，並強制驗證實體檔案存在性（防死連結）。
 * 用法：const { getSOPs } = require('./sop_router');
 *       const paths = getSOPs(['security', 'process_kill']);
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const SOP_DIR    = path.resolve(__dirname, '..', 'SOP');
const INDEX_PATH = path.join(SOP_DIR, 'SOP_00A_Master_Index.json');

/**
 * @param {string[]} tags - 要查詢的 tag 陣列
 * @returns {string[]} - 通過驗證的 SOP 絕對路徑陣列
 */
function getSOPs(tags = []) {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`[sop_router] 索引檔案不存在: ${INDEX_PATH}`);
  }

  const index   = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const fileSet = new Set();

  for (const tag of tags) {
    const files = index.tags[tag] || [];
    files.forEach(f => fileSet.add(f));
  }

  const result = [];
  for (const filename of fileSet) {
    const fullPath = path.join(SOP_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      console.error(`[sop_router] ❌ 死連結！索引指向的 SOP 不存在: ${fullPath}`);
      console.error(`[sop_router]    請更新 SOP_00A_Master_Index.json 中的對應 tag。`);
      continue;
    }
    result.push(fullPath);
  }

  return result;
}

module.exports = { getSOPs };
