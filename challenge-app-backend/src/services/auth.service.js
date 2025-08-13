// src/services/auth.service.js
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture,
          googleId: payload.sub,
          language: 'zh-TW' // Default to Traditional Chinese
        }
      });
    } else {
      // Update existing user info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: payload.name,
          avatarUrl: payload.picture,
          googleId: payload.sub
        }
      });
    }

    return user;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
};

const generateJWT = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-default-secret-change-this',
    { expiresIn: '7d' }
  );
};

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-change-this');
  } catch (error) {
    return null;
  }
};

module.exports = {
  verifyGoogleToken,
  generateJWT,
  verifyJWT
};