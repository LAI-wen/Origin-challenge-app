const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCheckinBug() {
  console.log('=== DEBUGGING CROSS-ROOM CHECKIN BUG ===');
  
  const levelId222 = 'c7115935-0f2d-43d1-96ea-6b20c962f353'; // 222 room
  const levelId65555 = 'ed3d7e2a-11b0-404f-b3d6-dafa3c0e207a'; // 65555 room
  const userId = 'e22ddaae-9384-49b1-9d0f-fa5450552018'; // 貝貝
  
  // Test 222 room
  console.log('\n--- Testing 222 Room ---');
  const member222 = await prisma.levelMember.findFirst({
    where: { playerId: userId, levelId: levelId222, status: 'ACTIVE' },
    include: { level: { select: { name: true } } }
  });
  
  console.log('Member 222:', member222?.id);
  console.log('Level name:', member222?.level?.name);
  
  if (member222) {
    const checkin222 = await prisma.checkIn.findFirst({
      where: { levelMemberId: member222.id }
    });
    console.log('Has checkin in 222:', checkin222?.id || 'none');
  }
  
  // Test 65555 room  
  console.log('\n--- Testing 65555 Room ---');
  const member65555 = await prisma.levelMember.findFirst({
    where: { playerId: userId, levelId: levelId65555, status: 'ACTIVE' },
    include: { level: { select: { name: true } } }
  });
  
  console.log('Member 65555:', member65555?.id);
  console.log('Level name:', member65555?.level?.name);
  
  if (member65555) {
    const checkin65555 = await prisma.checkIn.findFirst({
      where: { levelMemberId: member65555.id }
    });
    console.log('Has checkin in 65555:', checkin65555?.id || 'none');
  }
  
  await prisma.$disconnect();
}

testCheckinBug().catch(console.error);