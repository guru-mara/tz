const db = require('../config/database');
const tradingUtils = require('./tradingUtils');

/**
 * Calculate optimal position size for a trading account
 * @param {number} accountId - Account ID
 * @param {number} riskPercentage - Risk percentage of account
 * @param {number} entryPrice - Entry price
 * @param {number} stopLossPrice - Stop loss price
 * @returns {Object} Position size calculation result
 */
exports.calculatePositionSize = async (accountId, riskPercentage, entryPrice, stopLossPrice) => {
  // Get account balance
  const [accounts] = await db.execute(
    'SELECT current_balance FROM TradingAccounts WHERE account_id = ?',
    [accountId]
  );
  
  if (accounts.length === 0) {
    throw new Error('Account not found');
  }
  
  const accountBalance = accounts[0].current_balance;
  
  // Calculate position size
  const positionSize = tradingUtils.calculatePositionSize(
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLossPrice
  );
  
  // Calculate risk amount
  const riskAmount = accountBalance * (riskPercentage / 100);
  
  return {
    accountBalance,
    riskPercentage,
    riskAmount,
    entryPrice,
    stopLossPrice,
    priceDifference: Math.abs(entryPrice - stopLossPrice),
    positionSize,
    maxLoss: riskAmount
  };
};

/**
 * Calculate potential profit, risk, and analytics for a trade scenario
 * @param {Object} scenarioData - Trade scenario data
 * @returns {Object} Trade analytics
 */
exports.calculateTradeAnalytics = async (scenarioData) => {
  const {
    account_id,
    entry_price,
    stop_loss,
    take_profit,
    position_size,
    win_probability = 0.5
  } = scenarioData;
  
  // Get account balance if account_id is provided
  let accountBalance = null;
  if (account_id) {
    const [accounts] = await db.execute(
      'SELECT current_balance FROM TradingAccounts WHERE account_id = ?',
      [account_id]
    );
    
    if (accounts.length > 0) {
      accountBalance = accounts[0].current_balance;
    }
  }
  
  // Calculate risk amount
  const riskAmount = Math.abs(entry_price - stop_loss) * position_size;
  
  // Calculate potential profit
  const potentialProfit = Math.abs(entry_price - take_profit) * position_size;
  
  // Calculate risk-reward ratio
  const riskRewardRatio = tradingUtils.calculateRiskRewardRatio(
    entry_price,
    stop_loss,
    take_profit
  );
  
  // Calculate expected value
  const expectedValue = tradingUtils.calculateExpectedValue(
    win_probability,
    potentialProfit,
    riskAmount
  );
  
  // Calculate risk percentage if account balance is available
  let riskPercentage = null;
  if (accountBalance) {
    riskPercentage = tradingUtils.calculateRiskPercentage(riskAmount, accountBalance);
  }
  
  // Calculate Kelly criterion
  const kellyCriterion = tradingUtils.calculateKellyCriterion(win_probability, riskRewardRatio);
  
  // Calculate Kelly position size
  let kellyPositionSize = null;
  if (accountBalance) {
    kellyPositionSize = (kellyCriterion * accountBalance) / Math.abs(entry_price - stop_loss);
  }
  
  // Recommended position sizing (half-Kelly is often more conservative)
  let recommendedPositionSize = null;
  if (kellyPositionSize !== null) {
    recommendedPositionSize = kellyPositionSize * 0.5; // Half-Kelly
  }
  
  return {
    entry_price,
    stop_loss,
    take_profit,
    position_size,
    accountBalance,
    riskAmount,
    potentialProfit,
    riskRewardRatio,
    win_probability,
    expectedValue,
    riskPercentage,
    kellyCriterion,
    kellyPositionSize,
    recommendedPositionSize,
    conservativePositionSize: kellyPositionSize ? kellyPositionSize * 0.25 : null, // Quarter-Kelly
    aggressivePositionSize: kellyPositionSize ? kellyPositionSize * 0.75 : null, // Three-Quarter-Kelly
  };
};

/**
 * Run Monte Carlo simulation for a trading strategy
 * @param {Object} strategyParams - Strategy parameters
 * @returns {Object} Simulation results
 */
