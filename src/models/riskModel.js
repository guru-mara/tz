const db = require('../config/database');

class Risk {
  // Calculate position size based on risk parameters
  static calculatePositionSize(accountValue, riskPercent, entryPrice, stopLossPrice, direction) {
    // Validate inputs
    if (!accountValue || !riskPercent || !entryPrice || !stopLossPrice) {
      throw new Error('Missing required parameters for position size calculation');
    }
    
    // Convert to numbers and ensure valid values
    accountValue = parseFloat(accountValue);
    riskPercent = parseFloat(riskPercent);
    entryPrice = parseFloat(entryPrice);
    stopLossPrice = parseFloat(stopLossPrice);
    
    if (isNaN(accountValue) || isNaN(riskPercent) || isNaN(entryPrice) || isNaN(stopLossPrice)) {
      throw new Error('Invalid numerical values provided');
    }
    
    if (accountValue <= 0 || riskPercent <= 0 || entryPrice <= 0) {
      throw new Error('Values must be positive');
    }
    
    if (riskPercent > 100) {
      throw new Error('Risk percentage cannot exceed 100%');
    }
    
    // Check if stop loss is valid based on direction
    if ((direction === 'long' && stopLossPrice >= entryPrice) || 
        (direction === 'short' && stopLossPrice <= entryPrice)) {
      throw new Error('Stop loss price is invalid for the selected direction');
    }
    
    // Calculate dollar risk amount
    const dollarRisk = accountValue * (riskPercent / 100);
    
    // Calculate price difference between entry and stop loss
    const priceDifference = Math.abs(entryPrice - stopLossPrice);
    
    // Calculate position size
    const positionSize = dollarRisk / priceDifference;
    
    // Calculate total position value
    const positionValue = positionSize * entryPrice;
    
    return {
      account_value: accountValue,
      risk_percent: riskPercent,
      dollar_risk: parseFloat(dollarRisk.toFixed(2)),
      price_difference: parseFloat(priceDifference.toFixed(2)),
      position_size: parseFloat(positionSize.toFixed(2)),
      position_value: parseFloat(positionValue.toFixed(2)),
      leverage_used: parseFloat((positionValue / accountValue).toFixed(2)),
      risk_reward_1r: parseFloat(entryPrice.toFixed(2)),
      risk_reward_2r: direction === 'long' 
        ? parseFloat((entryPrice + priceDifference * 2).toFixed(2)) 
        : parseFloat((entryPrice - priceDifference * 2).toFixed(2)),
      risk_reward_3r: direction === 'long' 
        ? parseFloat((entryPrice + priceDifference * 3).toFixed(2))
        : parseFloat((entryPrice - priceDifference * 3).toFixed(2))
    };
  }
  
