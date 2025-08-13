// src/routes/auth.route.js
const express = require('express');
const { googleLogin } = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/auth/google - Google OAuth login endpoint
router.post('/google', googleLogin);

module.exports = router;