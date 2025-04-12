const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Account = require('../models/accountModel');
const tradeCalculator = require('../utils/tradeCalculator');
const db = require('../config/database');

const router = express.Router();

// Calculate position size
router.post('/position-size', protect, async (req, res) => {
  try {
    const { account_id, risk_percentage, entry_price, stop_loss } = req.body;
    
    // Validate input
    if (!account_id || !risk_percentage || !entry_price || !stop_loss) {
      return res.status(400).json({ 
        message: 'Account ID, risk percentage, entry price, and stop loss are required' 
      });
    }
    
    // Verify account belongs to user
    const account = await Account.getAccountById(account_id, req.user.user_id);
    if (!account) {
      return res.status(400).json({ message: 'Invalid account selected' });
    }
    
    // Calculate position size
    const result = await tradeCalculator.calculatePositionSize(
      account_id,
      risk_percentage,
      entry_price,
      stop_loss
    );
    
    res.json(result);
  } catch (error) {
    console.error('Position size calculation error:', error);
    res.status(500).json({ message: 'Error calculating position size: ' + error.message });
  }
});

// Calculate trade analytics
router.post('/trade-analytics', protect, async (req, res) => {
  try {
    const scenarioData = req.body;
    
    // Validate input
    if (!scenarioData.entry_price || !scenarioData.stop_loss || !scenarioData.take_profit || !scenarioData.position_size) {
      return res.status(400).json({ 
        message: 'Entry price, stop loss, take profit, and position size are required' 
      });
    }
    
    // If account_id is provided, verify it belongs to user
    if (scenarioData.account_id) {
      const account = await Account.getAccountById(scenarioData.account_id, req.user.user_id);
      if (!account) {
        return res.status(400).json({ message: 'Invalid account selected' });
      }
    }
    
    // Calculate trade analytics
    const analytics = await tradeCalculator.calculateTradeAnalytics(scenarioData);
    
    res.json(analytics);
  } catch (error) {
    console.error('Trade analytics calculation error:', error);
    res.status(500).json({ message: 'Error calculating trade analytics: ' + error.message });
  }
});

// Run Monte Carlo simulation
router.post('/monte-carlo', protect, async (req, res) => {
  try {
    const strategyParams = req.body;
    
    // Validate input
    if (!strategyParams.initialBalance || !strategyParams.numberOfTrades) {
      return res.status(400).json({ 
        message: 'Initial balance and number of trades are required' 
      });
    }
    
    // Run Monte Carlo simulation
    const results = tradeCalculator.runMonteCarloSimulation(strategyParams);
    
    // Return summarized results to avoid large response size
    // Remove individual simulation details before returning
    const { simulations, ...summarizedResults } = results;
    
    res.json(summarizedResults);
  } catch (error) {
    console.error('Monte Carlo simulation error:', error);
    res.status(500).json({ message: 'Error running Monte Carlo simulation: ' + error.message });
  }
});

// Calculate strategy metrics from existing simulations
router.get('/strategy-metrics', protect, async (req, res) => {
  try {
    // Get all user's trade simulations
    const [trades] = await db.execute(
      `SELECT * FROM TradeSimulations 
       WHERE user_id = ? AND simulation_result IS NOT NULL`,
      [req.user.user_id]
    );
    
    // Calculate strategy metrics
    const metrics = tradeCalculator.calculateStrategyMetrics(trades);
    
    res.json(metrics);
  } catch (error) {
    console.error('Strategy metrics calculation error:', error);
    res.status(500).json({ message: 'Error calculating strategy metrics: ' + error.message });
  }
});

module.exports = router;