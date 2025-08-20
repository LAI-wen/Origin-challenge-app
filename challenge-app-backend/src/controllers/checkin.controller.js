/**
 * CheckIn Controller - 每日打卡系統
 * 支援 TEXT, IMAGE, CHECKMARK 三種打卡類型
 * 實現時間窗口驗證和權限控制
 */

const prisma = require('../models/prisma');

/**
 * 提交打卡
 * POST /api/levels/:id/checkins
 */
const submitCheckin = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { type, content, image } = req.body;
    const userId = req.user.id;

    // 驗證打卡類型
    if (!type || !['TEXT', 'IMAGE', 'CHECKMARK'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid check-in type. Must be TEXT, IMAGE, or CHECKMARK' 
      });
    }

    // 根據類型驗證必需內容
    if (type === 'TEXT' && (!content || content.trim() === '')) {
      return res.status(400).json({ 
        error: 'Content is required for TEXT check-ins' 
      });
    }

    if (type === 'IMAGE' && (!image || image.trim() === '')) {
      return res.status(400).json({ 
        error: 'Image data is required for IMAGE check-ins' 
      });
    }

    // 檢查關卡是否存在且用戶是否為成員
    const levelMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            rule: true,
            isActive: true
          }
        }
      }
    });

    if (!levelMember) {
      return res.status(403).json({ 
        error: 'Access denied: You are not an active member of this level' 
      });
    }

    if (!levelMember.level.isActive) {
      return res.status(400).json({ 
        error: 'Cannot check in to inactive level' 
      });
    }

    // 驗證時間窗口
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const rule = levelMember.level.rule;
    
    if (rule.startTime && rule.endTime) {
      if (currentTime < rule.startTime || currentTime > rule.endTime) {
        return res.status(400).json({ 
          error: `Check-in only allowed between ${rule.startTime} and ${rule.endTime}`,
          allowedTime: {
            start: rule.startTime,
            end: rule.endTime,
            current: currentTime
          }
        });
      }
    }

    // 檢查今日是否已打卡
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckin = await prisma.checkIn.findFirst({
      where: {
        levelMemberId: levelMember.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingCheckin) {
      return res.status(409).json({ 
        error: 'You have already checked in today for this level',
        existingCheckin: {
          id: existingCheckin.id,
          type: existingCheckin.type,
          createdAt: existingCheckin.createdAt
        }
      });
    }

    // 處理圖片數據 (如果是IMAGE類型)
    let imagePixelUrl = null;
    let metadata = {};

    if (type === 'IMAGE' && image) {
      // TODO: 實現圖片處理和像素化
      // 現在先儲存base64資料，稍後實現像素化處理
      imagePixelUrl = `temp_${Date.now()}.png`; // 臨時檔名
      metadata.originalSize = image.length;
      metadata.processed = false;
    }

    // 創建打卡記錄
    const newCheckin = await prisma.checkIn.create({
      data: {
        levelMemberId: levelMember.id,
        type: type,
        content: type === 'TEXT' ? content : null,
        imagePixelUrl: imagePixelUrl,
        metadata: metadata
      }
    });

    // 重置錯過天數（如果有的話）
    if (levelMember.missedDays > 0) {
      await prisma.levelMember.update({
        where: { id: levelMember.id },
        data: { missedDays: 0 }
      });
    }

    // 🔥 完整挑戰模式：更新房間逃脫進度
    const updatedLevel = await updateRoomProgress(levelMember.level.id, userId);

    res.status(201).json({
      success: true,
      message: `Successfully checked in to ${levelMember.level.name}`,
      checkin: {
        id: newCheckin.id,
        type: newCheckin.type,
        content: newCheckin.content,
        imagePixelUrl: newCheckin.imagePixelUrl,
        createdAt: newCheckin.createdAt,
        levelName: levelMember.level.name
      },
      roomProgress: updatedLevel?.roomState || null,
      escaped: updatedLevel?.completedAt ? true : false
    });

  } catch (error) {
    console.error('Error submitting check-in:', error);
    return res.status(500).json({ 
      error: 'Failed to submit check-in',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

/**
 * 獲取關卡的打卡記錄
 * GET /api/levels/:id/checkins
 */
const getLevelCheckins = async (req, res) => {
  try {
    const { levelId } = req.params;
    const userId = req.user.id;
    const { date, playerId } = req.query;

    // 檢查用戶權限
    const levelMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            settings: true,
            ownerId: true
          }
        }
      }
    });

    if (!levelMember) {
      return res.status(403).json({ 
        error: 'Access denied: You are not an active member of this level' 
      });
    }

    // 建構查詢條件
    let whereConditions = {
      levelMember: {
        levelId: levelId,
        status: 'ACTIVE'
      }
    };

    // 如果指定日期，篩選該日期
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      whereConditions.createdAt = {
        gte: targetDate,
        lt: nextDate
      };
    }

    // 如果指定玩家，篩選該玩家
    if (playerId) {
      whereConditions.levelMember.playerId = playerId;
    }

    // 根據隱私設定決定可見內容
    const isOwner = levelMember.level.ownerId === userId;
    const visibility = levelMember.level.settings.checkinContentVisibility || 'public';

    let selectFields = {
      id: true,
      type: true,
      createdAt: true,
      levelMember: {
        select: {
          id: true,
          role: true,
          player: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      }
    };

    // 根據可見性和權限決定是否包含內容
    if (visibility === 'public' || 
        visibility === 'creatorOnly' && isOwner ||
        playerId === userId) { // 用戶總是可以看到自己的內容
      selectFields.content = true;
      selectFields.imagePixelUrl = true;
    }

    const checkins = await prisma.checkIn.findMany({
      where: whereConditions,
      select: selectFields,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      checkins: checkins,
      total: checkins.length,
      levelName: levelMember.level.name
    });

  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch check-ins',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

/**
 * 獲取今日打卡狀態
 * GET /api/levels/:id/checkins/today
 */
const getTodayCheckinStatus = async (req, res) => {
  // Add detailed logging to track request isolation
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const requestLevelId = req.params.levelId;
    const requestUserId = req.user.id;
    
    console.log(`🔍 [${requestId}] getTodayCheckinStatus START: levelId=${requestLevelId}, userId=${requestUserId}`);

    // Create new isolated variables for this request
    const queryUserId = String(requestUserId);
    const queryLevelId = String(requestLevelId);

    // 檢查用戶權限 - 使用明確的變數名
    console.log(`📝 [${requestId}] Querying levelMember with playerId=${queryUserId}, levelId=${queryLevelId}`);
    
    const foundLevelMember = await prisma.levelMember.findFirst({
      where: {
        playerId: queryUserId,
        levelId: queryLevelId,
        status: 'ACTIVE'
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            rule: true
          }
        }
      }
    });

    console.log(`📝 [${requestId}] Found levelMember: ${foundLevelMember?.id}, levelName: ${foundLevelMember?.level?.name}`);

    if (!foundLevelMember) {
      console.log(`❌ [${requestId}] Access denied for levelId=${queryLevelId}`);
      return res.status(403).json({ 
        error: 'Access denied: You are not an active member of this level' 
      });
    }

    // 檢查今日打卡 - 使用明確的變數名
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    console.log(`📝 [${requestId}] Querying checkin with levelMemberId=${foundLevelMember.id}`);

    const foundTodayCheckin = await prisma.checkIn.findFirst({
      where: {
        levelMemberId: foundLevelMember.id,
        createdAt: {
          gte: todayDate,
          lt: tomorrowDate
        }
      }
    });

    console.log(`📝 [${requestId}] Found todayCheckin: ${foundTodayCheckin?.id || 'none'}`);

    // 計算時間窗口資訊 - 使用明確的變數名
    const currentDate = new Date();
    const formattedCurrentTime = currentDate.toTimeString().slice(0, 5);
    const levelRule = foundLevelMember.level.rule;
    
    const calculatedTimeWindow = {
      start: levelRule.startTime || '00:00',
      end: levelRule.endTime || '23:59',
      current: formattedCurrentTime,
      isWithinWindow: !levelRule.startTime || !levelRule.endTime || 
        (formattedCurrentTime >= levelRule.startTime && formattedCurrentTime <= levelRule.endTime)
    };

    const finalResponse = {
      success: true,
      hasCheckedIn: !!foundTodayCheckin,
      checkin: foundTodayCheckin ? {
        id: foundTodayCheckin.id,
        type: foundTodayCheckin.type,
        content: foundTodayCheckin.content,
        createdAt: foundTodayCheckin.createdAt
      } : null,
      timeWindow: calculatedTimeWindow,
      levelName: foundLevelMember.level.name
    };

    console.log(`✅ [${requestId}] Response: levelName=${finalResponse.levelName}, hasCheckedIn=${finalResponse.hasCheckedIn}`);

    res.json(finalResponse);

  } catch (error) {
    console.error(`❌ [${requestId}] Error checking today status:`, error);
    return res.status(500).json({ 
      error: 'Failed to check today status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

/**
 * 獲取玩家的打卡歷史
 * GET /api/levels/:id/checkins/history/:playerId
 */
const getPlayerCheckinHistory = async (req, res) => {
  try {
    const { id: levelId, playerId } = req.params;
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // 檢查用戶權限
    const levelMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      },
      include: {
        level: {
          select: {
            settings: true,
            ownerId: true
          }
        }
      }
    });

    if (!levelMember) {
      return res.status(403).json({ 
        error: 'Access denied: You are not an active member of this level' 
      });
    }

    // 檢查目標玩家是否是關卡成員
    const targetMember = await prisma.levelMember.findFirst({
      where: {
        playerId: playerId,
        levelId: levelId,
        status: 'ACTIVE'
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!targetMember) {
      return res.status(404).json({ 
        error: 'Player not found in this level' 
      });
    }

    // 檢查內容可見性權限
    const isOwner = levelMember.level.ownerId === userId;
    const isSelf = playerId === userId;
    const visibility = levelMember.level.settings.checkinContentVisibility || 'public';

    const canViewContent = visibility === 'public' || 
                          (visibility === 'creatorOnly' && isOwner) ||
                          isSelf;

    let selectFields = {
      id: true,
      type: true,
      createdAt: true
    };

    if (canViewContent) {
      selectFields.content = true;
      selectFields.imagePixelUrl = true;
      selectFields.metadata = true;
    }

    const checkins = await prisma.checkIn.findMany({
      where: {
        levelMemberId: targetMember.id
      },
      select: selectFields,
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(offset),
      take: parseInt(limit)
    });

    const totalCount = await prisma.checkIn.count({
      where: {
        levelMemberId: targetMember.id
      }
    });

    res.json({
      success: true,
      player: targetMember.player,
      checkins: checkins,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + checkins.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching player history:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch player check-in history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

/**
 * 更新房間逃脫進度 (完整挑戰模式)
 * 每次打卡成功後調用
 */
const updateRoomProgress = async (levelId, userId) => {
  try {
    // 獲取關卡和房間狀態
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: {
        levelMembers: {
          where: { status: 'ACTIVE' },
          include: {
            checkIns: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!level || level.completedAt) {
      return level; // 房間已解鎖，不需要更新
    }

    const currentRoomState = level.roomState || {};
    const escapeCondition = currentRoomState.escapeCondition || {};
    
    // 計算用戶的總打卡天數
    const userMember = level.levelMembers.find(m => m.player && m.playerId === userId);
    if (!userMember) return level;

    const userCheckinDays = userMember.checkIns.length;
    const targetDays = escapeCondition.target || 30;
    
    // 更新房間狀態
    const newProgress = Math.min(Math.round((userCheckinDays / targetDays) * 100), 100);
    const newRoomState = {
      ...currentRoomState,
      progress: newProgress,
      locked: newProgress < 100,
      escapeCondition: {
        ...escapeCondition,
        current: userCheckinDays
      },
      daysInRoom: userCheckinDays
    };

    // 檢查是否達成逃脫條件
    let updateData = { roomState: newRoomState };
    let escapeMessage = null;

    if (userCheckinDays >= targetDays && !level.completedAt) {
      // 🎉 成功逃脫！
      newRoomState.locked = false;
      updateData.completedAt = new Date();
      updateData.isActive = false; // 房間挑戰結束
      escapeMessage = `🎉 恭喜！你已成功逃出 ${level.name}！`;
      
      console.log(`🎉 玩家 ${userId} 成功逃出房間 ${level.name}`);
    }

    // 更新資料庫
    const updatedLevel = await prisma.level.update({
      where: { id: levelId },
      data: updateData
    });

    if (escapeMessage) {
      // TODO: 發送逃脫成功通知
      console.log(escapeMessage);
    }

    return updatedLevel;

  } catch (error) {
    console.error('Error updating room progress:', error);
    return null;
  }
};

/**
 * 檢查房間逃脫狀態
 * GET /api/levels/:id/escape-status
 */
const getRoomEscapeStatus = async (req, res) => {
  try {
    const { levelId } = req.params;
    const userId = req.user.id;

    // 檢查用戶權限
    const levelMember = await prisma.levelMember.findFirst({
      where: {
        playerId: userId,
        levelId: levelId,
        status: 'ACTIVE'
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            roomState: true,
            completedAt: true,
            isActive: true
          }
        },
        checkIns: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!levelMember) {
      return res.status(403).json({ 
        error: 'Access denied: You are not an active member of this room' 
      });
    }

    const level = levelMember.level;
    const roomState = level.roomState || {};
    const escapeCondition = roomState.escapeCondition || {};
    const userCheckinDays = levelMember.checkIns.length;

    res.json({
      success: true,
      roomName: level.name,
      escaped: !!level.completedAt,
      completedAt: level.completedAt,
      isActive: level.isActive,
      progress: {
        current: userCheckinDays,
        target: escapeCondition.target || 30,
        percentage: roomState.progress || 0
      },
      roomState: {
        theme: roomState.theme || 'classic',
        scene: roomState.scene || 'default_room',
        locked: roomState.locked !== false,
        items: roomState.items || [],
        daysInRoom: userCheckinDays
      },
      escapeCondition: {
        description: escapeCondition.description || '完成挑戰即可逃出房間',
        daysRemaining: Math.max(0, (escapeCondition.target || 30) - userCheckinDays)
      }
    });

  } catch (error) {
    console.error('Error getting escape status:', error);
    return res.status(500).json({ 
      error: 'Failed to get escape status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
};

module.exports = {
  submitCheckin,
  getLevelCheckins,
  getTodayCheckinStatus,
  getPlayerCheckinHistory,
  getRoomEscapeStatus,
  updateRoomProgress
};