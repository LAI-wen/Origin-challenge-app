// src/routes/levels.route.js
const express = require('express');
const { createLevel, getLevels, getLevelDetails, joinLevel, joinLevelByCode, updateMemberRole, removeMember, updateLevelSettings, updateLevelStatus } = require('../controllers/levels.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/levels - Get user's levels (requires authentication)
router.get('/', authenticateToken, getLevels);

// POST /api/levels - Create new level (requires authentication)
router.post('/', authenticateToken, createLevel);

// POST /api/levels/join - Join level by invite code (requires authentication)
router.post('/join', authenticateToken, joinLevelByCode);

// GET /api/levels/:id - Get level details with role-based filtering (requires authentication)
router.get('/:id', authenticateToken, getLevelDetails);

// PUT /api/levels/:id - Update level settings and privacy controls (requires authentication)
router.put('/:id', authenticateToken, updateLevelSettings);

// PUT /api/levels/:id/status - Update level status (active/completed) (requires authentication)
router.put('/:id/status', authenticateToken, updateLevelStatus);

// POST /api/levels/:id/join - Join level with invite code (requires authentication)
router.post('/:id/join', authenticateToken, joinLevel);

// PUT /api/levels/:id/members/:memberId - Update member role (requires authentication)
router.put('/:id/members/:memberId', authenticateToken, updateMemberRole);

// DELETE /api/levels/:id/members/:memberId - Remove member (requires authentication)
router.delete('/:id/members/:memberId', authenticateToken, removeMember);

module.exports = router;