<div align="center">

# 女媧.skill

> *「你想蒸餾的下一個員工，何必是同事」*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill-blueviolet)](https://claude.ai/code)
[![Skills](https://img.shields.io/badge/skills.sh-Compatible-green)](https://skills.sh)

<br>

**女媧幫你蒸餾任何人的思維方式，讓喬布斯、馬斯克、芒格、費曼都給你打工。**

<br>

[同事.skill](https://github.com/titanwings/colleague-skill) 證明了蒸餾一個人是可行的。<br>
那何必蒸餾同事？去蒸餾喬布斯、芒格、費曼、馬斯克。<br>
只需輸入一個名字，女媧自動完成調研、提煉、驗證全流程。

[看效果](#效果示例) · [安裝](#安裝) · [它蒸餾了什麼](#女媧蒸餾了什麼) · [工作原理](#工作原理)

<br>

**其他語言 / Other Languages:**

[English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

<br>

[![Star History Chart](https://api.star-history.com/svg?repos=alchaincyf/nuwa-skill&type=Date)](https://star-history.com/#alchaincyf/nuwa-skill&Date)

</div>

---

## 效果示例

```
使用者      ❯ 我同時想做自媒體、寫書、做獨立開發，精力完全不夠

Naval     ❯ 你列了三個慾望。每個慾望都是你跟不快樂籤的一份合同。
            不是精力不夠，是合同太多。
            
            問你自己：哪一個做起來你會忘記時間？
            那個就是你的特定知識所在。
            
            不是三選一。是先一，再一，再一。
            序列復利，不是並行內耗。
```

```
使用者      ❯ 我們的SaaS產品獲客成本太高了

馬斯克     ❯ 先別想怎麼降。先算物理極限。
            獲客的最小必要動作是什麼？使用者從知道你到付費，
            資訊傳遞的理論最短路徑是什麼？
            
            現在你的實際路徑是理論路徑的幾倍？
            如果超過3倍，中間一定有可以砍掉的步驟。
            不是最佳化漏斗，是質疑漏斗本身該不該存在。
```

再來一個大家更熟悉的。蒸餾喬布斯之後，問他「OpenAI和Anthropic誰的方向對」：

```
使用者      ❯ OpenAI和Anthropic誰的方向是對的？

喬布斯    ❯ 你問錯了。這不是一場關於方向的競賽。
            這是一場關於品味的競賽。

            OpenAI像1985年的微軟。什麼都做，什麼都要贏。
            這種策略能贏市場份額。Bill Gates就是這麼贏的。
            問題是——當你什麼都做的時候，你不可能每件事都做到
            insanely great。

            Anthropic更像早期的Apple。聚焦。
            Focus means saying no to a hundred good ideas.

            但兩家公司都犯了一個我絕對不會犯的錯誤——
            他們不控制硬體。

            最終贏的可能是同時控制晶片、模型和使用者介面的人。
            你知道現在誰在同時做這三件事嗎？Apple.
```

蒸餾張雪峰之後：

```
使用者      ❯ 家裡條件一般，孩子想學金融，去不了頂尖學校，該不該報？

張雪峰    ❯ 千萬別報。我說過多少遍了，金融不是你學出來的，金融是
            你爹媽給你帶出來的。頂尖學校的金融，人家同學是行長的
            兒子、基金經理的女兒，人脈就是資源。你普通家庭去個普通
            學校學金融，畢業出來幹什麼？賣保險、跑銀行櫃檯、做電銷。
            先謀生再謀愛，家裡沒礦就選技術類專業，學個硬本事，靠
            自己吃飯。金融這碗飯，不是誰都端得起的。
```

這不是角色扮演。喬布斯用的是「聚焦即說不」和「端到端控制」心智模型，Naval用的是「慾望即合同」，馬斯克用的是「漸近極限法」，張雪峰用的是「ROI教育觀」和「階層流動現實主義」。**它們不是在復讀名人語錄，是在用名人的認知框架幫你分析。**

---

## 安裝

```bash
npx skills add alchaincyf/nuwa-skill
```

然後在 Claude Code 裡：

```
> 蒸餾一個保羅·格雷厄姆
> 造一個張小龍的視角Skill
> 幫我做一個段永平的Skill
```

造完之後直接呼叫：

```
> 用芒格的視角幫我分析這個投資決策
> 費曼會怎麼解釋量子計算？
> 切換到Naval，我在糾結三件事
```

---

## 女媧蒸餾了什麼

蒸餾各領域最強的人，需要提取比日常工作習慣更深的東西。女媧提取五層：

| 層次 | 說明 |
|---|---|
| **怎麼說話** | 表達DNA——語氣、節奏、用詞偏好 |
| **怎麼想** | 心智模型、認知框架 |
| **怎麼判斷** | 決策啟發式 |
| **什麼不做** | 反模式、價值觀底線 |
| **知道侷限** | 誠實邊界 |

工作習慣可以靠流程文件傳遞，但讓芒格和馬斯克面對同一個問題做出不同判斷的，是認知框架。女媧提取的是認知作業系統。

### 誠實邊界

每個Skill都明確標註做不到什麼：

- 蒸餾不了直覺——框架能提取，靈感不能
- 捕捉不了突變——截止到調研時間的快照
- 公開表達 ≠ 真實想法——只能基於公開資訊

**一個不告訴你侷限在哪的Skill，不值得資訊任。**

---

## 已蒸餾人物

女媧已蒸餾了13位人物 + 1個主題。每個都是獨立的、可直接安裝使用的Skill：

### 人物Skill

| 人物 | 領域 | 獨立倉庫 | 一鍵安裝 |
|------|------|---------|---------|
| 🔥 **Paul Graham** | 創業/寫作/產品/人生哲學 | [paul-graham-skill](https://github.com/alchaincyf/paul-graham-skill) | `npx skills add alchaincyf/paul-graham-skill` |
| 🔥 **張一鳴** | 產品/組織/全球化/人才 | [zhang-yiming-skill](https://github.com/alchaincyf/zhang-yiming-skill) | `npx skills add alchaincyf/zhang-yiming-skill` |
| 🔥 **Karpathy** | AI/工程/教育/開源 | [karpathy-skill](https://github.com/alchaincyf/karpathy-skill) | `npx skills add alchaincyf/karpathy-skill` |
| 🔥 **Ilya Sutskever** | AI安全/scaling/研究品味 | [ilya-sutskever-skill](https://github.com/alchaincyf/ilya-sutskever-skill) | `npx skills add alchaincyf/ilya-sutskever-skill` |
| 🔥 **MrBeast** | 內容創造/YouTube方法論 | [mrbeast-skill](https://github.com/alchaincyf/mrbeast-skill) | `npx skills add alchaincyf/mrbeast-skill` |
| 🔥 **特朗普** | 談判/權力/傳播/行為預判 | [trump-skill](https://github.com/alchaincyf/trump-skill) | `npx skills add alchaincyf/trump-skill` |
| ⭐ **喬布斯** | 產品/設計/戰略 | [steve-jobs-skill](https://github.com/alchaincyf/steve-jobs-skill) | `npx skills add alchaincyf/steve-jobs-skill` |
| **馬斯克** | 工程/成本/第一性原理 | [elon-musk-skill](https://github.com/alchaincyf/elon-musk-skill) | `npx skills add alchaincyf/elon-musk-skill` |
| **芒格** | 投資/多元思維/逆向思考 | [munger-skill](https://github.com/alchaincyf/munger-skill) | `npx skills add alchaincyf/munger-skill` |
| **費曼** | 學習/教學/科學思維 | [feynman-skill](https://github.com/alchaincyf/feynman-skill) | `npx skills add alchaincyf/feynman-skill` |
| **納瓦爾** | 財富/槓桿/人生哲學 | [naval-skill](https://github.com/alchaincyf/naval-skill) | `npx skills add alchaincyf/naval-skill` |
| **塔勒布** | 風險/反脆弱/不確定性 | [taleb-skill](https://github.com/alchaincyf/taleb-skill) | `npx skills add alchaincyf/taleb-skill` |
| **張雪峰** | 教育/職業規劃/階層流動 | [zhangxuefeng-skill](https://github.com/alchaincyf/zhangxuefeng-skill) | `npx skills add alchaincyf/zhangxuefeng-skill` |

### 主題Skill

| 主題 | 領域 | 獨立倉庫 | 一鍵安裝 |
|------|------|---------|---------|
| **X導師** | X/Twitter運營全棧 | [x-mentor-skill](https://github.com/alchaincyf/x-mentor-skill) | `npx skills add alchaincyf/x-mentor-skill` |

人物Skill蒸餾一個人的思維方式；主題Skill蒸餾一個領域的方法論。每個倉庫都包含完整的調研資料和效果示例對話。

想蒸餾不在列表裡的人或主題？安裝女媧，說「蒸餾一個XXX」就行。

---

## 達爾文.skill：讓所有Skill持續進化

<div align="center">

<a href="https://github.com/alchaincyf/darwin-skill">
<img src="https://raw.githubusercontent.com/alchaincyf/darwin-skill/master/assets/banner.svg" alt="達爾文.skill" width="600">
</a>

</div>

女媧造Skill，**[達爾文](https://github.com/alchaincyf/darwin-skill)** 讓Skill進化。

受 Karpathy autoresearch 啟發，達爾文.skill 用自主實驗迴圈批次最佳化所有Skill：8維度評估、棘輪機制（只保留改進，自動回滾退步）、獨立子agent評分。女媧的 Phase 5 雙Agent精煉就內建了達爾文的評估體系，這也是女媧生成的Skill質量高的原因之一。

```bash
npx skills add alchaincyf/darwin-skill
```

---

## 工作原理

輸入一個名字後，女媧做四件事：

**1. 六路並行採集**——著作、播客/訪談、社交媒體、批評者視角、決策記錄、人生時間線，6個Agent同時跑，各自存檔。

**2. 三重驗證提煉**——一個觀點要被收錄為心智模型，必須：跨2+個領域出現過（不是隨口一說）、能推斷對新問題的立場（有預測力）、不是所有聰明人都會這麼想（有排他性）。三個都過才收錄。

**3. 構建Skill**——3-7個心智模型 + 5-10條決策啟發式 + 表達DNA + 價值觀與反模式 + 誠實邊界，寫入SKILL.md。

**4. 質量驗證**——拿3個此人公開回答過的問題測試，方向一致才透過。再用1個他沒討論過的問題測試，Skill應該表現出適度不確定而非斬釘截鐵。

完整方法論在 `references/extraction-framework.md`。

---

## 倉庫結構

```
nuwa-skill/
├── SKILL.md                      # 女媧本體
├── references/
│   ├── extraction-framework.md   # 提煉方法論（想深入瞭解看這個）
│   └── skill-template.md         # 生成Skill的模板
└── examples/                          # 13個人物 + 1個主題，含完整調研資料
    ├── steve-jobs-perspective/        # ⭐ 喬布斯（含實戰對話記錄）
    ├── paul-graham-perspective/       # Paul Graham
    ├── zhang-yiming-perspective/      # 張一鳴
    ├── andrej-karpathy-perspective/   # Karpathy
    ├── ilya-sutskever-perspective/    # Ilya Sutskever
    ├── trump-perspective/             # 特朗普
    ├── mrbeast-perspective/           # MrBeast
    ├── elon-musk-perspective/         # 馬斯克
    ├── munger-perspective/            # 查理·芒格
    ├── feynman-perspective/           # 費曼
    ├── naval-perspective/             # Naval Ravikant
    ├── taleb-perspective/             # 塔勒布
    ├── zhangxuefeng-perspective/      # 張雪峰
    └── x-mastery-mentor/             # X導師（主題Skill）
```

調研過程全透明。每個example都包含完整的調研檔案，你可以看到資訊怎麼被收集、篩選、變成心智模型。喬布斯的示例還附帶了一段完整的實戰對話記錄（聊AI硬體、OpenAI vs Anthropic、Apple破局），展示Skill在多輪深度對話中的表現。

---

## 背後的故事

[同事.skill](https://github.com/titanwings/colleague-skill) 最近在GitHub爆火——把離職同事蒸餾成AI Skill，幾天破5000星。它證明了一件事：蒸餾一個人是完全可行的。

既然我們有了蒸餾人的能力，為什麼只蒸餾身邊的同事？去蒸餾各領域最強的人。而且幸運的是，這些人通常留下了大量可以被蒸餾的材料——著作、演講、訪談、社交媒體。這是對自己能力的極大補充。

我之前就一直在做類似的事，但蒸餾的不是同事，是芒格、費曼、Naval、馬斯克、塔勒布這些人。今天把方法論開源了。

女媧不復制人。它提取認知作業系統。

**女媧（Nuwa）**，中國神話裡用泥土造人的女神。這裡的泥土是公開資訊，造出來的不是人，是一面鏡子。

---

## 關於作者

**花叔 Huashu** — AI Native Coder，獨立開發者，代表作：小貓補光燈（AppStore 付費榜 Top1）

| 平臺 | 連結 |
|------|------|
| 🌐 官網 | [bookai.top](https://bookai.top) · [huasheng.ai](https://www.huasheng.ai) |
| 𝕏 Twitter | [@AlchainHust](https://x.com/AlchainHust) |
| 📺 B站 | [花叔](https://space.bilibili.com/14097567) |
| ▶️ YouTube | [@Alchain](https://www.youtube.com/@Alchain) |
| 📕 小紅書 | [花叔](https://www.xiaohongshu.com/user/profile/5abc6f17e8ac2b109179dfdf) |
| 💬 公眾號 | 微資訊搜「花叔」或掃碼關注 ↓ |

<img src="wechat-qrcode.jpg" alt="公眾號二維碼" width="360">

## 許可證

MIT — 隨便用，隨便改，隨便造。

---

<div align="center">

**同事.skill** 蒸餾了人做什麼。<br>
**女媧** 蒸餾了人怎麼想。<br><br>
*你想蒸餾的下一個員工，何必是同事。*

<br>

MIT License © [花叔 Huashu](https://github.com/alchaincyf)

</div>

---

## English

> *"The next person you want to distill doesn't have to be a colleague."*

**[colleague-skill](https://github.com/titanwings/colleague-skill)** proved that distilling a person into an AI skill is viable. **Nuwa** asks: why stop at colleagues? Distill the best minds in every field — Munger, Feynman, Musk, Naval — people who conveniently left mountains of distillable material behind.

Nuwa is a Claude Code skill that extracts cognitive frameworks — mental models, decision heuristics, expression DNA — from any public figure into a runnable perspective skill.

Not role-playing. Cognitive architecture extraction.

**Install**: `npx skills add alchaincyf/nuwa-skill`

**How it works**: Input a name → 6 parallel research agents → 40+ primary sources → triple-verified mental models → quality-validated SKILL.md

**13 person skills + 1 topic skill included** — all with full research data. The Jobs example includes a complete multi-turn conversation demo.

See the Chinese README above for live examples and methodology.


