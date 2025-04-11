const db = require('../config/database');
const https = require('https');

class Market {
  // Save market data from external API
  static async saveMarketData(data) {
    try {
      // Check if data already exists for this timestamp
      const [existing] = await db.execute(
        'SELECT * FROM GoldMarketData WHERE timestamp = ?',
        [data.timestamp]
      );
      
      if (existing.length > 0) {
        // Update existing data
        await db.execute(
          `UPDATE GoldMarketData SET 
            spot_price = ?,
            futures_price = ?,
            usd_index = ?,
            global_market_volatility = ?
          WHERE timestamp = ?`,
          [
            data.close, // Use close price as spot price
            data.close, // Can also use close as futures price
            null,       // No USD index in our data
            data.volume ? data.volume / 10000 : null, // Convert volume to volatility scale
            data.timestamp
          ]
        );
        
        return { message: 'Market data updated', timestamp: data.timestamp };
      } else {
        // Insert new data
        await db.execute(
          `INSERT INTO GoldMarketData (
            timestamp,
            spot_price,
            futures_price,
            usd_index,
            global_market_volatility
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            data.timestamp,
            data.close, // Use close price as spot price
            data.close, // Can also use close as futures price
            null,       // No USD index in our data
            data.volume ? data.volume / 10000 : null // Convert volume to volatility scale
          ]
        );
        
        return { message: 'Market data saved', timestamp: data.timestamp };
      }
    } catch (error) {
      console.error('Error saving market data:', error);
      throw error;
    }
  }
  
  // Get market data for a specific date range
  static async getMarketData(startDate, endDate, timeframe = 'daily') {
    try {
      // Build query based on timeframe
      let groupBy = '';
      let selectCols = '';
      
      switch(timeframe) {
        case 'hourly':
          groupBy = 'DATE_FORMAT(timestamp, "%Y-%m-%d %H:00:00")';
          selectCols = 'DATE_FORMAT(timestamp, "%Y-%m-%d %H:00:00") as period';
          break;
        case 'daily':
          groupBy = 'DATE(timestamp)';
          selectCols = 'DATE(timestamp) as period';
          break;
        case 'weekly':
          groupBy = 'YEARWEEK(timestamp)';
          selectCols = 'DATE(timestamp - INTERVAL WEEKDAY(timestamp) DAY) as period';
          break;
        case 'monthly':
          groupBy = 'YEAR(timestamp), MONTH(timestamp)';
          selectCols = 'DATE_FORMAT(timestamp, "%Y-%m-01") as period';
          break;
        default:
          groupBy = 'DATE(timestamp)';
          selectCols = 'DATE(timestamp) as period';
      }
      
      const query = `
        SELECT 
          ${selectCols},
          MIN(timestamp) as timestamp,
          MIN(spot_price) as low_price,
          MAX(spot_price) as high_price,
          SUBSTRING_INDEX(GROUP_CONCAT(spot_price ORDER BY timestamp ASC), ',', 1) as open_price,
          SUBSTRING_INDEX(GROUP_CONCAT(spot_price ORDER BY timestamp DESC), ',', 1) as close_price,
          AVG(global_market_volatility) as volume,
          AVG(usd_index) as usd_index
        FROM GoldMarketData
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY ${groupBy}
        ORDER BY timestamp ASC
      `;
      
      const [data] = await db.execute(query, [startDate, endDate]);
      
      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }
  
  // Get latest price
  static async getLatestPrice() {
    try {
      const [data] = await db.execute(
        `SELECT * FROM GoldMarketData 
         ORDER BY timestamp DESC 
         LIMIT 1`
      );
      
      if (data.length === 0) {
        return null;
      }
      
      // Get the previous day's price for change calculation
      const prevDate = new Date(data[0].timestamp);
      prevDate.setDate(prevDate.getDate() - 1);
      
      const [prevData] = await db.execute(
        `SELECT * FROM GoldMarketData 
         WHERE timestamp < ? 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [data[0].timestamp]
      );
      
      const prevPrice = prevData.length > 0 ? prevData[0].spot_price : data[0].spot_price;
      
      return {
        timestamp: data[0].timestamp,
        price: data[0].spot_price,
        change: data[0].spot_price - prevPrice,
        percent_change: ((data[0].spot_price - prevPrice) / prevPrice) * 100,
        usd_index: data[0].usd_index,
        volatility: data[0].global_market_volatility
      };
    } catch (error) {
      console.error('Error fetching latest price:', error);
      throw error;
    }
  }
  
  // Fetch external market data (this would normally use a paid API)
  static async fetchExternalData(startDate, endDate, apiKey = null) {
    return new Promise((resolve, reject) => {
      // This is a placeholder for a real API call
      // In a production environment, you would use a paid service
      // like Alpha Vantage, FXCM, or OANDA
      
      // For demonstration, we'll simulate data
      const simulatedData = [];
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      // Generate daily data
      let basePrice = 1900; // Starting gold price
      let currentTime = startTime;
      
      while (currentTime <= endTime) {
        const date = new Date(currentTime);
        
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          // Random price fluctuation (±20)
          const change = (Math.random() * 40) - 20;
          
          // Calculate OHLC
          const open = basePrice;
          const close = basePrice + change;
          const high = Math.max(open, close) + (Math.random() * 10);
          const low = Math.min(open, close) - (Math.random() * 10);
          const volume = Math.floor(Math.random() * 10000) + 5000;
          
          simulatedData.push({
            timestamp: date.toISOString().split('T')[0] + ' 00:00:00',
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: volume,
            source: 'simulation'
          });
          
          // Update base price for next day
          basePrice = close;
        }
        
        // Move to next day
        currentTime += dayInMs;
      }
      
      resolve(simulatedData);
    });
  }
  
