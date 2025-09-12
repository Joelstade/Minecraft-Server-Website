// middleware/auth.js
// Middleware to authenticate user via JWT stored in HttpOnly cookie

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'supersecretkey';

function authenticateToken(req, res, next) {
  // Get token from cookie
  const token = req.cookies?.token; // requires cookie-parser middleware
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }

    req.user = user; // attach decoded user to request
    next();
  });
}

module.exports = authenticateToken;