  // Save risk settings for a user
  static async saveRiskSettings(userId, settings) {
    try {
      // Check if settings already exist for this user
      const [rows] = await db.execute(
        'SELECT * FROM RiskSettings WHERE user_id = ?',
        [userId]
      );
      
      if (rows.length > 0) {
        // Update existing settings
        await db.execute(
          `UPDATE RiskSettings SET 
            default_risk_percent = ?,
            max_risk_percent = ?,
            max_daily_risk = ?,
            max_positions = ?,
            correlation_limit = ?,
            max_drawdown_percent = ?,
            updated_at = NOW()
          WHERE user_id = ?`,
          [
            settings.default_risk_percent,
            settings.max_risk_percent,
            settings.max_daily_risk,
            settings.max_positions,
            settings.correlation_limit,
            settings.max_drawdown_percent,
            userId
          ]
        );
        
        return { message: 'Risk settings updated successfully' };
      } else {
        // Create new settings
        await db.execute(
          `INSERT INTO RiskSettings (
            user_id,
            default_risk_percent,
            max_risk_percent,
            max_daily_risk,
            max_positions,
            correlation_limit,
            max_drawdown_percent
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            settings.default_risk_percent,
            settings.max_risk_percent,
            settings.max_daily_risk,
            settings.max_positions,
            settings.correlation_limit,
            settings.max_drawdown_percent
          ]
        );
        
        return { message: 'Risk settings created successfully' };
      }
    } catch (error) {
      console.error('Error saving risk settings:', error);
      throw error;
    }
  }
  
  // Get risk settings for a user
  static async getRiskSettings(userId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM RiskSettings WHERE user_id = ?',
        [userId]
      );
      
      if (rows.length === 0) {
        // Return default values if no settings found
        return {
          default_risk_percent: 1,
          max_risk_percent: 2,
          max_daily_risk: 5,
          max_positions: 5,
          correlation_limit: 3,
          max_drawdown_percent: 10
        };
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error fetching risk settings:', error);
      throw error;
    }
  }
  
  // Calculate current risk exposure
  static async getCurrentRiskExposure(userId, accountId = null) {
    try {
      let params = [userId];
      let accountFilter = '';
      
      if (accountId) {
        accountFilter = ' AND t.account_id = ?';
        params.push(accountId);
      }
      
      // Get all open trades
      const [openTrades] = await db.execute(
        `SELECT 
          t.*,
          a.current_balance as account_balance
        FROM GoldTrades t
        JOIN TradingAccounts a ON t.account_id = a.account_id
        WHERE t.user_id = ? ${accountFilter} AND t.status = 'open'`,
        params
      );
      
      if (openTrades.length === 0) {
        return {
          open_positions: 0,
          total_risk_amount: 0,
          total_risk_percent: 0,
          positions: []
        };
      }
      
      // Calculate risk for each position
      const positions = openTrades.map(trade => {
        const entryPrice = parseFloat(trade.entry_price);
        const stopLoss = parseFloat(trade.stop_loss || 0);
        const positionSize = parseFloat(trade.position_size);
        const accountBalance = parseFloat(trade.account_balance);
        
        // Skip calculation if stop loss is not set
        if (stopLoss === 0) {
          return {
            trade_id: trade.trade_id,
            symbol: trade.symbol,
            direction: trade.direction,
            position_size: positionSize,
            entry_price: entryPrice,
            risk_amount: null,
            risk_percent: null,
            message: 'Stop loss not set'
          };
        }
        
        const priceDifference = Math.abs(entryPrice - stopLoss);
        const riskAmount = priceDifference * positionSize;
        const riskPercent = (riskAmount / accountBalance) * 100;
        
        return {
          trade_id: trade.trade_id,
          symbol: trade.symbol,
          direction: trade.direction,
          position_size: positionSize,
          entry_price: entryPrice,
          stop_loss: stopLoss,
          risk_amount: parseFloat(riskAmount.toFixed(2)),
          risk_percent: parseFloat(riskPercent.toFixed(2))
        };
      });
      
      // Calculate totals
      const validPositions = positions.filter(p => p.risk_amount !== null);
      const totalRiskAmount = validPositions.reduce((sum, p) => sum + p.risk_amount, 0);
      const totalRiskPercent = parseFloat((totalRiskAmount / openTrades[0].account_balance * 100).toFixed(2));
      
      return {
        open_positions: openTrades.length,
        total_risk_amount: parseFloat(totalRiskAmount.toFixed(2)),
        total_risk_percent: totalRiskPercent,
        positions: positions
      };
    } catch (error) {
      console.error('Error calculating risk exposure:', error);
      throw error;
    }
  }
  
  // Check if a new trade would violate risk limits
  static async checkRiskLimits(userId, tradeData) {
    try {
      // Get user's risk settings
      const riskSettings = await this.getRiskSettings(userId);
      
      // Get current risk exposure
      const currentExposure = await this.getCurrentRiskExposure(userId);
      
      // Get account information
      const [accountRows] = await db.execute(
        'SELECT current_balance FROM TradingAccounts WHERE account_id = ? AND user_id = ?',
        [tradeData.accountId, userId]
      );
      
      if (accountRows.length === 0) {
        throw new Error('Account not found');
      }
      
      const accountBalance = parseFloat(accountRows[0].current_balance);
      
      // Skip calculation if stop loss is not provided
      if (!tradeData.stop_loss) {
        return {
          within_limits: true,
          warnings: ['No stop loss provided, unable to verify risk limits']
        };
      }
      
      const priceDifference = Math.abs(tradeData.entry_price - tradeData.stop_loss);
      const riskAmount = priceDifference * tradeData.position_size;
      const riskPercent = (riskAmount / accountBalance) * 100;
      
      // Check against limits
      const warnings = [];
      let withinLimits = true;
      
      // Check individual position risk
      if (riskPercent > riskSettings.max_risk_percent) {
        warnings.push(`Trade risk (${riskPercent.toFixed(2)}%) exceeds maximum position risk (${riskSettings.max_risk_percent}%)`);
        withinLimits = false;
      }
      
      // Check total risk across all positions
      const newTotalRiskPercent = currentExposure.total_risk_percent + riskPercent;
      if (newTotalRiskPercent > riskSettings.max_daily_risk) {
        warnings.push(`Total risk exposure (${newTotalRiskPercent.toFixed(2)}%) would exceed maximum daily risk (${riskSettings.max_daily_risk}%)`);
        withinLimits = false;
      }
      
      // Check max positions
      if (currentExposure.open_positions >= riskSettings.max_positions) {
        warnings.push(`Maximum number of concurrent positions (${riskSettings.max_positions}) already reached`);
        withinLimits = false;
      }
      
      // Check correlation (same direction trades)
      const sameDirectionTrades = currentExposure.positions.filter(p => p.direction === tradeData.direction).length;
      if (sameDirectionTrades >= riskSettings.correlation_limit) {
        warnings.push(`Maximum number of correlated positions (${riskSettings.correlation_limit}) in same direction would be exceeded`);
        withinLimits = false;
      }
      
      return {
        within_limits: withinLimits,
        trade_risk_percent: parseFloat(riskPercent.toFixed(2)),
        trade_risk_amount: parseFloat(riskAmount.toFixed(2)),
        total_risk_percent: parseFloat(newTotalRiskPercent.toFixed(2)),
        warnings: warnings
      };
    } catch (error) {
      console.error('Error checking risk limits:', error);
      throw error;
    }
  }
}

module.exports = Risk;