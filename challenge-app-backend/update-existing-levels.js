// 為現有Level記錄設置預設roomState
const prisma = require('./src/models/prisma');

async function updateExistingLevels() {
  console.log('🔄 開始更新現有關卡的房間狀態...');
  
  try {
    // 查找所有現有關卡
    const levels = await prisma.level.findMany({
      select: {
        id: true,
        name: true,
        rule: true,
        startDate: true,
        endDate: true
      }
    });

    console.log(`📊 找到 ${levels.length} 個現有關卡`);

    for (const level of levels) {
      // 計算挑戰目標天數
      const targetDays = level.rule?.targetDays || 30;
      
      // 設置房間狀態
      const roomState = {
        scene: "default_room",
        theme: "classic",
        items: [],
        progress: 0,
        locked: true,
        escapeCondition: {
          type: "daily_checkin",
          target: targetDays,
          current: 0,
          description: `連續打卡${targetDays}天即可逃出房間`
        },
        daysInRoom: 0,
        rewards: [
          { type: "decoration", item: "freedom_trophy" },
          { type: "theme", unlock: "completed_room" }
        ]
      };

      // 更新關卡
      await prisma.level.update({
        where: { id: level.id },
        data: { roomState }
      });

      console.log(`✅ 已更新關卡: ${level.name}`);
    }

    console.log('🎉 所有關卡房間狀態更新完成！');
    
  } catch (error) {
    console.error('❌ 更新失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingLevels();