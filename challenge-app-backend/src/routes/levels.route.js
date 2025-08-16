// src/routes/levels.route.js
const express = require('express');
const { createLevel, getLevels, joinLevel } = require('../controllers/levels.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/levels - Get user's levels (requires authentication)
router.get('/', authenticateToken, getLevels);

// POST /api/levels - Create new level (requires authentication)
router.post('/', authenticateToken, createLevel);

// POST /api/levels/:id/join - Join level with invite code (requires authentication)
router.post('/:id/join', authenticateToken, joinLevel);

module.exports = router;