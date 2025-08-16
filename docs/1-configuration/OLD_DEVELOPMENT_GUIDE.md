# 8-Bit Habits 開發與測試完整指南

## 📋 目錄
- [快速啟動](#快速啟動)
- [開發環境設定](#開發環境設定)
- [資料庫管理](#資料庫管理)
- [Android 測試](#android-測試)
- [Google OAuth 配置](#google-oauth-配置)
- [故障排除](#故障排除)
- [文檔索引](#文檔索引)

---

## 🚀 快速啟動

### 1. 停止所有服務並重開
```bash
# Windows - 停止所有相關進程
taskkill /f /im node.exe 2>nul || echo "No node processes to kill"
taskkill /f /im java.exe 2>nul || echo "No java processes to kill"
netstat -ano | findstr :8081 | for /f "tokens=5" %a in ('more') do taskkill /f /pid %a 2>nul || echo "Port 8081 clear"

# macOS/Linux - 停止所有相關進程
pkill -f "Metro|expo|node.*8081" || echo "No processes to kill"
lsof -ti:8081 | xargs kill -9 2>/dev/null || echo "Port 8081 clear"
```

### 2. 啟動資料庫和後端服務
```bash
# 確認 PostgreSQL Docker 容器運行
docker ps | grep postgres

# 啟動後端服務器
cd challenge-app-backend
npm start
# 應顯示: Server is running on http://localhost:3000
```

### 3. 啟動資料庫管理界面
```bash
# 在新終端中啟動 Prisma Studio
cd challenge-app-backend
npx prisma studio
# 打開瀏覽器訪問: http://localhost:5556
```

### 4. 啟動 Android 應用
```bash
# 清理並重建 Android 應用
cd challenge-app-frontend
rm -rf android node_modules package-lock.json
npm install
npx expo prebuild --clean --platform android
npx expo run:android
```

---

## 🔧 開發環境設定

### 系統需求
- **Node.js**: v18+
- **Docker**: PostgreSQL 容器
- **Android Studio**: Android 模擬器
- **Google Cloud Console**: OAuth 憑證

### 環境變數配置

#### 後端 (.env)
```env
# 資料庫連接
DATABASE_URL="postgresql://challengeapp:challengeapp_password@localhost:5432/challengeapp"

# Google OAuth 配置
GOOGLE_CLIENT_ID="823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com"

# JWT 密鑰
JWT_SECRET="AU4VRp+JMud5mmo/lM1+NuFRmHQAdHhjg49n3bZ5PEE="

# 服務器配置
PORT=3000
```

#### 前端 (.env)
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

---

## 🗄️ 資料庫管理

### 檢查資料庫狀態
```bash
cd challenge-app-backend

# 檢查連接狀態
npx prisma migrate status

# 檢查資料庫內容
npx prisma studio  # 訪問 http://localhost:5556
```

### 資料庫操作
```bash
# 執行 migration
npx prisma migrate deploy

# 重新生成 Prisma Client
npx prisma generate

# 重置資料庫 (開發時)
npx prisma migrate reset
```

### 資料庫架構
- **users**: 用戶表 (id, email, name, avatarUrl, googleId, language)
- **levels**: 挑戰關卡表
- **level_members**: 關卡成員表
- **check_ins**: 每日打卡記錄表
- **keep_notes**: 個人筆記表

---

## 📱 Android 測試

### 快速重建應用
```bash
cd challenge-app-frontend

# 方法 1: 完全重建
rm -rf android node_modules package-lock.json
npm cache clean --force
npm install
npx expo prebuild --clean --platform android
npx expo run:android

# 方法 2: 快速重啟 (不重新安裝依賴)
rm -rf android
npx expo prebuild --clean --platform android
npx expo run:android
```

### 成功指標
構建成功會看到：
```
BUILD SUCCESSFUL in [時間]
Starting Metro Bundler
Waiting on http://localhost:8081
› Installing [...]/app-debug.apk
› Opening exp+8-bit-habits://expo-development-client/?url=...
Android Bundled [時間]ms index.ts (725 modules)
LOG  📋 Google Sign-In configured
LOG  - Web Client ID: 823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com
LOG  - Platform: android
```

### 檢查應用狀態
```bash
# 檢查模擬器應用
adb devices
adb shell pm list packages | grep habitschallenge

# 檢查 Metro 狀態
netstat -ano | findstr :8081
```

---

## 🔐 Google OAuth 配置

### 已配置的 OAuth 客戶端

#### Web 客戶端
- **Client ID**: `823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com`
- **用途**: Web 版本和 @react-native-google-signin
- **授權域**: `expo.io`

#### Android 客戶端 (已棄用)
- **Client ID**: `823839716704-3r9n24pa9vo7lpde7n7eu19hmdg61c0g.apps.googleusercontent.com`
- **套件名稱**: `com.anonymous.eightbithabits`
- **SHA-1 指紋**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### 當前實現 (已遷移)
使用 `@react-native-google-signin/google-signin` 替代已棄用的 `expo-auth-session`:

```typescript
// LoginScreen.tsx
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

useEffect(() => {
  GoogleSignin.configure({
    webClientId: '823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    offlineAccess: true,
  });
}, []);
```

---

## 🔍 故障排除

### 常見問題

#### 1. 端口被占用
```bash
# 查找占用端口的進程
netstat -ano | findstr :3000
netstat -ano | findstr :8081

# 結束進程
taskkill /F /PID [PID]
```

#### 2. 資料庫連接失敗
```bash
# 檢查 Docker 容器
docker ps | grep postgres

# 重啟 PostgreSQL 容器
docker restart challenge-app-postgres
```

#### 3. Android 構建失敗
```bash
# 清理構建緩存
cd challenge-app-frontend
rm -rf android
npx expo prebuild --clean

# 檢查 Gradle 緩存
./android/gradlew clean
```

#### 4. Google Sign-In 錯誤
- 確認使用 `@react-native-google-signin/google-signin`
- 檢查 Web Client ID 配置
- 確認 Google Play Services 可用

### 日誌檢查
```bash
# Android 應用日誌
adb logcat | grep -i "8bit\|google\|oauth"

# Metro bundler 日誌
npx expo start --port 8082

# 後端服務器日誌
cd challenge-app-backend && npm start
```

---

## 📚 文檔索引

### 主要文檔
- **[README.md](./README.md)**: 項目概述和快速開始
- **[SPEC.md](./SPEC.md)**: 詳細產品規格和功能說明
- **[CLAUDE.md](./CLAUDE.md)**: Claude Code 開發指南

### 設定指南
- **[SETUP.md](./SETUP.md)**: 基礎環境設定 (繁體中文)
- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)**: Google OAuth 跨平台配置

### 故障排除
- **[OAUTH_TROUBLESHOOTING.md](./OAUTH_TROUBLESHOOTING.md)**: Google OAuth 完整故障排除記錄
  - expo-auth-session 棄用問題
  - 遷移到 @react-native-google-signin 過程
  - Google Cloud Console 設定修正

### 技術細節
- **[Forme.md](./Forme.md)**: 開發筆記和設計決策

---

## 🧪 測試流程

### 1. 完整測試清單
```bash
# 1. 啟動所有服務
cd challenge-app-backend && npm start &
cd challenge-app-backend && npx prisma studio &

# 2. 構建並啟動 Android 應用
cd challenge-app-frontend
npx expo run:android

# 3. 測試 Google 登入
# - 在應用中點擊 Google Sign-In 按鈕
# - 完成 OAuth 流程
# - 檢查 Prisma Studio 中的用戶記錄

# 4. 測試多語言
# - 切換語言設定
# - 確認界面翻譯正確
```

### 2. 監控工具
- **Prisma Studio**: `http://localhost:5556` - 資料庫內容
- **後端 API**: `http://localhost:3000` - 服務器狀態
- **Metro Bundler**: `http://localhost:8081` - 前端打包狀態

---

## 🔄 持續集成建議

### Git Hooks
```bash
# 提交前檢查
npm run lint
npm run typecheck
npm test
```

### 自動化腳本
建議創建以下腳本：
- `scripts/dev-setup.sh`: 開發環境一鍵設定
- `scripts/test-android.sh`: Android 測試自動化
- `scripts/db-reset.sh`: 資料庫重置腳本

---

**最後更新**: 2025-08-16  
**支援的平台**: Android (主要)、Web (輔助)  
**資料庫**: PostgreSQL (Docker)  
**認證方式**: Google OAuth 2.0 (@react-native-google-signin)