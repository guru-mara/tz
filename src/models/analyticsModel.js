const db = require('../config/database');

class Analytics {
  // Get performance metrics over time
  static async getPerformanceOverTime(userId, accountId = null, interval = 'monthly') {
    let timeFormat;
    let groupBy;
    
    // Set SQL date formatting based on interval
    switch(interval) {
      case 'weekly':
        timeFormat = '%Y-%u'; // Year-Week
        groupBy = 'YEARWEEK(exit_date)';
        break;
      case 'daily':
        timeFormat = '%Y-%m-%d'; // Year-Month-Day
        groupBy = 'DATE(exit_date)';
        break;
      case 'yearly':
        timeFormat = '%Y'; // Year
        groupBy = 'YEAR(exit_date)';
        break;
      case 'monthly':
      default:
        timeFormat = '%Y-%m'; // Year-Month
        groupBy = 'YEAR(exit_date), MONTH(exit_date)';
        break;
    }
    
    // Build query parameters
    const params = [userId];
    let accountFilter = '';
    
    if (accountId) {
      accountFilter = ' AND account_id = ?';
      params.push(accountId);
    }
    
    // Get performance data
    const query = `
      SELECT 
        DATE_FORMAT(exit_date, '${timeFormat}') as time_period,
        COUNT(*) as trade_count,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(profit_loss) as period_pnl,
        AVG(profit_loss) as avg_profit_loss,
        MAX(profit_loss) as max_profit,
        MIN(profit_loss) as max_loss,
        AVG(CASE WHEN profit_loss > 0 THEN profit_loss ELSE NULL END) as avg_win,
        AVG(CASE WHEN profit_loss < 0 THEN profit_loss ELSE NULL END) as avg_loss
      FROM GoldTrades
      WHERE user_id = ? ${accountFilter} AND status = 'closed' AND exit_date IS NOT NULL
      GROUP BY ${groupBy}
      ORDER BY exit_date ASC
    `;
    
    const [results] = await db.execute(query, params);
    
    // Calculate additional metrics for each period
    const enhancedResults = results.map(period => {
      const winRate = period.trade_count > 0 
        ? (period.winning_trades / period.trade_count) * 100 
        : 0;
        
      const profitFactor = Math.abs(period.avg_loss) > 0 
        ? Math.abs(period.avg_win / period.avg_loss) 
        : period.winning_trades > 0 ? Infinity : 0;
      
      return {
        ...period,
        win_rate: parseFloat(winRate.toFixed(2)),
        profit_factor: parseFloat(profitFactor.toFixed(2))
      };
    });
    
    return enhancedResults;
  }
  
  // Get equity curve data
  static async getEquityCurve(userId, accountId = null) {
    const params = [userId];
    let accountFilter = '';
    
    if (accountId) {
      accountFilter = ' AND account_id = ?';
      params.push(accountId);
    }
    
    const query = `
      SELECT 
        trade_id,
        exit_date,
        profit_loss,
        (
          SELECT SUM(t2.profit_loss) 
          FROM GoldTrades t2 
          WHERE t2.user_id = ? ${accountFilter} 
            AND t2.status = 'closed' 
            AND t2.exit_date <= t1.exit_date
        ) as running_balance
      FROM GoldTrades t1
      WHERE t1.user_id = ? ${accountFilter} 
        AND t1.status = 'closed' 
        AND t1.exit_date IS NOT NULL
      ORDER BY t1.exit_date ASC
    `;
    
    // Add userId (and optionally accountId) again for the subquery
    params.unshift(userId);
    if (accountId) {
      params.unshift(accountId);
    }
    
    const [results] = await db.execute(query, params);
    return results;
  }
  
