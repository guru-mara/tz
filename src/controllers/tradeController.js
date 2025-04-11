const Trade = require('../models/tradeModel');
const Account = require('../models/accountModel');

// Create a new trade with pre-entry analysis
exports.createTrade = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { accountId, tradeData } = req.body;
    
    // Validate input
    if (!accountId || !tradeData || !tradeData.entry_price || !tradeData.position_size || !tradeData.direction) {
      return res.status(400).json({ 
        message: 'Missing required trade information' 
      });
    }
    
    // Verify the account exists and belongs to the user
    const account = await Account.getAccountById(accountId, userId);
    if (!account) {
      return res.status(404).json({
        message: 'Trading account not found or unauthorized'
      });
    }
    
    // Extract pre-entry analysis fields properly to avoid undefined values
    const pre_analysis = {};
    
    if (tradeData.daily_trend !== undefined) pre_analysis.daily_trend = tradeData.daily_trend;
    if (tradeData.clean_range !== undefined) pre_analysis.clean_range = tradeData.clean_range;
    if (tradeData.volume_time !== undefined) pre_analysis.volume_time = tradeData.volume_time;
    if (tradeData.previous_session_volume !== undefined) pre_analysis.previous_session_volume = tradeData.previous_session_volume;
    if (tradeData.htf_setup !== undefined) pre_analysis.htf_setup = tradeData.htf_setup;
    if (tradeData.ltf_confirmation !== undefined) pre_analysis.ltf_confirmation = tradeData.ltf_confirmation;
    if (tradeData.counter_trend_partials !== undefined) pre_analysis.counter_trend_partials = tradeData.counter_trend_partials;
    if (tradeData.consolidation_strategy !== undefined) pre_analysis.consolidation_strategy = tradeData.consolidation_strategy;
    if (tradeData.four_hour_breakout !== undefined) pre_analysis.four_hour_breakout = tradeData.four_hour_breakout;
    
    // Prepare trade data without any undefined values
    const tradeDataForDb = {
      entry_price: tradeData.entry_price,
      position_size: tradeData.position_size,
      direction: tradeData.direction,
      stop_loss: tradeData.stop_loss || null,
      entry_date: tradeData.entry_date || new Date(),
      exit_date: tradeData.exit_date || null,
      symbol: tradeData.symbol || 'XAUUSD',
      trade_notes: tradeData.trade_notes || '',
      status: tradeData.status || 'open',
      profit_loss: tradeData.profit_loss || null,
      pre_analysis: Object.keys(pre_analysis).length > 0 ? pre_analysis : null
    };
    
    // Create trade with clean data
    const tradeId = await Trade.create(userId, accountId, tradeDataForDb);
    
    res.status(201).json({
      message: 'Trade created successfully',
      trade_id: tradeId
    });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ 
      message: 'Error creating trade',
      details: error.message 
    });
  }
};

// Get all trades for the authenticated user
exports.getUserTrades = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const filters = {
      accountId: req.query.accountId || null,
      status: req.query.status || null,
      direction: req.query.direction || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };
    
    const trades = await Trade.getUserTrades(userId, filters);
    
    res.json(trades);
  } catch (error) {
    console.error('Fetch trades error:', error);
    res.status(500).json({ 
      message: 'Error fetching trades',
      details: error.message 
    });
  }
};

// Get a specific trade by ID
exports.getTradeById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tradeId = req.params.id;
    
    const trade = await Trade.getTradeById(tradeId, userId);
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    
    res.json(trade);
  } catch (error) {
    console.error('Fetch trade error:', error);
    res.status(500).json({ 
      message: 'Error fetching trade details',
      details: error.message 
    });
  }
};

