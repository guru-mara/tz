const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getPerformanceOverTime,
  getEquityCurve,
  getWinLossByFactor,
  getRiskMetrics,
  getConsecutiveStats,
  getDashboardSummary
} = require('../controllers/analyticsController');

const router = express.Router();

// All routes are protected and require authentication
router.get('/performance', protect, getPerformanceOverTime);
router.get('/equity-curve', protect, getEquityCurve);
router.get('/factors', protect, getWinLossByFactor);
router.get('/risk-metrics', protect, getRiskMetrics);
router.get('/streaks', protect, getConsecutiveStats);
router.get('/dashboard', protect, getDashboardSummary);

module.exports = router;