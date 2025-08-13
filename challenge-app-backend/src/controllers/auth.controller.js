// src/controllers/auth.controller.js
const { verifyGoogleToken, generateJWT } = require('../services/auth.service');

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify Google token and get user info
    const googleUser = await verifyGoogleToken(token);
    
    if (!googleUser) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    // Generate JWT for the user
    const jwtToken = generateJWT({ 
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name 
    });

    res.json({
      success: true,
      user: {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
        language: googleUser.language || 'zh-TW'
      },
      token: jwtToken
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

module.exports = {
  googleLogin
};