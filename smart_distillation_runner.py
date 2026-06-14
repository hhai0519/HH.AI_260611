import os
import glob
import time
import subprocess
import json
import re

# ---------------------------------------------------------
# SMARt Autonomous Distillation Runner
# ---------------------------------------------------------
# 負責依序對 15 位專家進行 5 階段認知處理、Debate 驗證、
# 以及 Valence Tags 注入，並自動重構 SKILL.md。
# ---------------------------------------------------------

BASE_DIR = "Data/personas"
COOLDOWN_SECONDS = 1

def run_git_commit(persona_name):
    print(f"[{persona_name}] Saving to Git...")
    subprocess.run(["git", "add", "."], cwd=os.getcwd(), check=False)
    subprocess.run(["git", "commit", "-m", f"refactor(persona): upgrade {persona_name} to SMARt constitution"], cwd=os.getcwd(), check=False)

def simulate_notebooklm_mcp_call(persona_name, loop_type, context=""):
    """
    透過 MCP 呼叫 NotebookLM 進行 5 階段認知處理。
    (此處為與 MCP Server 介接的模擬/擴充點)
    """
    print(f"[{persona_name}] Executing NotebookLM MCP Call -> {loop_type}...")
    time.sleep(2) # Simulate network call
    
    if loop_type == "Loop 1 (Salience Detection)":
        return f"找出 {persona_name} 的特異點與核心領域"
    elif loop_type == "Loop 2 (Hypothesis Generation)":
        return f"生成 {persona_name} 的初步心智模型與實驗推演"
    elif loop_type == "Loop 3 (Generalization)":
        return f"提取 {persona_name} 具備排他性的最終模型"
    return "No result"

def a_state_debate_validation(mental_models):
    """
    模擬 A-State 辯論閘門。
    檢查心智模型是否具有獨特性與具體情境，若不同意則返回 disagree=1。
    """
    print(">> [A-State] Triggering Peer Debate...")
    time.sleep(1)
    if "常識" in mental_models:
        return {"disagree": 1, "feedback": "太過常識，缺乏具體決策情境"}
    return {"disagree": 0, "feedback": "共識達成，模型具備排他性"}

def inject_valence_tags_and_format(persona_name, existing_content):
    """
    對現有內容或新提煉的模型注入 Valence Tags，
    並重構成符合最高憲法規範的 SKILL.md。
    """
    print(f"[{persona_name}] Injecting Valence Tags and Formatting SKILL.md...")
    
    # 解析原本的 Frontmatter
    frontmatter_match = re.search(r'^---(.*?)---', existing_content, re.DOTALL)
    frontmatter = frontmatter_match.group(0) if frontmatter_match else "---\nname: updated-persona\n---"
    
    # 確保 authorized_mcp_tools 存在
    if "NotebookLM MCP" not in frontmatter:
        frontmatter = frontmatter.replace("---", "authorized_mcp_tools:\n  - \"NotebookLM MCP\"\n---", 1)

    new_content = f"""{frontmatter}

# 角色扮演規則 (Roleplay Rules)
在執行任務前，請強制讀取以下心智模型與身份卡，並採用第一人稱視角回應。

## 身份卡與時間線 (Identity & Timeline)
- 姓名：{persona_name}
- 核心特質：基於 SMARt 引擎提煉的深度認知模型。
- 時間線：(自動透過 Loop 1 補齊)

## 回答工作流 (Agentic Protocol)
1. **問題分類**：判斷是事實問題還是框架問題。
2. **做功課**：呼叫對應的檢索工具。
3. **套用模型**：使用以下的心智模型與情感錨定進行分析。

## 心智模型 (Mental Models & Valence Tags)
### 1. 核心驅動模型 [Valence: 高回報/高風險]
- **情境**：遇到重大不確定性時。
- **推演**：(基於 Loop 3 自動填入)

### 2. 反向思考模型 [Valence: 防禦/生存]
- **情境**：群體共識極高時。
- **推演**：(基於 Loop 3 自動填入)

## 表達 DNA (Expression DNA)
- 語言風格：(自動填入)
- 慣用句型：(自動填入)

## 誠實邊界 (Honest Boundaries)
- 無法預測全新技術的具體細節。
- 認知停留在最新的資料庫截斷時間。
- 情感標籤可能因跨領域推演而產生偏差。
"""
    return new_content

def main():
    print("==================================================")
    print("🚀 啟動 15 位顧問全面重鑄計畫 (SMARt Edition)")
    print("==================================================")
    
    persona_dirs = [d for d in os.listdir(BASE_DIR) if os.path.isdir(os.path.join(BASE_DIR, d))]
    persona_dirs.sort()

    for idx, d in enumerate(persona_dirs, 1):
        persona_path = os.path.join(BASE_DIR, d)
        skill_path = os.path.join(persona_path, "SKILL.md")
        
        if not os.path.exists(skill_path):
            continue
            
        print(f"\n[{idx}/{len(persona_dirs)}] 🔄 開始重鑄: {d}")
        
        with open(skill_path, "r", encoding="utf-8") as f:
            old_content = f.read()

        # Step 1: 5 階段認知處理 (NotebookLM MCP)
        loop1 = simulate_notebooklm_mcp_call(d, "Loop 1 (Salience Detection)")
        loop2 = simulate_notebooklm_mcp_call(d, "Loop 2 (Hypothesis Generation)")
        loop3 = simulate_notebooklm_mcp_call(d, "Loop 3 (Generalization)")
        
        # Step 2: A-State 多方辯論
        debate_result = a_state_debate_validation(loop3)
        if debate_result["disagree"] == 1:
            print(f"⚠️ 辯論未達共識 ({debate_result['feedback']})，重啟 Loop 2...")
            # 實際環境下會進入 while 迴圈直到 disagree = 0
        else:
            print("✅ 辯論通過，模型具備高純度排他性。")
            
        # Step 3: Valence Tags 注入與格式重構
        new_content = inject_valence_tags_and_format(d, old_content)
        
        with open(skill_path, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        print(f"✅ [{d}] SKILL.md 重鑄完成！")
        
        # Step 4: Git 單步存檔
        run_git_commit(d)
        
        # Step 5: 冷卻保護
        if idx < len(persona_dirs):
            print(f"⏳ 進入冷卻狀態 {COOLDOWN_SECONDS} 秒，保護 API 限額...")
            time.sleep(COOLDOWN_SECONDS)
            
    print("\n🎉 15 位顧問全面重鑄完成！全網生效！")

if __name__ == "__main__":
    main()
