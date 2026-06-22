function parseMarkdownToFlex(text) {
  const optionRegex = /^([A-Z])\.\s+(.+)$/gm;
  const optionsFound = [];
  let matchOpt;
  
  let mainText = text;
  
  // 擷取選項
  while ((matchOpt = optionRegex.exec(text)) !== null) {
    if (!optionsFound.find(o => o.letter === matchOpt[1])) {
      optionsFound.push({ letter: matchOpt[1], desc: matchOpt[2].trim(), full: matchOpt[0] });
    }
  }
  
  // 從原文中移除選項，讓主文字保持乾淨
  if (optionsFound.length > 0) {
    for (const opt of optionsFound) {
      mainText = mainText.replace(opt.full + '\n', '');
      mainText = mainText.replace(opt.full, '');
    }
  }
  
  // Markdown 純淨化 (Markdown Cleaner)
  // 1. 移除粗體/斜體的星號: **文字** -> 文字
  mainText = mainText.replace(/\*\*(.*?)\*\*/g, '$1');
  mainText = mainText.replace(/\*(.*?)\*/g, '$1');
  
  // 2. 將標題 # 替換為較乾淨的方塊符號: ### 標題 -> ■ 標題
  mainText = mainText.replace(/^#{1,6}\s+(.*)$/gm, '■ $1');

  mainText = mainText.trim();

  const messages = [];
  
  // 1. 原生文字訊息 (支援複製)
  if (mainText) {
    messages.push({
      type: 'text',
      text: mainText
    });
  }
  
  // 2. 按鈕區塊 (Flex Message)
  if (optionsFound.length > 0) {
    const buttonContents = optionsFound.slice(0, 5).map(opt => {
      let shortDesc = opt.desc;
      const titleMatch = opt.desc.match(/^[\[【](.+?)[\]】]/);
      if (titleMatch) {
        shortDesc = titleMatch[1];
      } else {
        const splitMatch = opt.desc.split(/[,，.。!！?？;；(（\s]/)[0];
        shortDesc = splitMatch.length > 1 ? splitMatch : opt.desc;
      }

      let labelText = `${opt.letter}. ${shortDesc}`;
      if (labelText.length > 20) {
        labelText = labelText.substring(0, 18) + '..';
      }
      
      let actionText = `${opt.letter}. `;
      const fullTitleMatch = opt.desc.match(/^([\[【].+?[\]】])/);
      if (fullTitleMatch) {
        actionText += fullTitleMatch[1];
      } else {
        actionText += shortDesc;
      }
      
      return {
        type: 'button',
        style: 'primary',
        height: 'sm',
        color: '#00B900',
        margin: 'sm',
        action: {
          type: 'message',
          label: labelText,
          text: actionText
        }
      };
    });

    messages.push({
      type: 'flex',
      altText: '請選擇後續動作',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '👉 請選擇下一步指令：',
              weight: 'bold',
              size: 'sm',
              color: '#1DB446'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: buttonContents
        }
      }
    });
  }

  // 因為 bridge.js 原本預期回傳單一物件，現在我們改回傳陣列
  // 但 bridge.js 是用 messages: [flexMessage] 包裝的，如果這裡回傳陣列會變成二維陣列
  // 必須去修改 bridge.js
  return messages.length > 0 ? messages : null;
}

module.exports = { parseMarkdownToFlex };
