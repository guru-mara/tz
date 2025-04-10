// src/routes/authRoutes.js
const express = require('express');
const { register, login } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Example of a protected route
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;