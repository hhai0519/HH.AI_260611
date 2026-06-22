# 🚀 鎖機制與訓練控制器發布檢核清單 (Release Checklist)

每次將代碼部署至 Staging、Canary 或 Production 環境前，運維與部署負責人必須逐項確認：

- [ ] **資料表變更 (Migration)**：確認已執行 `ALTER TABLE` 擴充鎖欄位與建立 `lock_audit_log` 審計表。
- [ ] **環境變數配置**：確認生產環境中 `.env` 設定 `ALLOW_IN_MEMORY_FALLBACK=false` 且 `INTERNAL_GATEWAY_TOKEN` 配置一致。
- [ ] **決策記錄更新**：確認 `docs/adr/` 下的決策文件已同步更新。
- [ ] **行動手冊更新**：確認 `RUNBOOK.md` 的故障排查路徑與 Bridge 新增的 `/lock/status` 契約吻合。
- [ ] **混沌與災難測試**：確認已在 Staging 完成 Chaos 1~7 測試與 DR 演練，RTO < 15m 且無數據丟失。
- [ ] **SLO 與告警監控**：確認 Prometheus Dashboard 已掛載指標，且 `lock_heartbeat_failure` 告警正常運作。
- [ ] **人工停止閥驗證**：確認 `CANARY_STOP=true` 的凍結邏輯在 Staging 測試有效。
- [ ] **自動回滾策略**：確認回滾指標（自毀率 > 5%、失鎖率 > 1%）已配置於發布流水線。