exports.runMonteCarloSimulation = (strategyParams) => {
  const {
    initialBalance = 10000,
    winRate = 0.5,
    averageWin = 200,
    averageLoss = 100,
    numberOfTrades = 100,
    numberOfSimulations = 1000
  } = strategyParams;
  
  const results = {
    simulations: [],
    finalBalances: [],
    maxDrawdowns: [],
    failureRate: 0,
    averageReturn: 0,
    medianReturn: 0,
    maxReturn: 0,
    minReturn: 0,
    averageMaxDrawdown: 0
  };
  
  // Run simulations
  for (let sim = 0; sim < numberOfSimulations; sim++) {
    const equityCurve = [initialBalance];
    let balance = initialBalance;
    let maxBalance = initialBalance;
    
    // Run trades
    for (let trade = 0; trade < numberOfTrades; trade++) {
      const isWin = Math.random() < winRate;
      
      if (isWin) {
        balance += averageWin;
      } else {
        balance -= averageLoss;
      }
      
      // Track equity curve
      equityCurve.push(balance);
      
      // Update max balance
      if (balance > maxBalance) {
        maxBalance = balance;
      }
    }
    
    // Calculate drawdown for this simulation
    const maxDrawdown = tradingUtils.calculateMaxDrawdown(equityCurve);
    
    // Calculate return
    const returnPct = ((balance - initialBalance) / initialBalance) * 100;
    
    // Store simulation results
    results.simulations.push({
      equityCurve,
      finalBalance: balance,
      maxDrawdown,
      returnPct
    });
    
    results.finalBalances.push(balance);
    results.maxDrawdowns.push(maxDrawdown);
  }
  
  // Sort final balances for percentile calculations
  results.finalBalances.sort((a, b) => a - b);
  
  // Calculate statistics
  results.failureRate = results.finalBalances.filter(bal => bal < initialBalance).length / numberOfSimulations;
  results.averageReturn = (results.finalBalances.reduce((sum, bal) => sum + bal, 0) / numberOfSimulations - initialBalance) / initialBalance * 100;
  results.medianReturn = (results.finalBalances[Math.floor(numberOfSimulations / 2)] - initialBalance) / initialBalance * 100;
  results.maxReturn = (results.finalBalances[numberOfSimulations - 1] - initialBalance) / initialBalance * 100;
  results.minReturn = (results.finalBalances[0] - initialBalance) / initialBalance * 100;
  results.averageMaxDrawdown = results.maxDrawdowns.reduce((sum, dd) => sum + dd, 0) / numberOfSimulations;
  
  // Calculate percentiles
  results.percentile5 = results.finalBalances[Math.floor(numberOfSimulations * 0.05)];
  results.percentile25 = results.finalBalances[Math.floor(numberOfSimulations * 0.25)];
  results.percentile50 = results.finalBalances[Math.floor(numberOfSimulations * 0.5)];
  results.percentile75 = results.finalBalances[Math.floor(numberOfSimulations * 0.75)];
  results.percentile95 = results.finalBalances[Math.floor(numberOfSimulations * 0.95)];
  
  return results;
};

/**
 * Calculate metrics for a trading strategy based on historical trades
 * @param {Array} trades - Array of historical trades
 * @returns {Object} Strategy metrics
 */
exports.calculateStrategyMetrics = (trades) => {
  if (!trades || trades.length === 0) {
    return {
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      netProfit: 0
    };
  }
  
  const winningTrades = trades.filter(trade => trade.profit_loss > 0);
  const losingTrades = trades.filter(trade => trade.profit_loss < 0);
  const breakEvenTrades = trades.filter(trade => trade.profit_loss === 0);
  
  const totalWins = winningTrades.length;
  const totalLosses = losingTrades.length;
  const totalTrades = trades.length;
  
  const winRate = totalWins / totalTrades;
  
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profit_loss, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit_loss, 0));
  
  const averageWin = totalWins > 0 ? totalProfit / totalWins : 0;
  const averageLoss = totalLosses > 0 ? totalLoss / totalLosses : 0;
  
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  
  const netProfit = totalProfit - totalLoss;
  
  // Expectancy = (Win% * Average Win) - (Loss% * Average Loss)
  const expectancy = (winRate * averageWin) - ((1 - winRate) * averageLoss);
  
  return {
    winRate,
    averageWin,
    averageLoss,
    profitFactor,
    expectancy,
    totalTrades,
    winningTrades: totalWins,
    losingTrades: totalLosses,
    breakEvenTrades: breakEvenTrades.length,
    netProfit,
    totalProfit,
    totalLoss,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit_loss)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit_loss)) : 0
  };
};