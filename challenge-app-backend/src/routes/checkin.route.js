/**
 * CheckIn Routes - 打卡系統路由
 * 處理所有打卡相關的API端點
 */

const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const authMiddleware = require('../middleware/auth.middleware');

// 所有路由都需要驗證
router.use(authMiddleware);

/**
 * 提交打卡
 * POST /api/levels/:id/checkins
 * Body: { type: "TEXT|IMAGE|CHECKMARK", content?: string, imageData?: string }
 */
router.post('/:id/checkins', checkinController.submitCheckin);

/**
 * 獲取關卡打卡記錄
 * GET /api/levels/:id/checkins
 * Query: { date?: "YYYY-MM-DD", playerId?: string }
 */
router.get('/:id/checkins', checkinController.getLevelCheckins);

/**
 * 獲取今日打卡狀態
 * GET /api/levels/:id/checkins/today
 */
router.get('/:id/checkins/today', checkinController.getTodayCheckinStatus);

/**
 * 獲取玩家打卡歷史
 * GET /api/levels/:id/checkins/history/:playerId
 * Query: { limit?: number, offset?: number }
 */
router.get('/:id/checkins/history/:playerId', checkinController.getPlayerCheckinHistory);

module.exports = router;