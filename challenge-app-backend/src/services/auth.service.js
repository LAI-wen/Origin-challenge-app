// src/services/auth.service.js
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (token) => {
  try {
    let payload;
    
    // Try to verify as ID token first
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      console.log('✅ Token verified as ID token');
    } catch (idTokenError) {
      console.log('⚠️ Not an ID token, trying to verify as access token...');
      
      // If ID token verification fails, try to get user info using access token
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }
      
      const userInfo = await response.json();
      // Convert Google API response to payload format
      payload = {
        sub: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        email_verified: userInfo.verified_email
      };
      console.log('✅ Token verified as access token');
    }
    
    // Find or create player in database
    let player = await prisma.player.findUnique({
      where: { email: payload.email }
    });

    if (!player) {
      // Create new player
      player = await prisma.player.create({
        data: {
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture,
          googleId: payload.sub,
          language: 'zh-TW', // Default to Traditional Chinese
          pixelAbodeState: {
            scene: "default_room",
            items: [],
            layout: {}
          }
        }
      });
    } else {
      // Update existing player info
      player = await prisma.player.update({
        where: { id: player.id },
        data: {
          name: payload.name,
          avatarUrl: payload.picture,
          googleId: payload.sub
        }
      });
    }

    return player;
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