// 安全遷移腳本：V1.0 → V3.0
const { PrismaClient } = require('@prisma/client');

async function safeMigrationToV3() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 開始安全遷移到 V3.0...');
    
    // 1. 備份現有數據
    console.log('📋 備份現有用戶數據...');
    const existingUsers = await prisma.user.findMany();
    console.log(`找到 ${existingUsers.length} 個現有用戶`);
    
    // 2. 檢查現有結構
    const existingLevels = await prisma.level.findMany();
    const existingLevelMembers = await prisma.levelMember.findMany();
    const existingCheckIns = await prisma.checkIn.findMany();
    const existingKeepNotes = await prisma.keepNote.findMany();
    
    console.log('📊 現有數據統計:');
    console.log(`  - 用戶: ${existingUsers.length}`);
    console.log(`  - 關卡: ${existingLevels.length}`);
    console.log(`  - 成員: ${existingLevelMembers.length}`);
    console.log(`  - 打卡: ${existingCheckIns.length}`);
    console.log(`  - 筆記: ${existingKeepNotes.length}`);
    
    // 將數據存儲在內存中
    const backupData = {
      users: existingUsers,
      levels: existingLevels,
      levelMembers: existingLevelMembers,
      checkIns: existingCheckIns,
      keepNotes: existingKeepNotes
    };
    
    console.log('✅ 數據備份完成，可以安全應用新 schema');
    return backupData;
    
  } catch (error) {
    console.error('❌ 遷移準備失敗:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 恢復數據到新結構
async function restoreDataToV3(backupData) {
  // 注意：這裡需要等待新 schema 應用後再執行
  console.log('⏳ 等待新 schema 應用後再執行數據恢復...');
  console.log('💾 備份數據已保存，包含:');
  console.log(`  - ${backupData.users.length} 個用戶`);
  console.log(`  - ${backupData.levels.length} 個關卡`);
  console.log(`  - ${backupData.levelMembers.length} 個成員關係`);
  console.log(`  - ${backupData.checkIns.length} 個打卡記錄`);
  console.log(`  - ${backupData.keepNotes.length} 個筆記`);
}

// 執行備份
safeMigrationToV3()
  .then(backupData => {
    console.log('🎯 下一步: 應用新 schema 後執行數據恢復');
    // 將備份數據寫入文件
    require('fs').writeFileSync('migration-backup.json', JSON.stringify(backupData, null, 2));
    console.log('💾 備份數據已寫入 migration-backup.json');
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });