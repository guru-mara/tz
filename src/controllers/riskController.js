const Risk = require('../models/riskModel');
const Account = require('../models/accountModel');

// Calculate position size based on risk parameters
exports.calculatePositionSize = async (req, res) => {
  try {
    const { 
      accountId, 
      riskPercent, 
      entryPrice, 
      stopLossPrice, 
      direction 
    } = req.body;
    
    // Validate input
    if (!accountId || !riskPercent || !entryPrice || !stopLossPrice || !direction) {
      return res.status(400).json({
        message: 'Missing required parameters'
      });
    }
    
    // Get account value
    const userId = req.user.user_id;
    const account = await Account.getAccountById(accountId, userId);
    
    if (!account) {
      return res.status(404).json({
        message: 'Trading account not found'
      });
    }
    
    // Calculate position size
    const result = Risk.calculatePositionSize(
      account.current_balance,
      riskPercent,
      entryPrice,
      stopLossPrice,
      direction
    );
    
    res.json(result);
  } catch (error) {
    console.error('Position size calculation error:', error);
    res.status(400).json({
      message: 'Error calculating position size',
      details: error.message
    });
  }
};

// Save risk settings
exports.saveRiskSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const settings = req.body;
    
    console.log('Received settings:', settings);
    
    // Validate settings
    const requiredFields = [
      'default_risk_percent',
      'max_risk_percent',
      'max_daily_risk',
      'max_positions',
      'correlation_limit',
      'max_drawdown_percent'
    ];
    
    const missingFields = requiredFields.filter(field => settings[field] === undefined);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Convert all values to numbers
    const parsedSettings = {
      default_risk_percent: parseFloat(settings.default_risk_percent),
      max_risk_percent: parseFloat(settings.max_risk_percent),
      max_daily_risk: parseFloat(settings.max_daily_risk),
      max_positions: parseInt(settings.max_positions),
      correlation_limit: parseInt(settings.correlation_limit),
      max_drawdown_percent: parseFloat(settings.max_drawdown_percent)
    };
    
    // Save settings
    const result = await Risk.saveRiskSettings(userId, parsedSettings);
    
    res.json(result);
  } catch (error) {
    console.error('Save risk settings error:', error);
    res.status(500).json({
      message: 'Error saving risk settings',
      details: error.message
    });
  }
};

// Get risk settings
exports.getRiskSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const settings = await Risk.getRiskSettings(userId);
    
    res.json(settings);
  } catch (error) {
    console.error('Get risk settings error:', error);
    res.status(500).json({
      message: 'Error retrieving risk settings',
      details: error.message
    });
  }
};

// Get current risk exposure
exports.getCurrentRiskExposure = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { accountId } = req.query;
    
    const exposure = await Risk.getCurrentRiskExposure(userId, accountId || null);
    
    res.json(exposure);
  } catch (error) {
    console.error('Risk exposure error:', error);
    res.status(500).json({
      message: 'Error calculating current risk exposure',
      details: error.message
    });
  }
};

// Check if a trade would violate risk limits
exports.checkRiskLimits = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tradeData = req.body;
    
    // Validate trade data
    if (!tradeData.accountId || !tradeData.entry_price || !tradeData.position_size || !tradeData.direction) {
      return res.status(400).json({
        message: 'Missing required trade parameters'
      });
    }
    
    // Parse numerical values
    const parsedTradeData = {
      accountId: parseInt(tradeData.accountId),
      entry_price: parseFloat(tradeData.entry_price),
      position_size: parseFloat(tradeData.position_size),
      direction: tradeData.direction,
      stop_loss: tradeData.stop_loss ? parseFloat(tradeData.stop_loss) : null
    };
    
    const riskCheck = await Risk.checkRiskLimits(userId, parsedTradeData);
    
    res.json(riskCheck);
  } catch (error) {
    console.error('Risk check error:', error);
    res.status(500).json({
      message: 'Error checking risk limits',
      details: error.message
    });
  }
};