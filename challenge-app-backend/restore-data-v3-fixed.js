// 修復後的恢復數據到 V3.0 結構
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function restoreDataToV3() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 開始恢復數據到 V3.0 結構...');
    
    // 讀取備份數據
    const backupData = JSON.parse(fs.readFileSync('migration-backup.json', 'utf8'));
    
    // 1. 恢復用戶數據到 players 表 (使用新的 UUID)
    console.log('👥 恢復用戶數據到 players 表...');
    const userIdMapping = {}; // 舊ID -> 新ID 映射
    
    for (const user of backupData.users) {
      const newPlayer = await prisma.player.create({
        data: {
          // 讓 Prisma 自動生成新的 UUID
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
      
      // 記錄 ID 映射
      userIdMapping[user.id] = newPlayer.id;
      console.log(`  ✅ 遷移用戶: ${user.name} (${user.email})`);
      console.log(`     舊ID: ${user.id} -> 新ID: ${newPlayer.id}`);
    }
    
    // 2. 恢復關卡數據 (如果有)
    const levelIdMapping = {};
    if (backupData.levels.length > 0) {
      console.log('🎮 恢復關卡數據...');
      for (const level of backupData.levels) {
        const newLevel = await prisma.level.create({
          data: {
            name: level.name,
            description: level.description,
            inviteCode: level.inviteCode,
            ownerId: userIdMapping[level.ownerId], // 使用新的用戶 ID
            isActive: level.isActive,
            rule: level.rules || level.rule, // 處理欄位名稱變更
            settings: level.settings,
            startDate: level.startDate,
            endDate: level.endDate,
            createdAt: level.createdAt,
            updatedAt: level.updatedAt
          }
        });
        levelIdMapping[level.id] = newLevel.id;
        console.log(`  ✅ 遷移關卡: ${level.name}`);
      }
    }
    
    // 3. 恢復成員關係 (如果有)
    const memberIdMapping = {};
    if (backupData.levelMembers.length > 0) {
      console.log('👨‍👩‍👧‍👦 恢復成員關係...');
      for (const member of backupData.levelMembers) {
        const newMember = await prisma.levelMember.create({
          data: {
            playerId: userIdMapping[member.playerId],
            levelId: levelIdMapping[member.levelId],
            role: member.role,
            status: member.status,
            missedDays: member.missedDays,
            joinedAt: member.joinedAt,
            updatedAt: member.updatedAt
          }
        });
        memberIdMapping[member.id] = newMember.id;
      }
    }
    
    // 4. 恢復打卡記錄 (如果有)
    if (backupData.checkIns.length > 0) {
      console.log('✅ 恢復打卡記錄...');
      for (const checkIn of backupData.checkIns) {
        // 查找對應的 level_member
        const levelMember = await prisma.levelMember.findFirst({
          where: {
            playerId: userIdMapping[checkIn.playerId],
            levelId: levelIdMapping[checkIn.levelId]
          }
        });
        
        if (levelMember) {
          await prisma.checkIn.create({
            data: {
              levelMemberId: levelMember.id,
              type: checkIn.type,
              content: checkIn.content,
              imagePixelUrl: checkIn.imagePixelUrl,
              metadata: {},
              createdAt: checkIn.createdAt
            }
          });
        }
      }
    }
    
    // 5. 恢復筆記 (如果有)
    if (backupData.keepNotes.length > 0) {
      console.log('📝 恢復筆記...');
      for (const note of backupData.keepNotes) {
        await prisma.keepNote.create({
          data: {
            playerId: userIdMapping[note.playerId],
            content: note.content,
            tags: note.tags,
            color: note.color,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        });
      }
    }
    
    // 6. 插入初始成就數據
    console.log('🏆 創建初始成就...');
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
      },
      {
        name: '社交達人',
        description: '加入5個不同的挑戰',
        iconName: 'pixel_heart',
        triggerRule: { type: 'join_levels', count: 5 }
      },
      {
        name: '領袖',
        description: '創建第一個挑戰關卡',
        iconName: 'pixel_flag',
        triggerRule: { type: 'create_first_level' }
      }
    ];
    
    for (const achievement of achievements) {
      await prisma.achievement.create({ data: achievement });
    }
    
    console.log('✅ V3.0 數據恢復完成！');
    
    // 驗證恢復結果
    const playerCount = await prisma.player.count();
    const achievementCount = await prisma.achievement.count();
    const levelCount = await prisma.level.count();
    const memberCount = await prisma.levelMember.count();
    const checkInCount = await prisma.checkIn.count();
    const noteCount = await prisma.keepNote.count();
    
    console.log('📊 V3.0 最終數據統計:');
    console.log(`  - Players: ${playerCount}`);
    console.log(`  - Levels: ${levelCount}`);
    console.log(`  - Level Members: ${memberCount}`);
    console.log(`  - Check-ins: ${checkInCount}`);
    console.log(`  - Keep Notes: ${noteCount}`);
    console.log(`  - Achievements: ${achievementCount}`);
    
    console.log('🎯 遷移映射記錄:');
    console.log('用戶 ID 映射:', userIdMapping);
    
  } catch (error) {
    console.error('❌ 數據恢復失敗:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreDataToV3();