// Update a trade - can be used for updating pre-entry analysis
exports.updateTrade = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tradeId = req.params.id;
    const updateData = req.body;
    
    // Handle pre-analysis updates
    if (updateData.pre_analysis || 
        updateData.daily_trend !== undefined || 
        updateData.clean_range !== undefined || 
        updateData.volume_time !== undefined ||
        updateData.previous_session_volume !== undefined ||
        updateData.htf_setup !== undefined ||
        updateData.ltf_confirmation !== undefined) {
      
      // Get current trade to merge pre_analysis data
      const currentTrade = await Trade.getTradeById(tradeId, userId);
      if (!currentTrade) {
        return res.status(404).json({ message: 'Trade not found' });
      }
      
      // Extract pre-analysis fields from update
      const preAnalysisUpdates = {};
      
      if (updateData.daily_trend !== undefined) preAnalysisUpdates.daily_trend = updateData.daily_trend;
      if (updateData.clean_range !== undefined) preAnalysisUpdates.clean_range = updateData.clean_range;
      if (updateData.volume_time !== undefined) preAnalysisUpdates.volume_time = updateData.volume_time;
      if (updateData.previous_session_volume !== undefined) preAnalysisUpdates.previous_session_volume = updateData.previous_session_volume;
      if (updateData.htf_setup !== undefined) preAnalysisUpdates.htf_setup = updateData.htf_setup;
      if (updateData.ltf_confirmation !== undefined) preAnalysisUpdates.ltf_confirmation = updateData.ltf_confirmation;
      if (updateData.counter_trend_partials !== undefined) preAnalysisUpdates.counter_trend_partials = updateData.counter_trend_partials;
      if (updateData.consolidation_strategy !== undefined) preAnalysisUpdates.consolidation_strategy = updateData.consolidation_strategy;
      if (updateData.four_hour_breakout !== undefined) preAnalysisUpdates.four_hour_breakout = updateData.four_hour_breakout;
      
      // Merge with existing pre_analysis
      updateData.pre_analysis = {
        ...currentTrade.pre_analysis,
        ...preAnalysisUpdates
      };
      
      // Remove individual fields to avoid duplication
      ['daily_trend', 'clean_range', 'volume_time', 'previous_session_volume', 
       'htf_setup', 'ltf_confirmation', 'counter_trend_partials',
       'consolidation_strategy', 'four_hour_breakout'].forEach(key => {
        delete updateData[key];
      });
    }
    
    // Remove any undefined values from updateData
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const updated = await Trade.updateTrade(tradeId, userId, updateData);
    
    if (!updated) {
      return res.status(404).json({ message: 'Trade not found or unauthorized' });
    }
    
    res.json({ message: 'Trade updated successfully' });
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ 
      message: 'Error updating trade',
      details: error.message 
    });
  }
};

// Close a trade with post-analysis
exports.closeTrade = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tradeId = req.params.id;
    const { exit_price, exit_date, post_analysis } = req.body;
    
    // Validate input
    if (!exit_price) {
      return res.status(400).json({ message: 'Exit price is required' });
    }
    
    // Extract post-analysis fields, avoiding undefined values
    const postAnalysisData = {};
    
    if (post_analysis) {
      if (post_analysis.was_plan_followed !== undefined) postAnalysisData.was_plan_followed = post_analysis.was_plan_followed;
      if (post_analysis.entry_quality !== undefined) postAnalysisData.entry_quality = post_analysis.entry_quality;
      if (post_analysis.exit_quality !== undefined) postAnalysisData.exit_quality = post_analysis.exit_quality;
      if (post_analysis.trade_management !== undefined) postAnalysisData.trade_management = post_analysis.trade_management;
      if (post_analysis.emotional_state !== undefined) postAnalysisData.emotional_state = post_analysis.emotional_state;
      if (post_analysis.lessons_learned !== undefined) postAnalysisData.lessons_learned = post_analysis.lessons_learned;
      if (post_analysis.improvements !== undefined) postAnalysisData.improvements = post_analysis.improvements;
    }
    
    const closed = await Trade.closeTrade(tradeId, userId, {
      exit_price,
      exit_date: exit_date || new Date(),
      post_analysis: Object.keys(postAnalysisData).length > 0 ? postAnalysisData : null
    });
    
    if (!closed) {
      return res.status(404).json({ message: 'Trade not found or unauthorized' });
    }
    
    // Get updated trade data
    const updatedTrade = await Trade.getTradeById(tradeId, userId);
    
    res.json({
      message: 'Trade closed successfully',
      trade: updatedTrade
    });
  } catch (error) {
    console.error('Close trade error:', error);
    res.status(500).json({ 
      message: 'Error closing trade',
      details: error.message 
    });
  }
};

