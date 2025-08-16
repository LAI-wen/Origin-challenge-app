// test-setup.js - 測試系統設定腳本
require('dotenv').config();

console.log('🎮 8-Bit Habits - 系統設定測試\n');

// 1. 環境變數檢查
console.log('1️⃣ 檢查環境變數...');
const requiredEnvVars = [
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ 缺少必需的環境變數:', missingVars.join(', '));
  console.log('請檢查 .env 文件設定\n');
} else {
  console.log('✅ 環境變數設定完整\n');
}

// 2. Prisma Client 測試
console.log('2️⃣ 測試 Prisma Client...');
try {
  const prisma = require('./src/models/prisma');
  console.log('✅ Prisma Client 載入成功\n');
} catch (error) {
  console.log('❌ Prisma Client 載入失敗:', error.message);
  console.log('請執行: npx prisma generate\n');
}

// 3. 依賴套件檢查
console.log('3️⃣ 檢查主要依賴...');
const dependencies = [
  'express',
  'cors',
  'jsonwebtoken',
  'google-auth-library',
  '@prisma/client'
];

const missingDeps = [];
dependencies.forEach(dep => {
  try {
    require(dep);
    console.log(`✅ ${dep}`);
  } catch (error) {
    console.log(`❌ ${dep} - 需要安裝`);
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.log('\n請執行: npm install\n');
} else {
  console.log('\n✅ 所有依賴套件就緒\n');
}

// 4. 檔案結構檢查
console.log('4️⃣ 檢查檔案結構...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  './prisma/schema.prisma',
  './src/models/prisma.js',
  './src/controllers/auth.controller.js',
  './src/services/auth.service.js',
  './src/routes/auth.route.js',
  './index.js',
  './.env'
];

let allFilesExist = true;
requiredFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath} - 檔案不存在`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n✅ 所有必需檔案存在\n');
} else {
  console.log('\n❌ 部分檔案缺失\n');
}

// 總結
console.log('📋 設定總結:');
if (missingVars.length === 0 && missingDeps.length === 0 && allFilesExist) {
  console.log('🎉 所有設定完成！可以開始開發了');
  console.log('\n🚀 下一步指令:');
  console.log('1. npm run dev  # 啟動開發伺服器');
  console.log('2. npx prisma migrate dev  # 執行資料庫 migration (如果需要)');
} else {
  console.log('⚠️  請修復上述問題後再繼續');
}

console.log('\n' + '='.repeat(50));