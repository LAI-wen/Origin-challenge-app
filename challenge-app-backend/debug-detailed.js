const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detailedBugAnalysis() {
  console.log('=== DETAILED BUG ANALYSIS ===');
  
  const levelId55555 = 'b2641fe9-6c01-4b54-87f9-3bcf71f79748'; // 55555房間
  const levelId99999 = '0b80ef80-4f38-4387-8a60-bfe997a008ff'; // 99999房間  
  const userId = 'e22ddaae-9384-49b1-9d0f-fa5450552018'; // 貝貝
  
  console.log('\n=== 1. 查看打卡記錄 ===');
  const allCheckins = await prisma.checkIn.findMany({
    include: {
      levelMember: {
        include: {
          level: { select: { id: true, name: true } },
          player: { select: { id: true, name: true } }
        }
      }
    }
  });
  
  console.log('所有打卡記錄：');
  allCheckins.forEach(checkin => {
    console.log(`- CheckIn: ${checkin.id}`);
    console.log(`  Level: ${checkin.levelMember.level.name} (${checkin.levelMember.level.id})`);
    console.log(`  Player: ${checkin.levelMember.player.name}`);
    console.log(`  Type: ${checkin.type}, Created: ${checkin.createdAt}`);
    console.log('');
  });
  
  console.log('\n=== 2. 模擬 55555 房間查詢 ===');
  const member55555 = await prisma.levelMember.findFirst({
    where: {
      playerId: userId,
      levelId: levelId55555,
      status: 'ACTIVE'
    },
    include: {
      level: { select: { id: true, name: true, rule: true } }
    }
  });
  
  console.log('55555房間 LevelMember:', member55555?.id);
  console.log('Level Name:', member55555?.level?.name);
  
  if (member55555) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkin55555 = await prisma.checkIn.findFirst({
      where: {
        levelMemberId: member55555.id,
        createdAt: { gte: today, lt: tomorrow }
      }
    });
    
    console.log('55555房間今日打卡:', checkin55555?.id || '無');
    if (checkin55555) {
      console.log('  Type:', checkin55555.type);
      console.log('  Created:', checkin55555.createdAt);
    }
  }
  
  console.log('\n=== 3. 模擬 99999 房間查詢 ===');
  const member99999 = await prisma.levelMember.findFirst({
    where: {
      playerId: userId,
      levelId: levelId99999,
      status: 'ACTIVE'
    },
    include: {
      level: { select: { id: true, name: true, rule: true } }
    }
  });
  
  console.log('99999房間 LevelMember:', member99999?.id);
  console.log('Level Name:', member99999?.level?.name);
  
  if (member99999) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkin99999 = await prisma.checkIn.findFirst({
      where: {
        levelMemberId: member99999.id,
        createdAt: { gte: today, lt: tomorrow }
      }
    });
    
    console.log('99999房間今日打卡:', checkin99999?.id || '無');
    if (checkin99999) {
      console.log('  Type:', checkin99999.type);
      console.log('  Created:', checkin99999.createdAt);
    }
  }
  
  console.log('\n=== 4. 檢查所有用戶的 LevelMember 記錄 ===');
  const userMembers = await prisma.levelMember.findMany({
    where: { playerId: userId, status: 'ACTIVE' },
    include: {
      level: { select: { id: true, name: true } },
      checkIns: { orderBy: { createdAt: 'desc' } }
    }
  });
  
  console.log(`用戶 ${userId} 的所有房間成員關係：`);
  userMembers.forEach(member => {
    console.log(`- Member ID: ${member.id}`);
    console.log(`  Level: ${member.level.name} (${member.level.id})`);
    console.log(`  Role: ${member.role}`);
    console.log(`  Check-ins: ${member.checkIns.length}`);
    member.checkIns.forEach(checkin => {
      console.log(`    - ${checkin.id}: ${checkin.type} at ${checkin.createdAt}`);
    });
    console.log('');
  });
  
  await prisma.$disconnect();
}

detailedBugAnalysis().catch(console.error);