const Market = require('../models/marketModel');

// Get market data for a date range
exports.getMarketData = async (req, res) => {
  try {
    const { startDate, endDate, timeframe } = req.query;
    
    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Start date and end date are required'
      });
    }
    
    const data = await Market.getMarketData(
      startDate,
      endDate,
      timeframe || 'daily'
    );
    
    res.json(data);
  } catch (error) {
    console.error('Fetch market data error:', error);
    res.status(500).json({
      message: 'Error fetching market data',
      details: error.message
    });
  }
};

// Get latest price
exports.getLatestPrice = async (req, res) => {
  try {
    const priceData = await Market.getLatestPrice();
    
    if (!priceData) {
      return res.status(404).json({
        message: 'No market data available'
      });
    }
    
    res.json(priceData);
  } catch (error) {
    console.error('Fetch latest price error:', error);
    res.status(500).json({
      message: 'Error fetching latest price',
      details: error.message
    });
  }
};

// Sync market data from external source
exports.syncMarketData = async (req, res) => {
  try {
    const { startDate, endDate, apiKey } = req.body;
    
    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Start date and end date are required'
      });
    }
    
    const result = await Market.syncMarketData(
      startDate,
      endDate,
      apiKey
    );
    
    res.json(result);
  } catch (error) {
    console.error('Sync market data error:', error);
    res.status(500).json({
      message: 'Error syncing market data',
      details: error.message
    });
  }
};

// Get support and resistance levels
exports.getSupportResistanceLevels = async (req, res) => {
  try {
    const { days } = req.query;
    
    const levels = await Market.getSupportResistanceLevels(
      parseInt(days) || 30
    );
    
    res.json(levels);
  } catch (error) {
    console.error('Support/resistance error:', error);
    res.status(500).json({
      message: 'Error calculating support and resistance levels',
      details: error.message
    });
  }
};

// Get market correlation data
exports.getCorrelationData = async (req, res) => {
  try {
    const correlationData = await Market.getCorrelationData();
    
    res.json(correlationData);
  } catch (error) {
    console.error('Correlation data error:', error);
    res.status(500).json({
      message: 'Error fetching correlation data',
      details: error.message
    });
  }
};

// Get market data for specific dates of existing trades
exports.getTradeMarketData = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.user_id;
    
    // Import Trade model here to avoid circular dependencies
    const Trade = require('../models/tradeModel');
    
    // Get trade details
    const trade = await Trade.getTradeById(tradeId, userId);
    
    if (!trade) {
      return res.status(404).json({
        message: 'Trade not found'
      });
    }
    
    // Get market data surrounding the trade dates
    const entryDate = new Date(trade.entry_date);
    const exitDate = trade.exit_date ? new Date(trade.exit_date) : new Date();
    
    // Get data for 3 days before entry and 3 days after exit
    const startDate = new Date(entryDate);
    startDate.setDate(startDate.getDate() - 3);
    
    const endDate = new Date(exitDate);
    endDate.setDate(endDate.getDate() + 3);
    
    const marketData = await Market.getMarketData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      'daily'
    );
    
    res.json({
      trade_id: trade.trade_id,
      entry_date: trade.entry_date,
      entry_price: trade.entry_price,
      exit_date: trade.exit_date,
      exit_price: trade.exit_price,
      market_data: marketData
    });
  } catch (error) {
    console.error('Trade market data error:', error);
    res.status(500).json({
      message: 'Error fetching market data for trade',
      details: error.message
    });
  }
};