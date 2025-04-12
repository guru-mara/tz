/**
 * Calculate position size based on risk percentage
 * @param {number} accountBalance - Account balance
 * @param {number} riskPercentage - Risk percentage (1-100)
 * @param {number} entryPrice - Entry price
 * @param {number} stopLossPrice - Stop loss price
 * @returns {number} Position size
 */
exports.calculatePositionSize = (accountBalance, riskPercentage, entryPrice, stopLossPrice) => {
    // Convert percentage to decimal
    const riskRatio = riskPercentage / 100;
    
    // Calculate risk amount in currency
    const riskAmount = accountBalance * riskRatio;
    
    // Calculate price difference (for 1 unit)
    const priceDifference = Math.abs(entryPrice - stopLossPrice);
    
    // Calculate position size (units)
    const positionSize = riskAmount / priceDifference;
    
    return positionSize;
  };
  
  /**
   * Calculate risk to reward ratio
   * @param {number} entryPrice - Entry price
   * @param {number} stopLossPrice - Stop loss price
   * @param {number} takeProfitPrice - Take profit price
   * @returns {number} Risk to reward ratio
   */
  exports.calculateRiskRewardRatio = (entryPrice, stopLossPrice, takeProfitPrice) => {
    const risk = Math.abs(entryPrice - stopLossPrice);
    const reward = Math.abs(entryPrice - takeProfitPrice);
    
    return reward / risk;
  };
  
  /**
   * Calculate expected value of a trade
   * @param {number} winProbability - Probability of winning (0-1)
   * @param {number} potentialProfit - Potential profit amount
   * @param {number} potentialLoss - Potential loss amount
   * @returns {number} Expected value
   */
  exports.calculateExpectedValue = (winProbability, potentialProfit, potentialLoss) => {
    return (winProbability * potentialProfit) - ((1 - winProbability) * potentialLoss);
  };
  
  /**
   * Calculate risk percentage of account
   * @param {number} riskAmount - Risk amount in currency
   * @param {number} accountBalance - Account balance
   * @returns {number} Risk percentage (0-100)
   */
  exports.calculateRiskPercentage = (riskAmount, accountBalance) => {
    return (riskAmount / accountBalance) * 100;
  };
  
  /**
   * Calculate Kelly criterion for optimal position sizing
   * @param {number} winProbability - Probability of winning (0-1)
   * @param {number} riskRewardRatio - Risk to reward ratio
   * @returns {number} Kelly percentage (0-1)
   */
  exports.calculateKellyCriterion = (winProbability, riskRewardRatio) => {
    const winRatio = winProbability;
    const lossRatio = 1 - winProbability;
    
    // Kelly formula: (bp - q) / b
    // where: b = odds received on the wager (profit/loss ratio)
    // p = probability of winning
    // q = probability of losing
    
    const b = riskRewardRatio;
    const p = winRatio;
    const q = lossRatio;
    
    const kelly = (b * p - q) / b;
    
    // Kelly can be negative if odds are unfavorable
    return Math.max(0, kelly);
  };
  
  /**
   * Calculate maximum drawdown from a series of equity points
   * @param {Array<number>} equityPoints - Array of equity points
   * @returns {number} Maximum drawdown percentage (0-100)
   */
  exports.calculateMaxDrawdown = (equityPoints) => {
    if (!equityPoints || equityPoints.length < 2) {
      return 0;
    }
    
    let maxDrawdown = 0;
    let peak = equityPoints[0];
    
    for (let i = 1; i < equityPoints.length; i++) {
      const current = equityPoints[i];
      
      // Update peak if current is higher
      if (current > peak) {
        peak = current;
      } else {
        // Calculate drawdown
        const drawdown = (peak - current) / peak * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    return maxDrawdown;
  };
  
  /**
   * Calculate profit factor from winning and losing trades
   * @param {Array<number>} winningTrades - Array of winning trade amounts
   * @param {Array<number>} losingTrades - Array of losing trade amounts (positive values)
   * @returns {number} Profit factor
   */
  exports.calculateProfitFactor = (winningTrades, losingTrades) => {
    const totalWins = winningTrades.reduce((sum, trade) => sum + trade, 0);
    const totalLosses = losingTrades.reduce((sum, trade) => sum + trade, 0);
    
    if (totalLosses === 0) {
      return totalWins > 0 ? Infinity : 0;
    }
    
    return totalWins / totalLosses;
  };
  
  /**
   * Calculate number of trades needed for statistical significance
   * @param {number} winRate - Win rate (0-1)
   * @param {number} confidenceLevel - Confidence level (0-1)
   * @param {number} marginOfError - Margin of error (0-1)
   * @returns {number} Number of trades needed
   */
  exports.calculateSampleSize = (winRate, confidenceLevel, marginOfError) => {
    // Z-score for confidence level
    let z;
    switch (Math.round(confidenceLevel * 100)) {
      case 90: z = 1.645; break;
      case 95: z = 1.96; break;
      case 99: z = 2.576; break;
      default: z = 1.96; // Default to 95% confidence
    }
    
    // Sample size formula for proportion: (z²pq)/e²
    // where p = win rate, q = 1-p, e = margin of error
    const p = winRate;
    const q = 1 - p;
    const e = marginOfError;
    
    const sampleSize = Math.ceil((z * z * p * q) / (e * e));
    
    return sampleSize;
  };