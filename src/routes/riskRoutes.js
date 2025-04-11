const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  calculatePositionSize,
  saveRiskSettings,
  getRiskSettings,
  getCurrentRiskExposure,
  checkRiskLimits
} = require('../controllers/riskController');

const router = express.Router();

// All routes are protected and require authentication
router.post('/position-size', protect, calculatePositionSize);
router.post('/settings', protect, saveRiskSettings);
router.get('/settings', protect, getRiskSettings);
router.get('/exposure', protect, getCurrentRiskExposure);
router.post('/check-limits', protect, checkRiskLimits);

module.exports = router;