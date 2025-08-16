# 資料庫設計更新 - 2025-08-16: V1.0 → V3.0 遷移

## 📋 **遷移概況**

**目標**: 將現有資料庫從 V1.0 升級至 V3.0，整合新規格需求並保留原有功能優勢

**風險等級**: 🟡 中等 (涉及結構性變更)

**預計影響**: 30分鐘停機時間

## 🔄 **主要變更摘要**

### **1. 命名變更**
- `users` → `players` (更符合遊戲概念)
- 所有主鍵從 `CUID` → `UUID`

### **2. 新增核心功能**
- **像素小屋系統**: `pixelAbodeState` JSONB 欄位
- **成就系統**: `achievements` + `player_achievements` 表
- **測驗系統**: `quizzes` + `quiz_questions` + `quiz_attempts` 表
- **社交系統基礎**: `friendships` + `notifications` 表

### **3. 結構優化**
- **CheckIn 正規化**: 透過 `LevelMember` 關聯而非直接 Player-Level
- **新增 GHOST 狀態**: 支援"幽靈模式"功能
- **擴展 JSON 配置**: 更靈活的規則和設定管理

## 🚀 **安全遷移方案**

### **Phase 1: 準備階段**
```bash
# 1. 停止應用服務
pm2 stop challenge-app-backend

# 2. 資料庫備份
pg_dump challengeapp > backup_v1_$(date +%Y%m%d_%H%M%S).sql

# 3. 創建測試環境
docker run --name challenge-app-postgres-test \
  -e POSTGRES_PASSWORD=challengeapp_password \
  -e POSTGRES_DB=challengeapp_test \
  -e POSTGRES_USER=challengeapp \
  -p 5433:5432 -d postgres:15
```

### **Phase 2: Prisma 遷移**
```bash
# 1. 備份當前 schema
cp prisma/schema.prisma prisma/schema-v1-backup.prisma

# 2. 更新至 V3 schema
cp prisma/schema-v3.prisma prisma/schema.prisma

# 3. 生成遷移
npx prisma migrate dev --name "upgrade-to-v3-structure"

# 4. 在測試環境驗證
DATABASE_URL="postgresql://challengeapp:challengeapp_password@localhost:5433/challengeapp_test" \
npx prisma migrate deploy
```

### **Phase 3: 資料遷移**
```javascript
// data-migration-v3.js
const { PrismaClient } = require('@prisma/client');

async function migrateToV3() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting V3 migration...');
    
    // 1. 遷移現有用戶資料
    const users = await prisma.user.findMany();
    for (const user of users) {
      await prisma.player.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          googleId: user.googleId,
          language: user.language,
          pixelAbodeState: {
            scene: "default_room",
            items: [],
            layout: {}
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    
    // 2. 插入初始成就資料
    const achievements = [
      {
        name: '初心者',
        description: '完成第一次打卡',
        iconName: 'pixel_star',
        triggerRule: { type: 'first_checkin' }
      },
      {
        name: '堅持者', 
        description: '連續打卡7天',
        iconName: 'pixel_trophy',
        triggerRule: { type: 'consecutive_days', count: 7 }
      },
      {
        name: '完美主義者',
        description: '在一個賽季中零漏打卡', 
        iconName: 'pixel_crown',
        triggerRule: { type: 'perfect_season' }
      }
    ];
    
    for (const achievement of achievements) {
      await prisma.achievement.create({ data: achievement });
    }
    
    console.log('✅ V3 migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
```

### **Phase 4: 驗證階段**
```bash
# 1. 資料完整性檢查
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const playerCount = await prisma.player.count();
  const achievementCount = await prisma.achievement.count();
  
  console.log('📊 Verification Results:');
  console.log(\`Players: \${playerCount}\`);
  console.log(\`Achievements: \${achievementCount}\`);
  
  await prisma.\$disconnect();
}
verify();
"

# 2. 應用程式測試
npm test

# 3. 重啟服務
pm2 start challenge-app-backend
```

## 🛡️ **回滾計劃**

如果遷移失敗，執行以下回滾步驟：

```bash
# 1. 停止服務
pm2 stop challenge-app-backend

# 2. 恢復資料庫
psql -d challengeapp < backup_v1_YYYYMMDD_HHMMSS.sql

# 3. 恢復 schema
cp prisma/schema-v1-backup.prisma prisma/schema.prisma

# 4. 重新生成 Prisma client
npx prisma generate

# 5. 重啟服務
pm2 start challenge-app-backend
```

## 📊 **遷移預期結果**

### **資料表變更**
| **表名** | **V1.0** | **V3.0** | **變更類型** |
|---|---|---|---|
| `users` | ✅ | ❌ → `players` | 重命名 + 欄位新增 |
| `levels` | ✅ | ✅ | 欄位優化 |
| `level_members` | ✅ | ✅ | 狀態擴展 |
| `check_ins` | ✅ | ✅ | 關聯結構變更 |
| `keep_notes` | ✅ | ✅ | 保持不變 |
| `achievements` | ❌ | ✅ | 新增 |
| `player_achievements` | ❌ | ✅ | 新增 |
| `quizzes` | ❌ | ✅ | 新增 |
| `quiz_questions` | ❌ | ✅ | 新增 |
| `quiz_attempts` | ❌ | ✅ | 新增 |
| `friendships` | ❌ | ✅ | 新增 |
| `notifications` | ❌ | ✅ | 新增 |

### **功能影響評估**
- ✅ **Google OAuth**: 完全相容
- ✅ **現有用戶資料**: 無損遷移
- ✅ **國際化**: 保持現有功能
- 🆕 **像素小屋**: 新功能可用
- 🆕 **成就系統**: 新功能可用
- 🆕 **社交基礎**: 為 Phase 3 準備

## ⏰ **執行時程**

- **準備時間**: 15分鐘
- **遷移執行**: 10分鐘  
- **驗證測試**: 5分鐘
- **總停機時間**: ≤ 30分鐘

## 🎯 **遷移後驗證清單**

- [ ] 現有用戶能正常登入
- [ ] 用戶資料完整保留
- [ ] 新的像素小屋狀態正確初始化
- [ ] 成就系統資料正確載入
- [ ] API 回應正常
- [ ] 前端功能無異常

---

**📝 遷移執行者**: 開發團隊  
**📅 計劃執行時間**: 2025-08-16 待定  
**🔄 狀態**: 規劃中