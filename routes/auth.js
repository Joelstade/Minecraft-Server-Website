const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rate limiter (optional)
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, try again later." }
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/activate', authController.activate);

module.exports = router;