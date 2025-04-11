const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getMarketData,
  getLatestPrice,
  syncMarketData,
  getSupportResistanceLevels,
  getCorrelationData,
  getTradeMarketData
} = require('../controllers/marketController');

const router = express.Router();

// All routes are protected and require authentication
router.get('/data', protect, getMarketData);
router.get('/price', protect, getLatestPrice);
router.post('/sync', protect, syncMarketData);
router.get('/levels', protect, getSupportResistanceLevels);
router.get('/correlation', protect, getCorrelationData);
router.get('/trade/:tradeId', protect, getTradeMarketData);

module.exports = router;