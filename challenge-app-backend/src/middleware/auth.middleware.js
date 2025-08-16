// src/middleware/auth.middleware.js
const { verifyJWT } = require('../services/auth.service');
const prisma = require('../models/prisma');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify user still exists in database
    const user = await prisma.player.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
};