const db = require('../config/database');

class Trade {
  // Create a new trade
  static async create(userId, accountId, tradeData) {
    const { 
      entry_price, 
      exit_price, 
      position_size, 
      direction, 
      stop_loss,
      entry_date,
      exit_date,
      symbol,
      pre_analysis,
      post_analysis,
      status,
      profit_loss,
      trade_notes
    } = tradeData;

    // Ensure we always have valid data - no undefined values
    const params = [
      userId, 
      accountId, 
      entry_price, 
      exit_price || null, 
      position_size, 
      direction, 
      stop_loss || null, 
      entry_date || new Date(), 
      exit_date || null, 
      symbol || 'XAUUSD',
      pre_analysis ? JSON.stringify(pre_analysis) : null,
      post_analysis ? JSON.stringify(post_analysis) : null,
      status || 'open',
      profit_loss || null,
      trade_notes || ''
    ];

    const [result] = await db.execute(
      `INSERT INTO GoldTrades (
        user_id, 
        account_id, 
        entry_price, 
        exit_price, 
        position_size, 
        direction, 
        stop_loss, 
        entry_date, 
        exit_date, 
        symbol,
        pre_analysis,
        post_analysis,
        status,
        profit_loss,
        trade_notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      params
    );

    return result.insertId;
  }

  // Get all trades for a user
  static async getUserTrades(userId, filters = {}) {
    let query = `SELECT * FROM GoldTrades WHERE user_id = ?`;
    let params = [userId];
    
    // Apply filters if provided
    if (filters.accountId) {
      query += ` AND account_id = ?`;
      params.push(filters.accountId);
    }
    
    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }
    
    if (filters.direction) {
      query += ` AND direction = ?`;
      params.push(filters.direction);
    }
    
    // Add date range filters if provided
    if (filters.startDate) {
      query += ` AND entry_date >= ?`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ` AND entry_date <= ?`;
      params.push(filters.endDate);
    }
    
    // Order by entry date descending (newest first)
    query += ` ORDER BY entry_date DESC`;
    
    const [trades] = await db.execute(query, params);
    
    // Parse JSON stored fields
    return trades.map(trade => {
      return {
        ...trade,
        pre_analysis: trade.pre_analysis ? JSON.parse(trade.pre_analysis) : {},
        post_analysis: trade.post_analysis ? JSON.parse(trade.post_analysis) : {}
      };
    });
  }

  // Get a specific trade by ID
  static async getTradeById(tradeId, userId) {
    const [trades] = await db.execute(
      `SELECT * FROM GoldTrades WHERE trade_id = ? AND user_id = ?`,
      [tradeId, userId]
    );
    
    if (trades.length === 0) return null;
    
    const trade = trades[0];
    
    // Parse JSON stored fields
    return {
      ...trade,
      pre_analysis: trade.pre_analysis ? JSON.parse(trade.pre_analysis) : {},
      post_analysis: trade.post_analysis ? JSON.parse(trade.post_analysis) : {}
    };
  }

  // Update a trade - can be used for adding exit details or updating analysis
  static async updateTrade(tradeId, userId, updateData) {
    let setClause = [];
    let params = [];
    
    // Build the SET clause dynamically based on provided data
    for (const [key, value] of Object.entries(updateData)) {
      // Handle special JSON fields
      if (key === 'pre_analysis' || key === 'post_analysis') {
        setClause.push(`${key} = ?`);
        params.push(JSON.stringify(value));
      } else {
        setClause.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    // Add tradeId and userId to params
    params.push(tradeId);
    params.push(userId);
    
    // Execute the update query
    const [result] = await db.execute(
      `UPDATE GoldTrades SET ${setClause.join(', ')} WHERE trade_id = ? AND user_id = ?`,
      params
    );
    
    return result.affectedRows > 0;
  }

  // Close a trade - sets exit price, calculates P/L and updates account balance
  static async closeTrade(tradeId, userId, closeData) {
    const { exit_price, exit_date, post_analysis } = closeData;
    // Inside the closeTrade method in tradeModel.js
const postAnalysisData = {
    // Existing fields
    was_plan_followed: post_analysis?.was_plan_followed,
    entry_quality: post_analysis?.entry_quality,
    exit_quality: post_analysis?.exit_quality,
    trade_management: post_analysis?.trade_management,
    emotional_state: post_analysis?.emotional_state,
    lessons_learned: post_analysis?.lessons_learned,
    improvements: post_analysis?.improvements,
    
    // New fields
    market_conditions: post_analysis?.market_conditions,
    key_support_resistance: post_analysis?.key_support_resistance,
    trade_duration_assessment: post_analysis?.trade_duration_assessment,
    risk_reward_achieved: post_analysis?.risk_reward_achieved,
    price_action_patterns: post_analysis?.price_action_patterns,
    indicators_effectiveness: post_analysis?.indicators_effectiveness,
    volume_analysis: post_analysis?.volume_analysis,
    news_impact: post_analysis?.news_impact,
    correlation_effects: post_analysis?.correlation_effects,
    session_timing_impact: post_analysis?.session_timing_impact
  };
    // Get the trade details
    const trade = await this.getTradeById(tradeId, userId);
    if (!trade) return false;
    
    // Calculate profit/loss based on direction and prices
    let profitLoss = 0;
    if (trade.direction === 'long') {
      profitLoss = (exit_price - trade.entry_price) * trade.position_size;
    } else {
      profitLoss = (trade.entry_price - exit_price) * trade.position_size;
    }
    
    // Update the trade with exit details
    const updateData = {
      exit_price,
      exit_date: exit_date || new Date(),
      status: 'closed',
      profit_loss: profitLoss
    };
    
    // Add post analysis if provided
    if (post_analysis) {
      updateData.post_analysis = post_analysis;
    }
    
    // Update the trade
    const tradeUpdated = await this.updateTrade(tradeId, userId, updateData);
    if (!tradeUpdated) return false;
    
    // Update account balance
    const Account = require('./accountModel');
    const account = await Account.getAccountById(trade.account_id, userId);
    if (account) {
      const newBalance = account.current_balance + profitLoss;
      await Account.updateBalance(trade.account_id, newBalance);
    }
    
    return true;
  }

  // Delete a trade
  static async deleteTrade(tradeId, userId) {
    const [result] = await db.execute(
      `DELETE FROM GoldTrades WHERE trade_id = ? AND user_id = ?`,
      [tradeId, userId]
    );
    
    return result.affectedRows > 0;
  }
  
  // Get trade statistics
  static async getTradeStatistics(userId, accountId = null) {
    // Build query based on whether accountId is provided
    let query = `
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(profit_loss) as total_profit_loss,
        AVG(profit_loss) as avg_profit_loss,
        MAX(profit_loss) as max_profit,
        MIN(CASE WHEN profit_loss < 0 THEN profit_loss ELSE NULL END) as max_loss
      FROM GoldTrades 
      WHERE user_id = ? AND status = 'closed'
    `;
    
    const params = [userId];
    
    if (accountId) {
      query += ' AND account_id = ?';
      params.push(accountId);
    }
    
    const [stats] = await db.execute(query, params);
    
    // Calculate win rate
    const result = stats[0];
    const winRate = result.total_trades > 0 
      ? (result.winning_trades / result.total_trades) * 100 
      : 0;
    
    return {
      ...result,
      win_rate: winRate
    };
  }
}

module.exports = Trade;