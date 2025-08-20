// 直接測試API端點的邏輯，不經過HTTP
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 模擬 getTodayCheckinStatus controller 邏輯
async function testGetTodayStatus(levelId, userId) {
  console.log(`\n=== 測試 getTodayStatus: ${levelId} ===`);
  
  try {
    // 步驟1: 檢查用戶權限
    const levelMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            rule: true
          }
        }
      }
    });

    console.log('LevelMember found:', levelMember?.id);
    console.log('Level name:', levelMember?.level?.name);

    if (!levelMember) {
      console.log('❌ Access denied: You are not an active member of this level');
      return;
    }

    // 步驟2: 檢查今日打卡
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('查詢條件:');
    console.log('  levelMemberId:', levelMember.id);
    console.log('  today:', today.toISOString());
    console.log('  tomorrow:', tomorrow.toISOString());

    const todayCheckin = await prisma.checkIn.findFirst({
      where: {
        levelMemberId: levelMember.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    console.log('Today checkin found:', todayCheckin?.id || '無');

    // 步驟3: 計算時間窗口
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const rule = levelMember.level.rule;
    
    const timeWindow = {
      start: rule.startTime || '00:00',
      end: rule.endTime || '23:59',
      current: currentTime,
      isWithinWindow: !rule.startTime || !rule.endTime || 
        (currentTime >= rule.startTime && currentTime <= rule.endTime)
    };

    // 步驟4: 構建回應
    const response = {
      success: true,
      hasCheckedIn: !!todayCheckin,
      checkin: todayCheckin ? {
        id: todayCheckin.id,
        type: todayCheckin.type,
        content: todayCheckin.content,
        createdAt: todayCheckin.createdAt
      } : null,
      timeWindow: timeWindow,
      levelName: levelMember.level.name
    };

    console.log('API Response would be:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function runAllTests() {
  const userId = 'e22ddaae-9384-49b1-9d0f-fa5450552018'; // 貝貝
  
  // 測試所有房間
  await testGetTodayStatus('b2641fe9-6c01-4b54-87f9-3bcf71f79748', userId); // 55555
  await testGetTodayStatus('0b80ef80-4f38-4387-8a60-bfe997a008ff', userId); // 99999  
  await testGetTodayStatus('c7115935-0f2d-43d1-96ea-6b20c962f353', userId); // 222
  await testGetTodayStatus('ed3d7e2a-11b0-404f-b3d6-dafa3c0e207a', userId); // 65555
  
  await prisma.$disconnect();
}

runAllTests().catch(console.error);