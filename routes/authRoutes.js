const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later.'
  });

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);

module.exports = router;
