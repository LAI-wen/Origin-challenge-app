# 🎮 8-Bit Habits 設定指南

## 快速開始

### 1. 安裝依賴

```bash
# 安裝後端依賴
cd challenge-app-backend
npm install

# 安裝前端依賴  
cd ../challenge-app-frontend
npm install
```

### 2. 設定資料庫

你需要 PostgreSQL 資料庫。可以選擇：

#### 選項 A: 本地 PostgreSQL
```bash
# 創建資料庫
createdb challenge_app

# 更新 .env 中的 DATABASE_URL
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/challenge_app"
```

#### 選項 B: 使用 Docker
```bash
docker run --name postgres-8bit \
  -e POSTGRES_PASSWORD=123456789 \
  -e POSTGRES_DB=challenge_db \
  -p 5432:5432 \
  -d postgres:15
```

### 3. 執行資料庫 Migration

```bash
cd challenge-app-backend
npx prisma generate
npx prisma migrate deploy
```

### 4. 啟動開發伺服器

#### 啟動後端：
```bash
cd challenge-app-backend
npm run dev  # 或 npm start
```
後端會在 http://localhost:3000 運行

#### 啟動前端：
```bash
cd challenge-app-frontend  
npm start
```

## 🔧 詳細配置

### Google OAuth 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 "Google+ API" 和 "Google OAuth2 API"
4. 建立 OAuth 2.0 憑證：
   - 應用程式類型：Web 應用程式
   - 授權重新導向 URI：`https://auth.expo.io/@your-username/8bithabits`
5. 複製 Client ID 和 Client Secret

### 環境變數設定

編輯 `challenge-app-backend/.env`：

```env
# 資料庫連接
DATABASE_URL="postgresql://username:password@localhost:5432/challenge_app"

# Google OAuth (從 Google Cloud Console 取得)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# JWT 密鑰 (產生新的)
JWT_SECRET="$(openssl rand -base64 32)"

# 伺服器設定
PORT=3000
NODE_ENV=development
```

## 📱 行動裝置測試

### iOS 模擬器
```bash
npm run ios
```

### Android 模擬器  
```bash
npm run android
```

### 實體裝置
1. 安裝 Expo Go app
2. 掃描 QR code

## 🧪 測試設定

### 測試後端 API
```bash
curl http://localhost:3000/health
```

應該返回：
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 測試登入流程
1. 啟動前後端
2. 在前端點擊 Google 登入
3. 完成 OAuth 流程
4. 檢查是否成功存儲用戶資料

## 🔍 疑難排解

### 資料庫連接失敗
- 確認 PostgreSQL 正在運行
- 檢查 `DATABASE_URL` 格式
- 確認資料庫存在

### Google OAuth 錯誤
- 檢查 Client ID 是否正確
- 確認重新導向 URI 設定
- 檢查 Google Cloud Console 中的 API 是否啟用

### Expo 相關問題
- 清除快取：`npx expo start -c`
- 重新安裝：`rm -rf node_modules && npm install`

## 🚀 部署準備

### 環境變數檢查清單
- [ ] `DATABASE_URL` 指向生產資料庫
- [ ] `JWT_SECRET` 使用強密鑰
- [ ] `GOOGLE_CLIENT_ID` 配置正確
- [ ] `NODE_ENV=production`

### 安全檢查
- [ ] 敏感檔案在 `.gitignore` 中
- [ ] `secrets/` 目錄未提交
- [ ] 生產環境使用 HTTPS