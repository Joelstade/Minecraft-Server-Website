const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, try again later." }
});

module.exports = loginLimiter;