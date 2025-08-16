# 📚 8-Bit Habits 文檔索引

## 🗂️ **文檔結構**

### **📁 1-configuration/ - 配置文件**
| 文件 | 功能 | 說明 |
|---|---|---|
| **DEVELOPMENT_GUIDE.md** | 開發指南 | 完整開發流程、代碼規範、架構原則 |
| **OAUTH_SETUP.md** | OAuth 配置 | Google Cloud Console 設定指南 |
| **SETUP.md** | 環境設定 | 開發環境快速設定 |
| **docker-compose.yml** | 容器配置 | PostgreSQL 資料庫容器編排 |

### **📁 2-troubleshooting/ - 除錯紀錄**
| 文件 | 功能 | 說明 |
|---|---|---|
| **OAUTH_TROUBLESHOOTING.md** | OAuth 除錯 | Google 認證常見問題解決方案 |

### **📁 3-development-log/ - 開發日記**
| 文件 | 功能 | 說明 |
|---|---|---|
| **2025-08-16-phase1-completion.md** | Phase 1 完成記錄 | 認證系統開發完整日誌 |

## 🚀 **快速導航**

### **🔧 我想要...**
- **設定開發環境** → [1-configuration/DEVELOPMENT_GUIDE.md](./1-configuration/DEVELOPMENT_GUIDE.md)
- **配置 Google OAuth** → [1-configuration/OAUTH_SETUP.md](./1-configuration/OAUTH_SETUP.md)
- **解決 OAuth 問題** → [2-troubleshooting/OAUTH_TROUBLESHOOTING.md](./2-troubleshooting/OAUTH_TROUBLESHOOTING.md)
- **查看開發進度** → [3-development-log/](./3-development-log/)

### **📋 專案主要文檔**
- **專案總覽** → [../README.md](../README.md) 
- **產品規格** → [../SPEC.md](../SPEC.md)
- **開發指導** → [../CLAUDE.md](../CLAUDE.md)

## 🎯 **文檔維護規則**

### **新增文件規則**
- **配置文件** → `docs/1-configuration/`
- **問題除錯** → `docs/2-troubleshooting/` 
- **開發日記** → `docs/3-development-log/YYYY-MM-DD-description.md`

### **開發日記格式**
```markdown
# 開發日記 - YYYY-MM-DD: [主題]

## 📅 開發時間軸
- HH:MM-HH:MM: 具體工作內容

## 🔧 技術修改記錄
- 修改的文件和具體代碼

## 📊 測試結果
- 功能測試結果

## 🎯 完成狀態
- 達成的里程碑
```

---

**📝 最後更新**: 2025-08-16  
**📋 維護者**: 開發團隊