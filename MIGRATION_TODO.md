# 房間系統實現待辦事項

## 🗄️ 資料庫遷移

### 立即執行
```bash
cd challenge-app-backend
npx prisma generate
npx prisma migrate dev --name "add_room_state_to_levels"
```

### 數據遷移腳本
需要為現有Level記錄設置預設roomState：
```javascript
// migration-room-state.js
const prisma = require('./src/models/prisma');

async function migrateExistingLevels() {
  const levels = await prisma.level.findMany({
    where: {
      roomState: {
        equals: {}  // 找出空的roomState
      }
    }
  });

  for (const level of levels) {
    await prisma.level.update({
      where: { id: level.id },
      data: {
        roomState: {
          scene: "default_room",
          theme: "classic", 
          items: [],
          progress: 0,
          locked: true,
          escapeCondition: {
            type: "daily_checkin",
            target: 30,
            current: 0
          }
        }
      }
    });
  }
}
```

## 🔧 API更新

### Level Controller 修改
- [ ] 在getLevels()回應中包含roomState
- [ ] 新增updateRoomProgress()方法
- [ ] 新增checkEscapeCondition()方法

### CheckIn Controller 修改  
- [ ] 在submitCheckin()成功後更新房間進度
- [ ] 檢查是否達到逃脫條件
- [ ] 觸發房間解鎖邏輯

### 新增API端點
```javascript
// 房間特定API
GET    /api/rooms/:id/progress        // 獲取房間進度
PUT    /api/rooms/:id/escape          // 處理逃脫成功
POST   /api/rooms/:id/unlock          // 解鎖房間
GET    /api/gallery                   // 獲取用戶畫廊
```

## 🎨 前端設計任務

### 新頁面設計
- [ ] **畫廊頁面** - 網格展示所有房間
- [ ] **工作室頁面** - 沈浸式房間視圖  
- [ ] **房間創建流程** - 主題選擇和設定
- [ ] **個人像素小屋** - 收集品展示

### UI組件開發
- [ ] RoomCard - 房間卡片組件
- [ ] ProgressBar - 逃脫進度條
- [ ] ThemeSelector - 房間主題選擇器
- [ ] EscapeButton - 逃脫嘗試按鈕

### 動畫效果
- [ ] 房間解鎖動畫
- [ ] 進度填充動畫  
- [ ] 主題切換轉場
- [ ] 成功逃脫慶祝效果

## 🧪 測試更新

### Backend 測試
- [ ] 更新Level API測試包含roomState
- [ ] 新增房間進度更新測試
- [ ] 測試逃脫條件觸發邏輯

### Frontend 測試  
- [ ] 房間頁面組件測試
- [ ] 畫廊頁面互動測試
- [ ] 房間狀態管理測試

## 📱 移動端考慮

### 性能優化
- [ ] 房間主題圖片預加載
- [ ] 進度動畫優化
- [ ] 列表滾動性能

### 用戶體驗
- [ ] 房間創建引導流程
- [ ] 首次使用教學
- [ ] 離線狀態處理

---

## ⏰ 時程建議

**第一週**: 資料庫遷移 + API更新
**第二週**: 前端頁面設計 + 基礎組件  
**第三週**: 動畫效果 + 測試
**第四週**: 優化 + 部署

這個改動會讓8-Bit Habits變得更有沈浸感和趣味性！🎮✨