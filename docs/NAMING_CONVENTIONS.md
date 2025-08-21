# 命名規則 (Naming Conventions)

## 📋 概述
統一的命名規則確保程式碼可讀性和維護性。

## 🎯 核心原則
1. **描述性**: 名稱應該清楚描述功能或內容
2. **一致性**: 在整個專案中保持相同的命名模式
3. **簡潔性**: 避免不必要的縮寫，但也不要過度冗長
4. **英文優先**: 變數和函數使用英文，註解可用中文

## 📁 檔案和目錄命名

### 前端 (React Native)
```
src/
├── components/
│   ├── ui/              # UI組件
│   └── forms/           # 表單組件
├── screens/             # 頁面組件
├── services/            # API服務
├── contexts/            # React Context
├── hooks/               # 自定義Hook
├── utils/               # 工具函數
└── styles/              # 樣式定義
```

### 後端 (Node.js/Express)
```
src/
├── controllers/         # 控制器
├── routes/             # 路由定義
├── middleware/         # 中間件
├── models/             # 資料模型
├── services/           # 業務邏輯服務
└── utils/              # 工具函數
```

## 🔤 變數命名規則

### TypeScript/JavaScript (前端)
- **camelCase**: 變數、函數、方法
- **PascalCase**: 組件、類別、接口、類型
- **SCREAMING_SNAKE_CASE**: 常數

```typescript
// ✅ 正確
const userName = 'john';
const isLoggedIn = true;
const currentUser = { id: 1, name: 'John' };

function submitCheckin(data: CheckinRequest) { }
const handleButtonClick = () => { };

interface CheckinRequest { }
type UserRole = 'CREATOR' | 'PLAYER';
class UserService { }

const API_BASE_URL = 'http://localhost:3000';
const MAX_RETRY_COUNT = 3;

// ❌ 錯誤
const user_name = 'john';          // snake_case (不推薦)
const isloggedin = true;           // 缺少駝峰
const CURRENTUSER = { };           // 全大寫變數
function SubmitCheckin() { }       // 函數使用PascalCase
```

### Node.js/Express (後端)
- **camelCase**: 變數、函數
- **PascalCase**: 類別、模型
- **snake_case**: 資料庫欄位 (Prisma會自動映射)

```javascript
// ✅ 正確
const userId = req.user.id;
const levelMember = await prisma.levelMember.findFirst();

function createLevel(data) { }
const submitCheckin = async (req, res) => { };

class CheckinService { }

// 資料庫欄位 (Prisma自動映射)
// created_at -> createdAt
// level_id -> levelId
```

## 🏷️ 常用變數名稱對照表

### 身分識別
```typescript
// 使用者相關
userId / playerId         // 使用者ID  
currentUser / player      // 當前使用者
userName / playerName     // 使用者名稱
userRole / role          // 使用者角色 ('CREATOR' | 'PLAYER')
isOwner / isCreator      // 是否為擁有者
```

### 房間/關卡相關
```typescript
levelId / roomId         // 房間/關卡ID
levelName / roomName     // 房間名稱
inviteCode              // 邀請碼
levelMember / roomMember // 房間成員
memberCount             // 成員數量
isActive                // 是否啟用
roomState               // 房間狀態
escapeCondition         // 逃脫條件
```

### 打卡相關
```typescript
checkinId               // 打卡ID
checkinType             // 打卡類型 ('TEXT' | 'IMAGE' | 'CHECKMARK')
checkinContent / content // 打卡內容
hasCheckedIn            // 是否已打卡
todayCheckin            // 今日打卡
checkinHistory          // 打卡歷史
timeWindow              // 時間窗口
consecutiveDays         // 連續天數
```

### 時間相關
```typescript
createdAt / updatedAt   // 建立/更新時間
startTime / endTime     // 開始/結束時間
startDate / endDate     // 開始/結束日期
currentTime             // 當前時間
timeRemaining           // 剩餘時間
isWithinWindow          // 是否在時間窗口內
```

