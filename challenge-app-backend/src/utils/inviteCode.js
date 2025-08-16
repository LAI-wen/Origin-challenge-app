// src/utils/inviteCode.js
const prisma = require('../models/prisma');

/**
 * Generates a random 8-character invite code
 * Uses uppercase letters and numbers for better readability
 */
const generateInviteCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Generates a unique invite code that doesn't exist in the database
 * Retries up to 10 times if collision occurs
 */
const generateUniqueInviteCode = async () => {
  const maxRetries = 10;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateInviteCode();
    
    // Check if code already exists
    const existingLevel = await prisma.level.findUnique({
      where: { inviteCode: code }
    });
    
    if (!existingLevel) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique invite code after maximum retries');
};

module.exports = {
  generateInviteCode,
  generateUniqueInviteCode
};