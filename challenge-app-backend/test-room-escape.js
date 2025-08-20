// 測試房間逃脫機制
const prisma = require('./src/models/prisma');

async function testRoomEscape() {
  console.log('🧪 測試房間逃脫機制...\n');
  
  try {
    // 1. 查找一個測試關卡
    const level = await prisma.level.findFirst({
      include: {
        levelMembers: {
          include: {
            player: true,
            checkIns: true
          }
        }
      }
    });

    if (!level) {
      console.log('❌ 找不到測試關卡');
      return;
    }

    console.log(`🏠 測試關卡: ${level.name}`);
    console.log(`🔐 房間狀態:`, JSON.stringify(level.roomState, null, 2));
    console.log(`🏁 完成時間: ${level.completedAt || '尚未完成'}`);
    
    // 2. 檢查成員狀態
    for (const member of level.levelMembers) {
      const checkinCount = member.checkIns.length;
      const progress = level.roomState?.progress || 0;
      
      console.log(`\n👤 玩家: ${member.player.name}`);
      console.log(`📅 打卡次數: ${checkinCount}`);
      console.log(`📊 進度: ${progress}%`);
      console.log(`🔒 被困狀態: ${level.roomState?.locked ? '是' : '否'}`);
    }

    // 3. 模擬房間進度更新
    if (level.levelMembers.length > 0) {
      const testMember = level.levelMembers[0];
      const checkinCount = testMember.checkIns.length;
      const targetDays = level.roomState?.escapeCondition?.target || 30;
      
      console.log(`\n🎯 逃脫條件: ${checkinCount}/${targetDays} 天`);
      console.log(`⏰ 剩餘天數: ${Math.max(0, targetDays - checkinCount)} 天`);
      
      if (checkinCount >= targetDays) {
        console.log('🎉 已達成逃脫條件！');
      } else {
        console.log(`📈 進度: ${Math.round((checkinCount / targetDays) * 100)}%`);
      }
    }

    // 4. 檢查是否有已完成的房間
    const completedRooms = await prisma.level.findMany({
      where: {
        completedAt: { not: null }
      },
      include: {
        levelMembers: {
          include: { player: true }
        }
      }
    });

    console.log(`\n🏆 已完成房間數量: ${completedRooms.length}`);
    for (const room of completedRooms) {
      console.log(`✅ ${room.name} - 完成於 ${room.completedAt}`);
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoomEscape();