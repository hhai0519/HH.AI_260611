const line = require('@line/bot-sdk');
require('dotenv').config();

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
});

async function send() {
  const userId = "U37e3e917b8b20188a60ba64e47acea95";
  const downloadUrl = "https://surge-enrolled-matched-carry.trycloudflare.com/download/excel";
  
  const flexMessage = {
    type: 'flex',
    altText: '📥 Skills Excel 下載連結',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 Skills Inventory Excel',
            weight: 'bold',
            size: 'md',
            color: '#1DB446'
          },
          {
            type: 'text',
            text: '系統已為您整理好目前的 51 個技能清冊。',
            wrap: true,
            size: 'sm',
            color: '#666666',
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1DB446',
            action: {
              type: 'uri',
              label: '📥 點我下載 Excel',
              uri: downloadUrl
            }
          }
        ]
      }
    }
  };

  try {
    await client.pushMessage({
      to: userId,
      messages: [flexMessage]
    });
    console.log('Flex message sent successfully');
  } catch (err) {
    console.error('Failed to send flex message:', err);
  }
}

send();