  // Get win/loss ratio by various factors
  static async getWinLossByFactor(userId, factor, accountId = null) {
    let groupColumn;
    
    // Determine which column to group by
    switch(factor) {
      case 'direction':
        groupColumn = 'direction';
        break;
      case 'day_of_week':
        groupColumn = 'DAYNAME(entry_date)';
        break;
      case 'time_of_day':
        groupColumn = 'HOUR(entry_date)';
        break;
      case 'daily_trend':
        groupColumn = 'JSON_UNQUOTE(JSON_EXTRACT(pre_analysis, "$.daily_trend"))';
        break;
      case 'htf_setup':
        groupColumn = 'JSON_UNQUOTE(JSON_EXTRACT(pre_analysis, "$.htf_setup"))';
        break;
      case 'clean_range':
        groupColumn = 'JSON_UNQUOTE(JSON_EXTRACT(pre_analysis, "$.clean_range"))';
        break;
      case 'volume_time':
        groupColumn = 'JSON_UNQUOTE(JSON_EXTRACT(pre_analysis, "$.volume_time"))';
        break;
      case 'emotional_state':
        groupColumn = 'JSON_UNQUOTE(JSON_EXTRACT(post_analysis, "$.emotional_state"))';
        break;
      default:
        throw new Error('Invalid factor specified');
    }
    
    const params = [userId];
    let accountFilter = '';
    
    if (accountId) {
      accountFilter = ' AND account_id = ?';
      params.push(accountId);
    }
    
    const query = `
      SELECT 
        ${groupColumn} as factor,
        COUNT(*) as trade_count,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(profit_loss) as total_pnl,
        AVG(profit_loss) as avg_profit_loss
      FROM GoldTrades
      WHERE user_id = ? ${accountFilter} AND status = 'closed'
      GROUP BY ${groupColumn}
      ORDER BY avg_profit_loss DESC
    `;
    
    const [results] = await db.execute(query, params);
    
    // Calculate win rate for each factor
    const enhancedResults = results.map(item => {
      const winRate = item.trade_count > 0 
        ? (item.winning_trades / item.trade_count) * 100 
        : 0;
        
      return {
        ...item,
        win_rate: parseFloat(winRate.toFixed(2))
      };
    });
    
    return enhancedResults;
  }
  
  //// Get risk metrics
static async getRiskMetrics(userId, accountId = null) {
  const params = [userId];
  let accountFilter = '';
  
  if (accountId) {
    accountFilter = ' AND account_id = ?';
    params.push(accountId);
  }
  
  // Get all closed trades
  const query = `
    SELECT 
      profit_loss,
      entry_price,
      exit_price,
      stop_loss,
      position_size,
      direction
    FROM GoldTrades
    WHERE user_id = ? ${accountFilter} AND status = 'closed'
    ORDER BY exit_date DESC
  `;
  
  const [trades] = await db.execute(query, params);
  
  // Default values if no trades found
  if (trades.length === 0) {
    return {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      profit_factor: 0,
      average_profit: 0,
      average_loss: 0,
      max_drawdown: 0,
      current_drawdown: 0,
      average_risk_reward_ratio: 0,
      average_risked_amount: 0,
      expectancy: 0,
      sharpe_ratio: 0,
      total_profit_loss: 0
    };
  }
  
  // Calculate risk metrics
  let winningTrades = 0;
  let losingTrades = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  let peakBalance = 0;
  let runningBalance = 0;
  let riskRewardRatios = [];
  let riskedAmounts = [];
  
  for (const trade of trades) {
    // Ensure profit_loss is a number
    const profitLoss = parseFloat(trade.profit_loss || 0);
    
    // Update profit/loss counters
    if (profitLoss > 0) {
      winningTrades++;
      totalProfit += profitLoss;
    } else {
      losingTrades++;
      totalLoss += profitLoss;
    }
    
    // Update balance and drawdown
    runningBalance += profitLoss;
    
    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
      currentDrawdown = 0;
    } else {
      currentDrawdown = peakBalance - runningBalance;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }
    
    // Calculate risk/reward if stop loss is present
    if (trade.stop_loss) {
      const risk = Math.abs(parseFloat(trade.entry_price) - parseFloat(trade.stop_loss)) * parseFloat(trade.position_size);
      const reward = Math.abs(profitLoss);
      const riskRewardRatio = reward / risk;
      
      if (!isNaN(riskRewardRatio) && isFinite(riskRewardRatio)) {
        riskRewardRatios.push(riskRewardRatio);
      }
      
      if (!isNaN(risk) && isFinite(risk)) {
        riskedAmounts.push(risk);
      }
    }
  }
  
  // Calculate average risk metrics
  const avgRiskRewardRatio = riskRewardRatios.length > 0 
    ? riskRewardRatios.reduce((sum, ratio) => sum + ratio, 0) / riskRewardRatios.length 
    : 0;
    
