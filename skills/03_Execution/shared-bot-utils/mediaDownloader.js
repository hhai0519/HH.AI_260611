/**
 * Shared Media Downloader for LINE & Telegram Bots (SOP14 v3.0 Final)
 * 包含：Token 遮蔽、自動資產清理、MIME 副檔名校驗、10s 超時防禦與 10MB OOM 反壓
 */
const fs = require('fs');
const path = require('path');

let axios = null;
try {
  axios = require('axios');
} catch (e) {
  try {
    const WORKSPACE_ROOT = path.resolve(__dirname, '../../../');
    axios = require(path.join(WORKSPACE_ROOT, 'skills/03_Execution/line-bot-zero-delay/line-bot-project/node_modules/axios'));
  } catch (e2) {
    const WORKSPACE_ROOT = path.resolve(__dirname, '../../../');
    axios = require(path.join(WORKSPACE_ROOT, 'skills/03_Execution/telegram-bot-cdp-bridge/telegram-bot-project/node_modules/axios'));
  }
}

const TEMP_DIR = path.join(__dirname, '../temp_images');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const RETENTION_MS = 24 * 60 * 60 * 1000; // 24h

if (!fs.existsSync(TEMP_DIR)) {
  try { fs.mkdirSync(TEMP_DIR, { recursive: true }); } catch (_) {}
}

function autoCleanupOldImages() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > RETENTION_MS) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (e) {}
}

function redactToken(url, token) {
  if (!token || !url) return url;
  return url.replace(token, '***REDACTED_BOT_TOKEN***');
}

/**
 * 下載 Telegram 圖片 (含 0-byte 損壞檢驗 SOP14-R18)
 */
async function downloadTelegramPhoto(botToken, filePath, fileId) {
  autoCleanupOldImages();
  let ext = path.extname(filePath) || '.jpg';
  if (!/^\.(jpg|jpeg|png|webp)$/i.test(ext)) ext = '.jpg';

  const safeFileId = String(fileId).replace(/[^a-zA-Z0-9_-]/g, '');
  const savePath = path.join(TEMP_DIR, `tg_${safeFileId}_${Date.now()}${ext}`);
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  
  try {
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream',
      timeout: 10000,
      maxContentLength: MAX_FILE_SIZE
    });

    const writer = fs.createWriteStream(savePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        if (fs.existsSync(savePath)) try { fs.unlinkSync(savePath); } catch (_) {}
        reject(err);
      });
    });

    const stats = fs.statSync(savePath);
    if (stats.size === 0) {
      fs.unlinkSync(savePath);
      throw new Error('Downloaded image file size is 0 bytes');
    }

    return savePath;
  } catch (err) {
    const safeUrl = redactToken(fileUrl, botToken);
    console.error(`[MediaDownloader Error] Failed to download image from ${safeUrl}:`, err.message);
    if (fs.existsSync(savePath)) try { fs.unlinkSync(savePath); } catch (_) {}
    throw err;
  }
}

/**
 * 下載 LINE 圖片 (SOP14-R12)
 */
async function downloadLinePhoto(channelAccessToken, messageId) {
  autoCleanupOldImages();
  const safeMessageId = String(messageId).replace(/[^a-zA-Z0-9_-]/g, '');
  const savePath = path.join(TEMP_DIR, `line_${safeMessageId}_${Date.now()}.jpg`);
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: { 'Authorization': `Bearer ${channelAccessToken}` },
      responseType: 'stream',
      timeout: 10000,
      maxContentLength: MAX_FILE_SIZE
    });

    const writer = fs.createWriteStream(savePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        if (fs.existsSync(savePath)) try { fs.unlinkSync(savePath); } catch (_) {}
        reject(err);
      });
    });

    const stats = fs.statSync(savePath);
    if (stats.size === 0) {
      fs.unlinkSync(savePath);
      throw new Error('Downloaded LINE image size is 0 bytes');
    }

    return savePath;
  } catch (err) {
    console.error(`[MediaDownloader Error] Failed to download LINE image ${messageId}:`, err.message);
    if (fs.existsSync(savePath)) try { fs.unlinkSync(savePath); } catch (_) {}
    throw err;
  }
}

function formatImagePrompt(imagePath, caption = '') {
  const userCaption = caption && caption.trim() ? `\n使用者說明：${caption.trim()}` : '';
  return `[IMAGE:${imagePath}]\n使用者傳送了圖片，請分析。${userCaption}`;
}

function formatAlbumPrompt(imagePaths, caption = '') {
  const userCaption = caption && caption.trim() ? `\n使用者說明：${caption.trim()}` : '';
  const imgList = imagePaths.map(p => `[IMAGE:${p}]`).join('\n');
  return `[ALBUM: 包含 ${imagePaths.length} 張相簿截圖]\n${imgList}\n使用者傳送了相簿圖片，請統一分析與整理。${userCaption}`;
}

module.exports = {
  downloadTelegramPhoto,
  downloadLinePhoto,
  formatImagePrompt,
  formatAlbumPrompt,
  autoCleanupOldImages
};
