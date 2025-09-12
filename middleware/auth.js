// middleware/auth.js
// Middleware to authenticate user via JWT stored in HttpOnly cookie

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'supersecretkey';

function authenticateToken(req, res, next) {
  try {
    // Get token from HttpOnly cookie
    const token = req.cookies?.token; // requires cookie-parser middleware
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    // Verify and decode
    const decoded = jwt.verify(token, SECRET);

    // Attach decoded user to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[AUTH] JWT verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = authenticateToken;