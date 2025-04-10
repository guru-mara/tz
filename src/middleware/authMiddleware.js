// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const protect = async (req, res, next) => {
  let token;

  // Check for Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const [users] = await db.execute(
        'SELECT user_id, username, email FROM Users WHERE user_id = ?', 
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      req.user = users[0];
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };