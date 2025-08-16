# Google OAuth 跨平台設定指南

## 概述
本項目需要支援 Web 和 Android 兩個平台的 Google 登入功能，因此需要不同的 OAuth 配置。

## Google Cloud Console 設定

### 1. Web 應用程式 OAuth Client
- **用途**: Web 版本 (expo web)
- **應用程式類型**: Web application
- **Client ID**: `823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com`
- **授權重新導向 URI**: 
  - `https://auth.expo.io/@your-username/your-app-slug`
  - `http://localhost:19000` (開發用)

### 2. Android OAuth Client  
- **用途**: Android 版本
- **應用程式類型**: Android
- **Client ID**: `823839716704-3r9n24pa9vo7lpde7n7eu19hmdg61c0g.apps.googleusercontent.com`
- **套件名稱**: `com.anonymous.eightbithabits`
- **SHA-1 憑證指紋**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

## 平台檢測實作策略

```typescript
import { Platform } from 'react-native';

const handleGoogleLogin = async () => {
  if (Platform.OS === 'web') {
    // 使用 WebBrowser + AuthSession
    // 適用於 Web Client ID
  } else {
    // 使用 @react-native-google-signin/google-signin
    // 適用於 Android Client ID
  }
};
```

## 當前狀態

### ✅ 已完成
- Android OAuth Client 設定完成
- Android SHA-1 憑證指紋已取得
- Web OAuth Client ID 已提供
- 跨平台檢測邏輯已實作

### 🔄 待處理
- 重新編譯 Android 應用程式
- 測試兩個平台的登入流程

## 問題記錄

### 目前問題
- Android 版本出現 "doesn't comply with Google's OAuth 2.0 policy" 錯誤
- 原因：使用 Web OAuth 流程在 Android 上不符合 Google 安全政策

### 解決方案
- Web 平台：繼續使用 WebBrowser + AuthSession
- Android 平台：改用 @react-native-google-signin/google-signin 原生庫

## 測試流程

1. **Web 測試**: `npx expo start --web`
2. **Android 測試**: `npx expo run:android`
3. **確保兩個平台都能正常登入**