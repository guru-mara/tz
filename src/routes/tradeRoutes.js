const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createTrade,
  getUserTrades,
  getTradeById,
  updateTrade,
  closeTrade,
  deleteTrade,
  getTradeStatistics,
  addPostAnalysis,
  comparePlannedVsActual
} = require('../controllers/tradeController');

const router = express.Router();

// All routes are protected and require authentication
router.route('/')
  .post(protect, createTrade)  // Create a new trade
  .get(protect, getUserTrades); // Get all user trades

router.route('/statistics')
  .get(protect, getTradeStatistics); // Get trade statistics

router.route('/:id')
  .get(protect, getTradeById)      // Get specific trade
  .put(protect, updateTrade)       // Update a trade (pre-analysis)
  .delete(protect, deleteTrade);   // Delete a trade

router.route('/:id/close')
  .put(protect, closeTrade);       // Close a trade with basic post-analysis

router.route('/:id/post-analysis')
  .put(protect, addPostAnalysis);  // Add detailed post-analysis

router.route('/:id/comparison')
  .get(protect, comparePlannedVsActual); // Compare planned vs actual results

module.exports = router;