# 8-Bit Habits API 參考文檔

**版本**: 3.0  
**基礎 URL**: `http://localhost:3000/api`  
**認證**: Bearer JWT Token

## 概述

8-Bit Habits API 提供完整的關卡管理和打卡系統功能。所有需要認證的端點都需要在 Header 中包含有效的 JWT Token。

### 認證 Header
```
Authorization: Bearer <JWT_TOKEN>
```

### 標準響應格式

#### 成功響應
```json
{
  "success": true,
  "message": "操作成功",
  "data": { /* 實際資料 */ }
}
```

#### 錯誤響應
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "錯誤描述"
}
```

### HTTP 狀態碼
- `200` - 成功
- `201` - 創建成功
- `400` - 請求錯誤
- `401` - 未認證
- `403` - 無權限
- `404` - 資源不存在
- `409` - 衝突
- `500` - 伺服器錯誤

## 關卡管理 API

### 1. 創建關卡

**端點**: `POST /levels`  
**認證**: 必需  
**權限**: 所有認證用戶

#### 請求參數
```json
{
  "name": "30天運動挑戰",                    // 必需，關卡名稱
  "description": "每日運動30分鐘",            // 可選，關卡描述
  "rule": {                                  // 可選，規則設定
    "startTime": "06:00",                    // 每日開始時間 (HH:MM)
    "endTime": "22:00",                      // 每日結束時間 (HH:MM)
    "maxMissedDays": 3                       // 最大連續漏打卡天數
  },
  "settings": {                              // 可選，隱私設定
    "checkinContentVisibility": "public"    // "public" | "private" | "creatorOnly"
  },
  "startDate": "2025-08-20T00:00:00Z",      // 可選，開始日期
  "endDate": "2025-09-20T00:00:00Z"         // 可選，結束日期
}
```

#### 響應範例
```json
{
  "success": true,
  "message": "關卡創建成功",
  "level": {
    "id": "level-uuid",
    "name": "30天運動挑戰",
    "description": "每日運動30分鐘",
    "inviteCode": "ABCD1234",
    "isActive": true,
    "rule": {
      "startTime": "06:00",
      "endTime": "22:00",
      "maxMissedDays": 3
    },
    "settings": {
      "checkinContentVisibility": "public"
    },
    "startDate": "2025-08-20T00:00:00Z",
    "endDate": "2025-09-20T00:00:00Z",
    "createdAt": "2025-08-16T10:00:00Z",
    "userRole": "CREATOR",
    "isOwner": true,
    "memberCount": 1
  }
}
```

### 2. 獲取關卡列表

**端點**: `GET /levels`  
**認證**: 必需  
**權限**: 所有認證用戶

#### 響應範例
```json
{
  "success": true,
  "levels": [
    {
      "id": "level-uuid",
      "name": "30天運動挑戰",
      "description": "每日運動30分鐘",
      "inviteCode": "ABCD1234",
      "isActive": true,
      "userRole": "CREATOR",
      "memberCount": 5,
      "isOwner": true,
      "createdAt": "2025-08-16T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 3. 透過邀請碼加入關卡 (推薦)

**端點**: `POST /levels/join`  
**認證**: 必需  
**權限**: 所有認證用戶

#### 請求參數
```json
{
  "inviteCode": "ABCD1234"  // 必需，8字符邀請碼
}
```

#### 響應範例
```json
{
  "success": true,
  "message": "Successfully joined level: 30天運動挑戰",
  "level": {
    "id": "level-uuid",
    "name": "30天運動挑戰",
    "description": "每日運動30分鐘",
    "isActive": true,
    "userRole": "PLAYER",
    "isOwner": false,
    "memberCount": 6,
    "createdAt": "2025-08-16T10:00:00Z"
  }
}
```

### 4. 加入關卡 (舊版)

**端點**: `POST /levels/:id/join`  
**認證**: 必需  
**權限**: 所有認證用戶  
**注意**: 此端點需要預先知道關卡ID，建議使用 `POST /levels/join`

#### 請求參數
```json
{
  "inviteCode": "ABCD1234"  // 必需，8字符邀請碼
}
```

#### 響應範例
```json
{
  "success": true,
  "message": "Successfully joined level",
  "level": {
    "id": "level-uuid",
    "name": "30天運動挑戰",
    "userRole": "PLAYER",
    "isOwner": false,
    "memberCount": 6
  }
}
```

### 5. 獲取關卡詳情

**端點**: `GET /levels/:id`  
**認證**: 必需  
**權限**: 關卡成員

#### 響應範例
```json
{
  "success": true,
  "level": {
    "id": "level-uuid",
    "name": "30天運動挑戰",
    "description": "每日運動30分鐘",
    "isActive": true,
    "rule": {
      "startTime": "06:00",
      "endTime": "22:00",
      "maxMissedDays": 3
    },
    "settings": {
      "checkinContentVisibility": "public"
    },
    "userRole": "PLAYER",
    "isOwner": false,
    "inviteCode": "ABCD1234",  // 僅 CREATOR 可見
    "members": [
      {
        "id": "member-uuid",
        "role": "CREATOR",
        "status": "ACTIVE",
        "joinedAt": "2025-08-16T10:00:00Z",
        "player": {
          "name": "創建者",
          "email": "creator@example.com"  // 根據隱私設定和角色過濾
        }
      }
    ],
    "memberCount": 5
  }
}
```

### 6. 更新成員角色

**端點**: `PUT /levels/:id/members/:memberId`  
**認證**: 必需  
**權限**: CREATOR

#### 請求參數
```json
{
  "role": "AUDIENCE"  // "PLAYER" | "AUDIENCE"
}
```

#### 響應範例
```json
{
  "success": true,
  "message": "成員角色更新成功",
  "member": {
    "id": "member-uuid",
    "role": "AUDIENCE",
    "player": {
      "name": "玩家名稱"
    }
  }
}
```

### 7. 移除成員

**端點**: `DELETE /levels/:id/members/:memberId`  
**認證**: 必需  
**權限**: CREATOR

#### 響應範例
```json
{
  "success": true,
  "message": "成員移除成功"
}
```

### 8. 更新關卡設定

**端點**: `PUT /levels/:id`  
**認證**: 必需  
**權限**: CREATOR

#### 請求參數
```json
{
  "name": "更新的關卡名稱",
  "description": "更新的描述",
  "rule": {
    "startTime": "07:00",
    "endTime": "21:00",
    "maxMissedDays": 2
  },
  "settings": {
    "checkinContentVisibility": "private"
  },
  "startDate": "2025-08-20T00:00:00Z",
  "endDate": "2025-09-20T00:00:00Z"
}
```

#### 響應範例
```json
{
  "success": true,
  "message": "關卡設定更新成功",
  "level": {
    "id": "level-uuid",
    "name": "更新的關卡名稱",
    "description": "更新的描述",
    "rule": {
      "startTime": "07:00",
      "endTime": "21:00",
      "maxMissedDays": 2
    },
    "settings": {
      "checkinContentVisibility": "private"
    },
    "updatedAt": "2025-08-16T11:00:00Z"
  }
}
```

### 9. 更新關卡狀態

**端點**: `PUT /levels/:id/status`  
**認證**: 必需  
**權限**: CREATOR

#### 請求參數
```json
{
  "isActive": false  // true 或 false
}
```

#### 響應範例
```json
{
  "success": true,
  "message": "關卡狀態更新成功",
  "level": {
    "id": "level-uuid",
    "isActive": false,
    "updatedAt": "2025-08-16T11:00:00Z"
  }
}
```

## 錯誤代碼參考

### 認證錯誤
- `INVALID_TOKEN` - Token 無效或過期
- `NO_TOKEN` - 缺少認證 Token
- `USER_NOT_FOUND` - 用戶不存在

### 關卡錯誤
- `LEVEL_NOT_FOUND` - 關卡不存在
- `INVALID_INVITE_CODE` - 邀請碼無效
- `LEVEL_NOT_ACTIVE` - 關卡未啟用
- `ALREADY_MEMBER` - 用戶已是成員
- `INSUFFICIENT_PERMISSION` - 權限不足
- `INVALID_TIME_FORMAT` - 時間格式錯誤
- `INVALID_ROLE` - 角色無效
- `CANNOT_MODIFY_CREATOR` - 無法修改創建者
- `LEVEL_COMPLETED` - 關卡已完成

### 成員錯誤
- `MEMBER_NOT_FOUND` - 成員不存在
- `CANNOT_REMOVE_CREATOR` - 無法移除創建者
- `ROLE_CHANGE_CONFLICT` - 角色變更衝突

## 角色權限說明

### CREATOR (創建者)
- 完全控制關卡
- 管理所有成員
- 修改關卡設定
- 查看所有資料（包含邀請碼、成員郵箱等）

### PLAYER (玩家)  
- 查看關卡詳情
- 查看其他成員資訊（受隱私設定限制）
- 進行打卡操作

### AUDIENCE (觀眾)
- 查看基本關卡資訊
- 有限的成員資訊查看
- 無打卡權限

## 隱私設定說明

### Public (公開)
- 所有成員可查看打卡內容
- 成員資訊對所有角色可見

### Private (私人)
- 僅本人和 CREATOR 可查看打卡內容
- 成員郵箱僅 CREATOR 可見

### CreatorOnly (僅創建者)
- 僅 CREATOR 可查看所有內容
- 其他成員僅能看到基本資訊

## 開發和測試

### 本地測試
```bash
# 啟動後端服務
cd challenge-app-backend
npm run dev

# 運行測試
npm test

# 查看資料庫 (Prisma Studio)
npx prisma studio --port 5557
```

### 測試帳號
開發環境中可以使用測試用的 JWT Token 進行 API 測試。

---

**更新日期**: 2025-08-17  
**API 版本**: v3.0  
**文檔版本**: 3.0