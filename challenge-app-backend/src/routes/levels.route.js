// src/routes/levels.route.js
const express = require('express');
const { createLevel } = require('../controllers/levels.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/levels - Create new level (requires authentication)
router.post('/', authenticateToken, createLevel);

module.exports = router;