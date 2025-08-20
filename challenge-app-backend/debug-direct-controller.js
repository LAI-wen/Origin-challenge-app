// 直接呼叫controller函數來找bug
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 模擬controller函數
async function getTodayCheckinStatus(levelId, userId) {
  console.log(`\n🔍 Controller Test: levelId=${levelId}, userId=${userId}`);
  
  try {
    // 步驟1: 檢查用戶權限 - 完全複製controller邏輯
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

    console.log(`📝 Found levelMember: ${levelMember?.id}`);
    console.log(`📝 Level name: ${levelMember?.level?.name}`);

    if (!levelMember) {
      console.log('❌ Access denied: You are not an active member of this level');
      return { error: 'Access denied' };
    }

    // 步驟2: 檢查今日打卡 - 完全複製controller邏輯
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`📝 Query conditions:`);
    console.log(`   levelMemberId: ${levelMember.id}`);
    console.log(`   today: ${today.toISOString()}`);
    console.log(`   tomorrow: ${tomorrow.toISOString()}`);

    const todayCheckin = await prisma.checkIn.findFirst({
      where: {
        levelMemberId: levelMember.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    console.log(`📝 Found todayCheckin: ${todayCheckin?.id || 'none'}`);
    if (todayCheckin) {
      console.log(`   Type: ${todayCheckin.type}`);
      console.log(`   Created: ${todayCheckin.createdAt}`);
    }

    // 步驟3: 計算時間窗口 - 完全複製controller邏輯
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

    // 步驟4: 構建完全相同的回應
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

    console.log(`✅ Response levelName: ${response.levelName}`);
    console.log(`✅ Response hasCheckedIn: ${response.hasCheckedIn}`);
    if (response.checkin) {
      console.log(`✅ Response checkin ID: ${response.checkin.id}`);
    }

    return response;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { error: error.message };
  }
}

async function runAllControllerTests() {
  const userId = 'e22ddaae-9384-49b1-9d0f-fa5450552018'; // 貝貝
  
  // 測試所有房間
  console.log('=== 🧪 CONTROLLER DIRECT TESTING ===');
  
  await getTodayCheckinStatus('b2641fe9-6c01-4b54-87f9-3bcf71f79748', userId); // 55555
  await getTodayCheckinStatus('ed3d7e2a-11b0-404f-b3d6-dafa3c0e207a', userId); // 65555
  await getTodayCheckinStatus('c7115935-0f2d-43d1-96ea-6b20c962f353', userId); // 222
  await getTodayCheckinStatus('0b80ef80-4f38-4387-8a60-bfe997a008ff', userId); // 99999
  
  await prisma.$disconnect();
}

runAllControllerTests().catch(console.error);