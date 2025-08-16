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
 * Helper function to create base member data structure
 * @param {Object} member - The member object from database
 * @returns {Object} Base member data with basic information
 */
const createBaseMemberData = (member) => ({
  id: member.id,
  playerId: member.playerId,
  role: member.role,
  status: member.status,
  joinedAt: member.joinedAt,
  player: {
    id: member.player.id,
    name: member.player.name,
    avatarUrl: member.player.avatarUrl
  }
});

/**
 * Helper function to determine if email should be visible based on role and privacy settings
 * @param {Object} member - The member object being evaluated
 * @param {string} userRole - Current user's role (CREATOR, PLAYER, AUDIENCE)
 * @param {string} checkinContentVisibility - Level's visibility setting (public, members_only, private)
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean} Whether email should be visible
 */
const shouldShowEmail = (member, userRole, checkinContentVisibility, currentUserId) => {
  // Current user always sees their own email
  if (member.playerId === currentUserId) {
    return true;
  }
  
  // CREATOR sees all emails
  if (userRole === 'CREATOR') {
    return true;
  }
  
  // PLAYER sees emails only if visibility is public
  if (userRole === 'PLAYER' && checkinContentVisibility === 'public') {
    return true;
  }
  
  // AUDIENCE never sees other users' emails
  return false;
};

/**
 * Helper function to determine if missed days should be visible based on role
 * @param {string} userRole - Current user's role (CREATOR, PLAYER, AUDIENCE)
 * @returns {boolean} Whether missed days should be visible
 */
const shouldShowMissedDays = (userRole) => {
  // CREATOR and PLAYER can see missed days, AUDIENCE cannot
  return userRole === 'CREATOR' || userRole === 'PLAYER';
};

/**
 * Helper function to filter member data based on user role and privacy settings
 * @param {Object} member - The member object to filter
 * @param {string} userRole - Current user's role (CREATOR, PLAYER, AUDIENCE)
 * @param {string} checkinContentVisibility - Level's visibility setting
 * @param {string} currentUserId - Current user's ID
 * @returns {Object} Filtered member data based on permissions
 */
const filterMemberData = (member, userRole, checkinContentVisibility, currentUserId) => {
  const baseData = createBaseMemberData(member);

  // Add email if visible
  if (shouldShowEmail(member, userRole, checkinContentVisibility, currentUserId)) {
    baseData.player.email = member.player.email;
  }

  // Add missed days if visible
  if (shouldShowMissedDays(userRole)) {
    baseData.missedDays = member.missedDays;
  }

  return baseData;
};

/**
 * Get level details by ID with role-based data filtering
 * This endpoint provides level information tailored to the user's role and privacy settings:
 * - CREATOR: Full access to all level data including invite code and member details
 * - PLAYER: Limited access with some member information and missed days
 * - AUDIENCE: Minimal access with basic level and member information only
 * 
 * @route GET /api/levels/:id
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Level ID
 * @param {Object} req.user - Authenticated user object from middleware
 * @param {string} req.user.id - User ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with level details or error
 */
const getLevelDetails = async (req, res) => {
  try {
    const { id: levelId } = req.params;
    const userId = req.user.id;

    // Find the level with all members
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: {
        levelMembers: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Check if user is a member of this level
    const userMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      }
    });

    if (!userMember) {
      return res.status(403).json({ 
        error: 'Access denied: You are not a member of this level' 
      });
    }

    // Base level response
    const levelResponse = {
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
      userRole: userMember.role,
      isOwner: level.ownerId === userId
    };

    // Add invite code only for CREATOR
    if (userMember.role === 'CREATOR') {
      levelResponse.inviteCode = level.inviteCode;
    }

    // Filter and format member list based on user role and privacy settings
    const visibilitySettings = level.settings?.checkinContentVisibility || 'public';
    
    // Filter out non-ACTIVE members and apply role-based filtering
    const filteredMembers = (level.levelMembers || [])
      .filter(member => member.status === 'ACTIVE')
      .map(member => filterMemberData(
        member, 
        userMember.role, 
        visibilitySettings, 
        userId
      ));

    levelResponse.members = filteredMembers;
    levelResponse.memberCount = filteredMembers.length;

    res.json({
      success: true,
      level: levelResponse
    });

  } catch (error) {
    return handleDatabaseError(error, 'fetch level details', res);
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

/**
 * Update member role in a level
 * PUT /api/levels/:id/members/:memberId
 */
const updateMemberRole = async (req, res) => {
  try {
    const { id: levelId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!role || role.trim() === '') {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Validate role value
    if (!['PLAYER', 'AUDIENCE'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either PLAYER or AUDIENCE' });
    }

    // Find the level
    const level = await prisma.level.findUnique({
      where: { id: levelId }
    });

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Check if user is a member and get their role
    const userMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      }
    });

    if (!userMember || userMember.role !== 'CREATOR') {
      return res.status(403).json({ error: 'Only the level creator can manage members' });
    }

    // Find the target member
    const targetMember = await prisma.levelMember.findFirst({
      where: {
        id: memberId,
        levelId: levelId,
        status: 'ACTIVE'
      }
    });

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found or not active in this level' });
    }

    // Cannot modify CREATOR role
    if (targetMember.role === 'CREATOR') {
      return res.status(400).json({ error: 'Cannot modify the creator role' });
    }

    // Update the member role
    const updatedMember = await prisma.levelMember.update({
      where: { id: memberId },
      data: { role }
    });

    res.json({
      success: true,
      message: 'Member role updated successfully',
      member: {
        id: updatedMember.id,
        playerId: updatedMember.playerId,
        role: updatedMember.role,
        status: updatedMember.status,
        joinedAt: updatedMember.joinedAt
      }
    });

  } catch (error) {
    return handleDatabaseError(error, 'update member role', res);
  }
};

/**
 * Remove a member from a level
 * DELETE /api/levels/:id/members/:memberId
 */
const removeMember = async (req, res) => {
  try {
    const { id: levelId, memberId } = req.params;
    const userId = req.user.id;

    // Find the level
    const level = await prisma.level.findUnique({
      where: { id: levelId }
    });

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Check if user is a member and get their role
    const userMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      }
    });

    if (!userMember || userMember.role !== 'CREATOR') {
      return res.status(403).json({ error: 'Only the level creator can manage members' });
    }

    // Find the target member
    const targetMember = await prisma.levelMember.findFirst({
      where: {
        id: memberId,
        levelId: levelId,
        status: 'ACTIVE'
      }
    });

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found or not active in this level' });
    }

    // Cannot remove CREATOR
    if (targetMember.role === 'CREATOR') {
      return res.status(400).json({ error: 'Cannot remove the level creator' });
    }

    // Update member status to ELIMINATED (soft delete)
    await prisma.levelMember.update({
      where: { id: memberId },
      data: { status: 'ELIMINATED' }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    return handleDatabaseError(error, 'remove member', res);
  }
};

module.exports = {
  createLevel,
  getLevels,
  getLevelDetails,
  joinLevel,
  updateMemberRole,
  removeMember
};