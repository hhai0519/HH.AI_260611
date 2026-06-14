import pandas as pd
import numpy as np
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def detect_anomalies(df, numeric_cols):
    """Detect outliers using IQR method."""
    anomalies = []
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        if not outliers.empty:
            for idx, row in outliers.iterrows():
                val = row[col]
                direction = "激增 (High)" if val > upper_bound else "暴跌 (Low)"
                # Try to find a context identifier (like month, year, or product_line)
                context = ""
                if 'product_line' in row: context += f"[{row['product_line']}] "
                if 'month' in row and 'year' in row: context += f"{row['month']} {row['year']} "
                
                anomalies.append(f"- 🚨 [Risk Alert] 異常值偵測: {context}-> 欄位 `{col}` 出現 {direction}，數值為 {val:,.2f} (正常範圍上限: {upper_bound:,.2f})")
    
    return anomalies

def generate_trend_narrative(df, numeric_cols):
    """Generate textual trend narratives."""
    narratives = []
    
    if 'product_line' in df.columns:
        # Group by product line for key metrics
        grouped = df.groupby('product_line')[numeric_cols].sum()
        narratives.append("### 📈 產品線核心數據貢獻 (總計)")
        for product, row in grouped.iterrows():
            rev = row.get('total_revenue', 0)
            profit = row.get('gross_profit', 0)
            if rev > 0:
                narratives.append(f"- **{product}**: 總營收達 {rev:,.2f}，毛利貢獻 {profit:,.2f}。")
                
        # Time-series trend (if month/year exist)
        if 'month' in df.columns:
            # Sort by appearance (assuming sequential if not strict dates)
            # Compare first half vs second half
            narratives.append("\n### 📉 趨勢變化敘述")
            for product in df['product_line'].unique():
                pdf = df[df['product_line'] == product]
                if len(pdf) >= 2:
                    first_rev = pdf['total_revenue'].iloc[0]
                    last_rev = pdf['total_revenue'].iloc[-1]
                    growth = ((last_rev - first_rev) / first_rev) * 100 if first_rev > 0 else 0
                    
                    direction = "成長了" if growth >= 0 else "衰退了"
                    narratives.append(f"- **{product}**: 營收從期初的 {first_rev:,.0f} {direction} {abs(growth):.1f}% 來到期末的 {last_rev:,.0f}。")
    else:
        # Generic trend analysis
        narratives.append("### 📈 整體數據趨勢")
        for col in numeric_cols[:5]:  # Focus on top 5 numeric cols
            first_val = df[col].iloc[0]
            last_val = df[col].iloc[-1]
            if first_val > 0:
                growth = ((last_val - first_val) / first_val) * 100
                direction = "成長了" if growth >= 0 else "衰退了"
                narratives.append(f"- 欄位 `{col}` 從期初的 {first_val:,.0f} {direction} {abs(growth):.1f}% 來到期末的 {last_val:,.0f}。")
                
    return narratives

def build_semantic_memory(file_path):
    try:
        df = pd.read_csv(file_path, encoding='utf-8-sig')
    except Exception as e:
        return f"[SYSTEM-RETURN: FAILED | DATA: 無法讀取 CSV，錯誤: {str(e)}]"
        
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # 1. 降維提取 (Dimensionality Reduction)
    # 選擇核心 KPI：營收、利潤、利潤率等
    kpi_keywords = ['revenue', 'profit', 'margin', 'income', 'cost', 'expense', 'value', 'price']
    core_kpis = [col for col in numeric_cols if any(kw in col.lower() for kw in kpi_keywords)]
    if not core_kpis: core_kpis = numeric_cols[:5] # Fallback
    
    # 2. 異常值偵測
    anomalies = detect_anomalies(df, core_kpis)
    
    # 3. 趨勢敘述化
    narratives = generate_trend_narrative(df, core_kpis)
    
    # 組裝 Semantic Memory Markdown
    memory_md = []
    memory_md.append(f"## 📊 CSV Semantic Memory Report")
    memory_md.append(f"**資料來源**: `{file_path}`")
    memory_md.append(f"**數據維度**: {df.shape[0]} 筆紀錄，涵蓋核心 KPI ({', '.join(core_kpis[:5])} 等)")
    memory_md.append("\n" + "\n".join(narratives))
    
    memory_md.append(f"\n### ⚠️ 風險與異常值盤點 (Anomaly Detection)")
    if anomalies:
        memory_md.extend(anomalies)
    else:
        memory_md.append("- 目前資料集中未偵測到顯著的離群值 (基於 IQR 檢定)。")
        
    final_output = "\n".join(memory_md)
    
    return f"[SYSTEM-RETURN: SUCCESS | DATA:\n{final_output}\n]"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("[SYSTEM-RETURN: FAILED | DATA: 缺少 CSV 檔案路徑參數]")
        sys.exit(1)
        
    csv_file = sys.argv[1]
    result = build_semantic_memory(csv_file)
    print(result)
