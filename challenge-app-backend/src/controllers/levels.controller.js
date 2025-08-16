// src/controllers/levels.controller.js
const prisma = require('../models/prisma');
const { generateUniqueInviteCode } = require('../utils/inviteCode');

/**
 * Helper function to format level response
 */
const formatLevelResponse = (level, userRole = null, isOwner = false) => {
  return {
    id: level.id,
    name: level.name,
    description: level.description,
    isActive: level.isActive,
    rule: level.rule,
    settings: level.settings,
    startDate: level.startDate,
    endDate: level.endDate,
    createdAt: level.createdAt,
    updatedAt: level.updatedAt,
    ...(userRole && { userRole }),
    ...(typeof isOwner === 'boolean' && { isOwner })
  };
};

/**
 * Helper function to handle database errors
 */
const handleDatabaseError = (error, operation, res) => {
  console.error(`Error ${operation}:`, error);
  
  if (error.message.includes('unique constraint')) {
    return res.status(409).json({ 
      error: 'Conflict',
      message: 'Please try again'
    });
  }

  return res.status(500).json({ 
    error: `Failed to ${operation}`,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
  });
};

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
        ...formatLevelResponse(level),
        inviteCode: level.inviteCode,
        ownerId: level.ownerId
      }
    });

  } catch (error) {
    return handleDatabaseError(error, 'create level', res);
  }
};

/**
 * Get user's levels
 * GET /api/levels
 */
const getLevels = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all level memberships for the user where status is ACTIVE
    const levelMembers = await prisma.levelMember.findMany({
      where: {
        playerId: userId,
        status: 'ACTIVE'
      },
      include: {
        level: {
          include: {
            _count: {
              select: {
                levelMembers: {
                  where: {
                    status: 'ACTIVE'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        level: {
          createdAt: 'desc'
        }
      }
    });

    // Transform the data to include user role and membership info
    const levels = levelMembers.map(member => {
      const { level } = member;
      return {
        id: level.id,
        name: level.name,
        description: level.description,
        inviteCode: level.inviteCode,
        isActive: level.isActive,
        rule: level.rule,
        settings: level.settings,
        startDate: level.startDate,
        endDate: level.endDate,
        createdAt: level.createdAt,
        updatedAt: level.updatedAt,
        // User-specific information
        userRole: member.role,
        memberCount: level._count.levelMembers,
        isOwner: level.ownerId === userId
      };
    });

    res.json({
      success: true,
      levels,
      total: levels.length
    });

  } catch (error) {
    return handleDatabaseError(error, 'fetch levels', res);
  }
};

/**
 * Join a level using invite code
 * POST /api/levels/:id/join
 */
const joinLevel = async (req, res) => {
  try {
    const { id: levelId } = req.params;
    const { inviteCode } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!inviteCode || inviteCode.trim() === '') {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Find the level
    const level = await prisma.level.findUnique({
      where: { id: levelId }
    });

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Verify invite code
    if (level.inviteCode !== inviteCode.trim()) {
      return res.status(400).json({ error: 'Invalid invite code' });
    }

    // Check if level is active
    if (!level.isActive) {
      return res.status(400).json({ error: 'Level is not active' });
    }

    // Check if user is already a member
    const existingMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      }
    });

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this level' });
    }

    // Create new level member
    const newMember = await prisma.levelMember.create({
      data: {
        playerId: userId,
        levelId: levelId,
        role: 'PLAYER',
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully joined level',
      level: {
        id: level.id,
        name: level.name,
        description: level.description,
        isActive: level.isActive,
        rule: level.rule,
        settings: level.settings,
        startDate: level.startDate,
        endDate: level.endDate,
        createdAt: level.createdAt,
        updatedAt: level.updatedAt,
        userRole: newMember.role,
        isOwner: level.ownerId === userId
      }
    });

  } catch (error) {
    console.error('Error joining level:', error);
    
    res.status(500).json({ 
      error: 'Failed to join level',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

module.exports = {
  createLevel,
  getLevels,
  joinLevel
};