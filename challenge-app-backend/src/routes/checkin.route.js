/**
 * CheckIn Routes - 打卡系統路由
 * 處理所有打卡相關的API端點
 */

const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// 所有路由都需要驗證
router.use(authenticateToken);

/**
 * 提交打卡
 * POST /api/checkin/:levelId
 * Body: { type: "TEXT|IMAGE|CHECKMARK", content?: string, image?: string }
 */
router.post('/:levelId', checkinController.submitCheckin);

/**
 * 獲取今日打卡狀態  
 * GET /api/checkin/:levelId/today
 */
router.get('/:levelId/today', checkinController.getTodayCheckinStatus);

/**
 * 獲取打卡歷史
 * GET /api/checkin/:levelId/history
 */
router.get('/:levelId/history', checkinController.getLevelCheckins);

/**
 * 獲取房間逃脫狀態
 * GET /api/checkin/:levelId/escape-status
 */
router.get('/:levelId/escape-status', checkinController.getRoomEscapeStatus);

module.exports = router;