  const avgRiskedAmount = riskedAmounts.length > 0
    ? riskedAmounts.reduce((sum, amount) => sum + amount, 0) / riskedAmounts.length
    : 0;
    
  const winRate = trades.length > 0 
    ? (winningTrades / trades.length) * 100 
    : 0;
    
  const profitFactor = Math.abs(totalLoss) > 0 
    ? Math.abs(totalProfit / totalLoss) 
    : totalProfit > 0 ? 999 : 0;
    
  const expectancy = trades.length > 0 
    ? (totalProfit + totalLoss) / trades.length 
    : 0;
    
  // Calculate Sharpe-like ratio (if we have enough trades)
  const returns = trades.map(trade => parseFloat(trade.profit_loss || 0));
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  
  let standardDeviation = 0;
  if (returns.length > 1) {
    const squaredDiffs = returns.map(ret => Math.pow(ret - avgReturn, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);
    standardDeviation = Math.sqrt(variance);
  }
  
  const sharpeRatio = standardDeviation > 0 
    ? avgReturn / standardDeviation 
    : 0;
  
  // Ensure all values are valid numbers before using toFixed
  const totalProfitLoss = totalProfit + totalLoss;
  
  return {
    total_trades: trades.length,
    winning_trades: winningTrades,
    losing_trades: losingTrades,
    win_rate: parseFloat((winRate || 0).toFixed(2)),
    profit_factor: parseFloat((profitFactor || 0).toFixed(2)),
    average_profit: parseFloat((winningTrades > 0 ? totalProfit / winningTrades : 0).toFixed(2)),
    average_loss: parseFloat((losingTrades > 0 ? totalLoss / losingTrades : 0).toFixed(2)),
    max_drawdown: parseFloat((maxDrawdown || 0).toFixed(2)),
    current_drawdown: parseFloat((currentDrawdown || 0).toFixed(2)),
    average_risk_reward_ratio: parseFloat((avgRiskRewardRatio || 0).toFixed(2)),
    average_risked_amount: parseFloat((avgRiskedAmount || 0).toFixed(2)),
    expectancy: parseFloat((expectancy || 0).toFixed(2)),
    sharpe_ratio: parseFloat((sharpeRatio || 0).toFixed(2)),
    total_profit_loss: parseFloat((totalProfitLoss || 0).toFixed(2))
  };
}
  
  // Get consecutive wins and losses
  static async getConsecutiveStats(userId, accountId = null) {
    const params = [userId];
    let accountFilter = '';
    
    if (accountId) {
      accountFilter = ' AND account_id = ?';
      params.push(accountId);
    }
    
    // Get all closed trades ordered by date
    const query = `
      SELECT 
        trade_id,
        profit_loss > 0 as is_win
      FROM GoldTrades
      WHERE user_id = ? ${accountFilter} AND status = 'closed'
      ORDER BY exit_date ASC
    `;
    
    const [trades] = await db.execute(query, params);
    
    if (trades.length === 0) {
      return {
        max_consecutive_wins: 0,
        max_consecutive_losses: 0,
        current_streak: 0,
        is_current_streak_winning: null
      };
    }
    
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    
    // Calculate consecutive wins/losses
    for (const trade of trades) {
      if (trade.is_win) {
        // Reset loss counter when we have a win
        currentConsecutiveLosses = 0;
        currentConsecutiveWins++;
        
        if (currentConsecutiveWins > maxConsecutiveWins) {
          maxConsecutiveWins = currentConsecutiveWins;
        }
      } else {
        // Reset win counter when we have a loss
        currentConsecutiveWins = 0;
        currentConsecutiveLosses++;
        
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentConsecutiveLosses;
        }
      }
    }
    
    // Determine current streak
    const currentStreak = trades[trades.length - 1].is_win 
      ? currentConsecutiveWins 
      : -currentConsecutiveLosses;
    
    return {
      max_consecutive_wins: maxConsecutiveWins,
      max_consecutive_losses: maxConsecutiveLosses,
      current_streak: currentStreak,
      is_current_streak_winning: trades[trades.length - 1].is_win
    };
  }
}

module.exports = Analytics;