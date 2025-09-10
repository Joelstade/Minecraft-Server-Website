const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;