  // Sync market data from external source
  static async syncMarketData(startDate, endDate, apiKey = null) {
    try {
      // Fetch external data
      const externalData = await this.fetchExternalData(startDate, endDate, apiKey);
      
      // Save each data point
      const results = [];
      
      for (const dataPoint of externalData) {
        const result = await this.saveMarketData(dataPoint);
        results.push(result);
      }
      
      return {
        message: `Synced ${results.length} data points`,
        details: results
      };
    } catch (error) {
      console.error('Error syncing market data:', error);
      throw error;
    }
  }
  
  // Get support and resistance levels
  static async getSupportResistanceLevels(days = 30) {
    try {
      // Get recent market data
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const [data] = await db.execute(
        `SELECT 
          spot_price
         FROM GoldMarketData 
         WHERE timestamp BETWEEN ? AND ?
         ORDER BY timestamp ASC`,
        [startDate.toISOString().split('T')[0], endDate]
      );
      
      if (data.length === 0) {
        return {
          support_levels: [],
          resistance_levels: []
        };
      }
      
      // Extract price points
      const prices = data.map(point => point.spot_price);
      
      // Find clusters/levels
      const levels = this.findPriceLevels(prices);
      
      // Get current price to determine support vs resistance
      const currentPrice = await this.getLatestPrice();
      
      // Split into support and resistance
      const supportLevels = [];
      const resistanceLevels = [];
      
      levels.forEach(level => {
        if (level.price < currentPrice.price) {
          supportLevels.push(level);
        } else {
          resistanceLevels.push(level);
        }
      });
      
      // Sort by strength (descending)
      supportLevels.sort((a, b) => b.strength - a.strength);
      resistanceLevels.sort((a, b) => b.strength - a.strength);
      
      return {
        support_levels: supportLevels.slice(0, 5), // Top 5 support levels
        resistance_levels: resistanceLevels.slice(0, 5) // Top 5 resistance levels
      };
    } catch (error) {
      console.error('Error calculating support/resistance levels:', error);
      throw error;
    }
  }
  
  // Helper method to find price levels from array of prices
  static findPriceLevels(prices, tolerance = 5) {
    // Round prices to nearest tolerance value
    const roundedPrices = prices.map(price => Math.round(price / tolerance) * tolerance);
    
    // Count occurrences of each price level
    const counts = {};
    roundedPrices.forEach(price => {
      counts[price] = (counts[price] || 0) + 1;
    });
    
    // Convert to array of level objects
    const levels = Object.keys(counts).map(price => ({
      price: parseFloat(price),
      touches: counts[price],
      strength: counts[price] / prices.length * 100
    }));
    
    // Filter to only include significant levels (more than 1 touch)
    return levels.filter(level => level.touches > 1);
  }
  
  // Get market correlation data
  static async getCorrelationData(targetSymbol = 'XAUUSD', compareSymbols = ['XAGUSD', 'USDX', 'SPX']) {
    // In a real implementation, this would fetch correlation data from external sources
    // For demonstration, we'll return simulated correlation data
    
    return {
      base_symbol: targetSymbol,
      correlations: [
        {
          symbol: 'XAGUSD',
          name: 'Silver',
          correlation_30d: 0.85,
          correlation_90d: 0.82,
          relationship: 'positive'
        },
        {
          symbol: 'USDX',
          name: 'US Dollar Index',
          correlation_30d: -0.72,
          correlation_90d: -0.68,
          relationship: 'negative'
        },
        {
          symbol: 'SPX',
          name: 'S&P 500',
          correlation_30d: 0.23,
          correlation_90d: 0.18,
          relationship: 'weak positive'
        }
      ]
    };
  }
  
  // Get market data for specific dates of existing trades
  static async getTradeMarketData(tradeId, userId) {
    try {
      // Import Trade model here to avoid circular dependencies
      const Trade = require('./tradeModel');
      
      // Get trade details
      const trade = await Trade.getTradeById(tradeId, userId);
      
      if (!trade) {
        throw new Error('Trade not found');
      }
      
      // Get market data surrounding the trade dates
      const entryDate = new Date(trade.entry_date);
      const exitDate = trade.exit_date ? new Date(trade.exit_date) : new Date();
      
      // Get data for 3 days before entry and 3 days after exit
      const startDate = new Date(entryDate);
      startDate.setDate(startDate.getDate() - 3);
      
      const endDate = new Date(exitDate);
      endDate.setDate(endDate.getDate() + 3);
      
      const marketData = await this.getMarketData(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        'daily'
      );
      
      return {
        trade_id: trade.trade_id,
        entry_date: trade.entry_date,
        entry_price: trade.entry_price,
        exit_date: trade.exit_date,
        exit_price: trade.exit_price,
        market_data: marketData
      };
    } catch (error) {
      console.error('Error fetching trade market data:', error);
      throw error;
    }
  }
}

module.exports = Market;