// src/controllers/levels.controller.js
const prisma = require('../models/prisma');
const { generateUniqueInviteCode } = require('../utils/inviteCode');

/**
 * Create a new level
 * POST /api/levels
 */
const createLevel = async (req, res) => {
  try {
    const { name, description, rule, settings, startDate, endDate } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Level name is required' });
    }

    // Set default values
    const defaultRule = {
      startTime: '05:00',
      endTime: '23:00',
      maxMissedDays: 3
    };

    const defaultSettings = {
      checkinContentVisibility: 'public'
    };

    // Merge provided data with defaults
    const levelRule = rule ? { ...defaultRule, ...rule } : defaultRule;
    const levelSettings = settings ? { ...defaultSettings, ...settings } : defaultSettings;

    // Generate unique invite code
    const inviteCode = await generateUniqueInviteCode();

    // Prepare level data
    const levelData = {
      name: name.trim(),
      description: description || null,
      inviteCode,
      ownerId: userId,
      rule: levelRule,
      settings: levelSettings,
      isActive: true
    };

    // Handle dates
    if (startDate) {
      levelData.startDate = new Date(startDate);
    }
    if (endDate) {
      levelData.endDate = new Date(endDate);
    }

    // Create level in database
    const level = await prisma.level.create({
      data: levelData
    });

    // Add creator as the first member with CREATOR role
    await prisma.levelMember.create({
      data: {
        playerId: userId,
        levelId: level.id,
        role: 'CREATOR',
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      success: true,
      level: {
        id: level.id,
        name: level.name,
        description: level.description,
        inviteCode: level.inviteCode,
        ownerId: level.ownerId,
        rule: level.rule,
        settings: level.settings,
        isActive: level.isActive,
        startDate: level.startDate,
        endDate: level.endDate,
        createdAt: level.createdAt,
        updatedAt: level.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating level:', error);
    
    if (error.message.includes('unique constraint')) {
      return res.status(409).json({ 
        error: 'Invite code conflict',
        message: 'Please try again'
      });
    }

    res.status(500).json({ 
      error: 'Failed to create level',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

module.exports = {
  createLevel
};