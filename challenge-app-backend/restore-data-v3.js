// 恢復數據到 V3.0 結構
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function restoreDataToV3() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 開始恢復數據到 V3.0 結構...');
    
    // 讀取備份數據
    const backupData = JSON.parse(fs.readFileSync('migration-backup.json', 'utf8'));
    
    // 1. 恢復用戶數據到 players 表
    console.log('👥 恢復用戶數據到 players 表...');
    for (const user of backupData.users) {
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
    
    // 2. 恢復關卡數據 (如果有)
    if (backupData.levels.length > 0) {
      console.log('🎮 恢復關卡數據...');
      for (const level of backupData.levels) {
        await prisma.level.create({
          data: {
            id: level.id,
            name: level.name,
            description: level.description,
            inviteCode: level.inviteCode,
            ownerId: level.ownerId,
            isActive: level.isActive,
            rule: level.rules, // 注意欄位名稱變更
            settings: level.settings,
            startDate: level.startDate,
            endDate: level.endDate,
            createdAt: level.createdAt,
            updatedAt: level.updatedAt
          }
        });
      }
    }
    
    // 3. 恢復成員關係 (如果有)
    if (backupData.levelMembers.length > 0) {
      console.log('👨‍👩‍👧‍👦 恢復成員關係...');
      for (const member of backupData.levelMembers) {
        await prisma.levelMember.create({
          data: {
            id: member.id,
            playerId: member.playerId,
            levelId: member.levelId,
            role: member.role,
            status: member.status,
            missedDays: member.missedDays,
            joinedAt: member.joinedAt,
            updatedAt: member.updatedAt
          }
        });
      }
    }
    
    // 4. 恢復打卡記錄 (如果有)
    if (backupData.checkIns.length > 0) {
      console.log('✅ 恢復打卡記錄...');
      // 注意：打卡記錄現在需要 level_member_id，需要重新建立關聯
      for (const checkIn of backupData.checkIns) {
        // 查找對應的 level_member
        const levelMember = await prisma.levelMember.findFirst({
          where: {
            playerId: checkIn.playerId,
            levelId: checkIn.levelId
          }
        });
        
        if (levelMember) {
          await prisma.checkIn.create({
            data: {
              id: checkIn.id,
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
            id: note.id,
            playerId: note.playerId,
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
    
    console.log('📊 V3.0 數據統計:');
    console.log(`  - Players: ${playerCount}`);
    console.log(`  - Achievements: ${achievementCount}`);
    
  } catch (error) {
    console.error('❌ 數據恢復失敗:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreDataToV3();