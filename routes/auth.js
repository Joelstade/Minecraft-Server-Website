const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, try again later." }
});

// Existing endpoints
router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/activate', authController.activate);

// NEW: restore session
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: { username: req.user.username, id: req.user.id } });
});

module.exports = router;