# Google OAuth 故障排除記錄

## 問題描述
在 Android 模擬器上測試 Google OAuth 登入時遇到多個問題：
1. 用戶成功登入 Google 後直接跳轉到 Google 搜尋頁面，而不是返回應用程式
2. 出現 "invalid_request" 錯誤，提示不符合 Google OAuth 2.0 政策
3. 按鈕卡在 "signing in..." 狀態

## 已嘗試的解決方法

### 1. 基本配置檢查 ✅
- 確認 Google Cloud Console 中的客戶端 ID 配置正確
- Web Client ID: `823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com`
- Android Client ID: `823839716704-3r9n24pa9vo7lpde7n7eu19hmdg61c0g.apps.googleusercontent.com`

### 2. OAuth 同意螢幕設定 ✅
- 應用程式名稱：修正為 "8-Bit Habits"
- 授權網域：僅保留 `expo.io`，移除 `auth.expo.io`

### 3. Android 客戶端設定 ✅
- 套件名稱：`com.anonymous.eightbithabits`
- SHA-1 指紋：`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **自訂 URI 配置：已啟用** ✅

### 4. Web 客戶端重新導向 URI 清理 ⚠️
需要從 Web 客戶端中移除：`https://auth.expo.io/`
保留：
- `https://auth.expo.io/@lai-wen/8-bit-habits`
- localhost 相關 URI

### 5. expo-auth-session 實現
使用 `expo-auth-session/providers/google` 進行 OAuth 流程：
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: 'xxx',
  androidClientId: 'xxx',
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code',
});
```

## 當前問題分析

### Android OAuth 客戶端特性
- **重要發現**：Android OAuth 客戶端**沒有**「已授權的重新導向 URI」欄位
- Android 客戶端依賴：
  1. 套件名稱 (`com.anonymous.eightbithabits`)
  2. SHA-1 指紋
  3. 自訂 URI 配置設定

### 問題根因推測
1. **Redirect URI 不匹配**：
   - 應用使用：`com.anonymous.eightbithabits:/oauthredirect`
   - app.json scheme：`eightbithabits`
   - 可能需要使用：`eightbithabits://oauth`

2. **Expo Auth Session 預設行為**：
   - 可能需要讓 expo-auth-session 自動處理 redirect URI
   - 不手動指定 redirectUri 參數

## 完整解決方案進展

### ❌ 方案 A：使用 Expo 預設 Auth 流程 - 失敗
移除手動 redirectUri 設定，讓 expo-auth-session 自動處理：
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: 'xxx',
  androidClientId: 'xxx',
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code',
  // 不指定 redirectUri，讓 Expo 自動處理
});
```
**問題**：仍然使用 `com.anonymous.eightbithabits:/oauthredirect`，Google 無法識別，登入後跳轉到搜尋頁面

### ❌ 方案 B：使用 AuthSession.makeRedirectUri - 失敗
嘗試使用 Expo 的 redirect URI 生成器：
```typescript
redirectUri: AuthSession.makeRedirectUri({
  useProxy: true,
}),
```
**問題**：
1. 最初錯誤：`AuthRequest.makeRedirectUri is not a function`
2. 修正後生成：`eightbithabits://` scheme
3. Google 拒絕：顯示 "invalid_request" 錯誤，不符合 OAuth 2.0 政策

### ✅ 方案 C：直接使用 HTTPS Redirect URI - 成功
直接指定符合 Google OAuth 2.0 政策的 HTTPS redirect URI：
```typescript
redirectUri: 'https://auth.expo.io/@lai-wen/8-bit-habits',
```
**優點**：
- 符合 Google OAuth 2.0 安全政策要求
- 與 Google Cloud Console Web 客戶端設定匹配
- Expo 可以正確處理此 HTTPS 回調

## 關鍵發現

### Google OAuth 2.0 政策要求
- ❌ 自訂 URI scheme (如 `eightbithabits://`) 不被接受
- ❌ 包名 scheme (如 `com.anonymous.eightbithabits://`) 不被接受
- ✅ 必須使用 HTTPS 協議的 redirect URI
- ✅ redirect URI 必須在 Google Cloud Console 中預先註冊

### Android 與 Web OAuth 客戶端差異
- **Web 客戶端**：需要完整的 HTTPS redirect URI 清單
- **Android 客戶端**：主要依賴套件名稱 + SHA-1 指紋 + 自訂 URI 配置
- **Expo 應用**：實際上使用 Web OAuth 客戶端進行認證

## 技術細節

### Expo OAuth 流程說明
1. **發起請求**：應用呼叫 `promptAsync()` 開啟瀏覽器
2. **用戶授權**：用戶在 Google 頁面登入並授權
3. **回調處理**：Google 將授權碼發送到 redirect URI
4. **Deep Link**：redirect URI 觸發 deep link 返回應用
5. **Token 交換**：應用使用授權碼交換 access token

