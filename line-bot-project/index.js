require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const app = express();
const port = process.env.PORT || 3000;

// 建立 LINE SDK client (使用最新的 MessagingApiClient)
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

// Webhook 路由
// middleware 會自動驗證來自 LINE 的請求，並解析 body
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 處理事件邏輯
async function handleEvent(event) {
  // 目前先只處理文字訊息
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 設定基本的 Echo 回應，讓您知道機器人有收到
  const echo = { type: 'text', text: `您剛剛說：${event.message.text}` };

  // 傳送回覆
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  });
}

// 啟動伺服器
app.listen(port, () => {
  console.log(`LINE Bot 伺服器已啟動，正在監聽 Port ${port}...`);
});