### 狀態管理
```typescript
isLoading               // 載入中
isSubmitting            // 提交中
isError / hasError      // 錯誤狀態
errorMessage            // 錯誤訊息
isSuccess               // 成功狀態
isEmpty                 // 是否為空
isVisible / isHidden    // 顯示/隱藏狀態
```

### API相關
```typescript
apiRequest / request    // API請求
apiResponse / response  // API回應
apiError               // API錯誤
endpoint               // API端點
statusCode             // 狀態碼
```

## 🎨 UI組件命名

### 組件名稱
```typescript
// ✅ 正確 - 描述性的組件名
CheckinScreen           // 打卡畫面
LevelListScreen         // 關卡列表畫面
PixelButton            // 像素風格按鈕
RoomProgress           // 房間進度
LoadingSpinner         // 載入動畫

// ❌ 錯誤 - 太籠統或縮寫
Screen1                // 不描述功能
Btn                    // 過度縮寫
Component              // 太籠統
```

### Props命名
```typescript
interface ButtonProps {
  title: string;           // 按鈕文字
  onPress: () => void;     // 點擊事件
  variant: 'primary' | 'secondary'; // 變體
  disabled?: boolean;      // 是否禁用
  loading?: boolean;       // 載入狀態
}

interface ScreenProps {
  onBack: () => void;      // 返回功能
  onNavigate: (id: string) => void; // 導航功能
}
```

## 📊 API路由命名

### RESTful規則
```
GET    /api/levels              # 獲取關卡列表
POST   /api/levels              # 創建關卡
GET    /api/levels/:id          # 獲取特定關卡
PUT    /api/levels/:id          # 更新關卡
DELETE /api/levels/:id          # 刪除關卡

POST   /api/checkin/:levelId    # 提交打卡
GET    /api/checkin/:levelId/today # 獲取今日狀態
```

### Controller方法命名
```javascript
// ✅ 動詞+名詞
createLevel
getLevels
updateLevel
deleteLevel
submitCheckin
getTodayStatus
```

## 🛠️ 函數命名模式

### 事件處理函數
```typescript
const handleSubmit = () => { };      // 處理提交
const handleInputChange = () => { };  // 處理輸入變化
const handleImagePicker = () => { }; // 處理圖片選擇
const onBackPress = () => { };       // 返回按鈕
const onNavigateToCheckin = () => { }; // 導航到打卡
```

### 資料獲取函數
```typescript
const fetchLevels = () => { };       // 獲取關卡
const loadTodayStatus = () => { };   // 載入今日狀態
const refreshData = () => { };       // 刷新資料
```

### 驗證函數
```typescript
const validateInput = () => { };     // 驗證輸入
const isValidEmail = () => { };      // 檢查email格式
const hasPermission = () => { };     // 檢查權限
```

## 🔍 常見錯誤避免

### ❌ 避免的命名
```typescript
// 太短或無意義
const d = new Date();        // 應該用 currentDate
const u = req.user;         // 應該用 currentUser
const data = response;      // 應該用具體的資料名稱

// 匈牙利命名法 (不推薦在現代JS/TS中)
const strUserName = 'john'; // 應該用 userName
const bIsLoading = true;    // 應該用 isLoading

// 過度縮寫
const usrMgr = new UserManager(); // 應該用 userManager
const chkIn = checkin;            // 應該用 checkin
```

### ✅ 推薦的命名
```typescript
// 清楚描述用途
const currentDate = new Date();
const authenticatedUser = req.user;
const checkinResponse = await api.submitCheckin();

// 布林值使用 is/has/can 前綴
const isAuthenticated = !!user;
const hasPermission = user.role === 'ADMIN';
const canDelete = isOwner && level.isActive;

// 陣列使用複數
const levels = await fetchLevels();
const checkins = await getHistory();
const members = level.members;
```

## 📚 參考資源
- [TypeScript 官方風格指南](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [React 命名慣例](https://react.dev/learn/describing-the-ui)
- [Node.js 最佳實踐](https://github.com/goldbergyoni/nodebestpractices)