### Deep Link 機制
- Android：使用 Intent Filter 攔截自訂 URI scheme
- iOS：使用 URL Scheme 處理
- Expo：自動處理這些機制

## 最終解決方案

### 正確的 OAuth 配置
```typescript
// src/screens/LoginScreen.tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com',
  androidClientId: '823839716704-3r9n24pa9vo7lpde7n7eu19hmdg61c0g.apps.googleusercontent.com',
  scopes: ['openid', 'profile', 'email'],
  // 使用符合 Google OAuth 2.0 政策的 HTTPS redirect URI
  redirectUri: 'https://auth.expo.io/@lai-wen/8-bit-habits',
});
```

### 必要的 Google Cloud Console 設定
1. **Web 客戶端**已授權重新導向 URI：
   - `https://auth.expo.io/@lai-wen/8-bit-habits` ✅
   - `http://localhost:xxxx` (開發用) ✅

2. **Android 客戶端**設定：
   - 套件名稱：`com.anonymous.eightbithabits` ✅
   - SHA-1 指紋：`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` ✅
   - 自訂 URI 配置：已啟用 ✅

3. **OAuth 同意螢幕**：
   - 應用程式名稱：`8-Bit Habits` ✅
   - 授權網域：只保留 `expo.io` ✅

## 問題解決進展

### 🚨 根本原因發現：expo-auth-session 已被棄用

**重要發現**：根據 [Expo GitHub Issue #32468](https://github.com/expo/expo/issues/32468)：

> "this api is deprecated... we recommend using a wrapper around the google sign in sdk such as @react-native-google-signin/google-signin"
> 
> — Brent Vatne (Expo 維護者, 2024年11月)

**問題根源**：
- `expo-auth-session/providers/google` 已被 Expo 官方棄用
- 這正是我們遇到 `redirect_uri_mismatch` 錯誤的根本原因
- 官方推薦遷移到 `@react-native-google-signin/google-signin`

### 臨時解決方案（redirect_uri_mismatch 修正）
在等待遷移期間，添加了備用 redirect URI：
- `https://auth.expo.io/@lai-wen/8-bit-habits` ✅
- `https://auth.expo.io/@lai-wen/8bithabits` ✅ (備用格式)

### 當前應用使用的 redirect URI
根據日誌顯示，應用使用：`https://auth.expo.io/@lai-wen/8-bit-habits`

## 推薦的長期解決方案

### 遷移到 @react-native-google-signin/google-signin

**優點**：
- Expo 官方推薦
- 專門為 React Native 設計的 Google 登入套件
- 更穩定的 Android 支援
- 不依賴 expo-auth-session

**實施步驟**：
1. 安裝套件：`npx expo install @react-native-google-signin/google-signin`
2. 配置 Google Cloud Console（使用現有的 Android OAuth 客戶端）
3. 替換 `expo-auth-session` 相關代碼
4. 測試 Android 和 Web 平台

**參考文檔**：
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/google-authentication/)
- [@react-native-google-signin 官方文檔](https://github.com/react-native-google-signin/google-signin)

## 已完成驗證
- ✅ 應用成功編譯並安裝到 Android 模擬器
- ✅ Metro bundler 正常運行並連接應用
- ✅ OAuth 配置修正：使用 HTTPS redirect URI
- ✅ Google Cloud Console 設定清理完成
- ✅ redirect_uri_mismatch 錯誤修正：添加備用 redirect URI
- ✅ 根本原因識別：expo-auth-session 已棄用
- ✅ **完整遷移到 @react-native-google-signin/google-signin**
- ✅ 新實現成功構建並在 Android 模擬器運行
- ✅ Google Sign-In 配置正確載入（Web Client ID: 823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com）
- ✅ 資料庫架構已更新並運行（PostgreSQL + Prisma）
- ✅ 後端服務器運行中（http://localhost:3000）
- ✅ Prisma Studio 已開啟（http://localhost:5555）用於檢查用戶登入記錄

### 最終實現詳情
**新的 Google Sign-In 實現**：
```typescript
// src/screens/LoginScreen.tsx
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

useEffect(() => {
  GoogleSignin.configure({
    webClientId: '823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    offlineAccess: true,
  });
}, []);

const handleGoogleLogin = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    const success = await login(tokens.accessToken);
    // 處理成功/失敗
  } catch (error) {
    // 處理各種錯誤代碼
  }
};
```

**資料庫架構**：
- PostgreSQL 資料庫：`challengeapp`
- 用戶表：包含 googleId, email, name, avatarUrl, language 欄位
- 完整的 migration 已執行並同步

## 相關檔案
- `src/screens/LoginScreen.tsx` - OAuth 實現
- `app.json` - Expo 配置 (scheme: "eightbithabits")
- Google Cloud Console - OAuth 客戶端設定

## 更新日期
2025-08-15 - 初始記錄