// Delete a trade
exports.deleteTrade = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tradeId = req.params.id;
    
    const deleted = await Trade.deleteTrade(tradeId, userId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Trade not found or unauthorized' });
    }
    
    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ 
      message: 'Error deleting trade',
      details: error.message 
    });
  }
};

// Get trade statistics
exports.getTradeStatistics = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const accountId = req.query.accountId || null;
    
    const statistics = await Trade.getTradeStatistics(userId, accountId);
    
    res.json(statistics);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      message: 'Error fetching trade statistics',
      details: error.message 
    });
  }
};

// Add detailed post-analysis to a trade
exports.addPostAnalysis = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tradeId = req.params.id;
    const postAnalysisData = req.body;
    
    // Get current trade
    const trade = await Trade.getTradeById(tradeId, userId);
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    
    // Check if trade is closed
    if (trade.status !== 'closed') {
      return res.status(400).json({ message: 'Trade must be closed before adding post-analysis' });
    }
    
    // Update the post_analysis field
    const updated = await Trade.updateTrade(tradeId, userId, {
      post_analysis: postAnalysisData
    });
    
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update post-analysis' });
    }
    
    res.json({ 
      message: 'Post-analysis added successfully',
      trade_id: tradeId
    });
  } catch (error) {
    console.error('Post-analysis error:', error);
    res.status(500).json({ 
      message: 'Error adding post-analysis',
      details: error.message 
    });
  }
};

// Compare planned vs actual trade results
exports.comparePlannedVsActual = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tradeId = req.params.id;
    
    const trade = await Trade.getTradeById(tradeId, userId);
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    
    // Check if trade is closed
    if (trade.status !== 'closed') {
      return res.status(400).json({ message: 'Trade must be closed to compare results' });
    }
    
    // Calculate planned risk-reward ratio
    const plannedRR = trade.stop_loss ? 
      Math.abs((trade.take_profit - trade.entry_price) / (trade.entry_price - trade.stop_loss)) : 
      null;
    
    // Calculate actual risk-reward ratio
    const actualRR = trade.stop_loss ?
      Math.abs((trade.exit_price - trade.entry_price) / (trade.entry_price - trade.stop_loss)) :
      null;
    
    // Compare planned vs actual holding time
    const plannedHoldingTime = trade.pre_analysis.planned_holding_time;
    const actualHoldingTime = trade.exit_date && trade.entry_date ? 
      (new Date(trade.exit_date) - new Date(trade.entry_date)) / 3600000 : // in hours
      null;
      
    // Generate comparison report
    const comparison = {
      planned: {
        entry_price: trade.entry_price,
        stop_loss: trade.stop_loss || null,
        take_profit: trade.take_profit || null,
        risk_reward_ratio: plannedRR,
        holding_time: plannedHoldingTime || null,
        expected_outcome: trade.pre_analysis.expected_outcome || null
      },
      actual: {
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        profit_loss: trade.profit_loss,
        risk_reward_ratio: actualRR,
        holding_time: actualHoldingTime,
        outcome: trade.profit_loss > 0 ? 'profit' : 'loss'
      },
      deviation_analysis: {
        exit_price_deviation: trade.take_profit ? 
          ((trade.exit_price - trade.take_profit) / trade.take_profit) * 100 : null,
        holding_time_deviation: plannedHoldingTime && actualHoldingTime ?
          ((actualHoldingTime - plannedHoldingTime) / plannedHoldingTime) * 100 : null,
        plan_followed: trade.post_analysis.was_plan_followed || false
      }
    };
    
    res.json(comparison);
  } catch (error) {
    console.error('Compare analysis error:', error);
    res.status(500).json({ 
      message: 'Error comparing planned vs actual results',
      details: error.message 
    });
  }
};