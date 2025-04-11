const Analytics = require('../models/analyticsModel');

// Get performance metrics over time (daily, weekly, monthly, yearly)
exports.getPerformanceOverTime = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { accountId, interval } = req.query;
    
    const performanceData = await Analytics.getPerformanceOverTime(
      userId, 
      accountId || null, 
      interval || 'monthly'
    );
    
    res.json(performanceData);
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ 
      message: 'Error fetching performance analytics',
      details: error.message 
    });
  }
};

// Get equity curve data
exports.getEquityCurve = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { accountId } = req.query;
    
    const equityCurveData = await Analytics.getEquityCurve(
      userId, 
      accountId || null
    );
    
    res.json(equityCurveData);
  } catch (error) {
    console.error('Equity curve error:', error);
    res.status(500).json({ 
      message: 'Error fetching equity curve data',
      details: error.message 
    });
  }
};

// Get win/loss ratio by factor (direction, day of week, time of day, etc.)
exports.getWinLossByFactor = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { factor, accountId } = req.query;
    
    if (!factor) {
      return res.status(400).json({ 
        message: 'Factor parameter is required' 
      });
    }
    
    const factorData = await Analytics.getWinLossByFactor(
      userId, 
      factor,
      accountId || null
    );
    
    res.json(factorData);
  } catch (error) {
    console.error('Factor analysis error:', error);
    res.status(500).json({ 
      message: 'Error fetching factor analysis',
      details: error.message 
    });
  }
};

// Get risk metrics
exports.getRiskMetrics = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { accountId } = req.query;
    
    const riskMetrics = await Analytics.getRiskMetrics(
      userId, 
      accountId || null
    );
    
    res.json(riskMetrics);
  } catch (error) {
    console.error('Risk metrics error:', error);
    res.status(500).json({ 
      message: 'Error fetching risk metrics',
      details: error.message 
    });
  }
};

// Get consecutive win/loss stats
exports.getConsecutiveStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { accountId } = req.query;
    
    const consecutiveStats = await Analytics.getConsecutiveStats(
      userId, 
      accountId || null
    );
    
    res.json(consecutiveStats);
  } catch (error) {
    console.error('Consecutive stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching consecutive win/loss stats',
      details: error.message 
    });
  }
};

// Get dashboard summary (combines multiple analytics)
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { accountId } = req.query;
    
    // Get various analytics in parallel
    const [
      riskMetrics,
      consecutiveStats,
      recentPerformance,
      factorsByDirection,
      factorsByTrend
    ] = await Promise.all([
      Analytics.getRiskMetrics(userId, accountId || null),
      Analytics.getConsecutiveStats(userId, accountId || null),
      Analytics.getPerformanceOverTime(userId, accountId || null, 'monthly'),
      Analytics.getWinLossByFactor(userId, 'direction', accountId || null),
      Analytics.getWinLossByFactor(userId, 'daily_trend', accountId || null)
    ]);
    
    // Combine into one dashboard response
    res.json({
      risk_metrics: riskMetrics,
      consecutive_stats: consecutiveStats,
      recent_performance: recentPerformance.slice(-3), // Last 3 periods
      factors_by_direction: factorsByDirection,
      factors_by_trend: factorsByTrend
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard summary',
      details: error.message 
    });
  }
};