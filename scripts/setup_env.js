#!/usr/bin/env node
/**
 * setup_env.js — 個人工作站環境快速初始化
 * 用途：在新電腦上自動從 .env.example 產生空白 .env.local 範本
 * 執行：node scripts/setup_env.js
 */
const fs   = require('fs');
const path = require('path');

const rootDir     = path.resolve(__dirname, '..');
const examplePath = path.join(rootDir, '.env.example');
const localPath   = path.join(rootDir, '.env.local');

console.log('🚀 個人工作站環境初始化工具 (V10.0)');
console.log('=====================================');

if (fs.existsSync(localPath)) {
  console.log('✅ .env.local 已存在，跳過建立（保護您的現有設定）');
  console.log('   若要重置，請手動刪除 .env.local 後重新執行');
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.error('❌ 找不到 .env.example，請確認您在正確的工作目錄');
  process.exit(1);
}

fs.copyFileSync(examplePath, localPath);
console.log('✅ 已建立 .env.local（從 .env.example 複製）');
console.log('');
console.log('📋 接下來請用文字編輯器填入以下金鑰：');
console.log('   ' + localPath);
console.log('');
console.log('💡 快速產生隨機安全金鑰（PowerShell）：');
console.log('   [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))');
console.log('');
console.log('⚠️  填完後請勿將 .env.local 上傳至 GitHub！');
console.log('   （.gitignore 已自動保護，正常 git push 不會暴露）');
