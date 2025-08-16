// src/routes/levels.route.js
const express = require('express');
const { createLevel, getLevels } = require('../controllers/levels.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/levels - Get user's levels (requires authentication)
router.get('/', authenticateToken, getLevels);

// POST /api/levels - Create new level (requires authentication)
router.post('/', authenticateToken, createLevel);

module.exports = router;