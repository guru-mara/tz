const db = require('../config/database');

class TradeSimulation {
  // Create a new trade simulation
  static async create(userId, simulationData) {
    const { 
      simulation_name, 
      account_id,
      template_id,
      scenario_id,
      market,
      entry_price,
      position_size,
      stop_loss,
      take_profit,
      risk_amount,
      potential_profit,
      risk_reward_ratio,
      simulation_result,
      exit_price,
      profit_loss,
      notes
    } = simulationData;

    const [result] = await db.execute(
      `INSERT INTO TradeSimulations 
      (user_id, simulation_name, account_id, template_id, scenario_id, market, 
       entry_price, position_size, stop_loss, take_profit, risk_amount, 
       potential_profit, risk_reward_ratio, simulation_result, exit_price, 
       profit_loss, notes, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId, 
        simulation_name, 
        account_id,
        template_id,
        scenario_id,
        market,
        entry_price,
        position_size,
        stop_loss,
        take_profit,
        risk_amount,
        potential_profit,
        risk_reward_ratio,
        simulation_result,
        exit_price,
        profit_loss,
        notes
      ]
    );

    return result.insertId;
  }

  // Get all simulations for a user
  static async getUserSimulations(userId) {
    const [simulations] = await db.execute(
      `SELECT s.*, a.account_name, 
              t.template_name, sc.scenario_name
       FROM TradeSimulations s
       LEFT JOIN TradingAccounts a ON s.account_id = a.account_id
       LEFT JOIN TradeTemplates t ON s.template_id = t.template_id
       LEFT JOIN TradingScenarios sc ON s.scenario_id = sc.scenario_id
       WHERE s.user_id = ? 
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return simulations;
  }

  // Get a specific simulation by ID and user
  static async getSimulationById(simulationId, userId) {
    const [simulations] = await db.execute(
      `SELECT s.*, a.account_name, 
              t.template_name, sc.scenario_name
       FROM TradeSimulations s
       LEFT JOIN TradingAccounts a ON s.account_id = a.account_id
       LEFT JOIN TradeTemplates t ON s.template_id = t.template_id
       LEFT JOIN TradingScenarios sc ON s.scenario_id = sc.scenario_id
       WHERE s.simulation_id = ? AND s.user_id = ?`,
      [simulationId, userId]
    );

    return simulations[0];
  }

  // Update a simulation
  static async updateSimulation(simulationId, userId, simulationData) {
    const { 
      simulation_name, 
      account_id,
      template_id,
      scenario_id,
      market,
      entry_price,
      position_size,
      stop_loss,
      take_profit,
      risk_amount,
      potential_profit,
      risk_reward_ratio,
      simulation_result,
      exit_price,
      profit_loss,
      notes
    } = simulationData;

    const [result] = await db.execute(
      `UPDATE TradeSimulations 
       SET simulation_name = ?, 
           account_id = ?,
           template_id = ?,
           scenario_id = ?,
           market = ?,
           entry_price = ?,
           position_size = ?,
           stop_loss = ?,
           take_profit = ?,
           risk_amount = ?,
           potential_profit = ?,
           risk_reward_ratio = ?,
           simulation_result = ?,
           exit_price = ?,
           profit_loss = ?,
           notes = ?,
           updated_at = NOW()
       WHERE simulation_id = ? AND user_id = ?`,
      [
        simulation_name, 
        account_id,
        template_id,
        scenario_id,
        market,
        entry_price,
        position_size,
        stop_loss,
        take_profit,
        risk_amount,
        potential_profit,
        risk_reward_ratio,
        simulation_result,
        exit_price,
        profit_loss,
        notes,
        simulationId,
        userId
      ]
    );

    return result.affectedRows > 0;
  }

  // Delete a simulation
  static async deleteSimulation(simulationId, userId) {
    const [result] = await db.execute(
      `DELETE FROM TradeSimulations WHERE simulation_id = ? AND user_id = ?`,
      [simulationId, userId]
    );

    return result.affectedRows > 0;
  }

  // Create simulation from scenario
  static async createFromScenario(userId, scenarioId) {
    // First get the scenario
    const [scenarios] = await db.execute(
      `SELECT * FROM TradingScenarios WHERE scenario_id = ? AND user_id = ?`,
      [scenarioId, userId]
    );
    
    if (scenarios.length === 0) {
      throw new Error('Scenario not found');
    }
    
    const scenario = scenarios[0];
    
    // Create simulation using scenario data
    const simulationData = {
      simulation_name: `${scenario.scenario_name} - Simulation`,
      account_id: scenario.account_id,
      template_id: null,
      scenario_id: scenarioId,
      market: scenario.market_condition,
      entry_price: scenario.entry_price,
      position_size: scenario.position_size,
      stop_loss: scenario.stop_loss,
      take_profit: scenario.take_profit,
      risk_amount: scenario.risk_amount,
      potential_profit: scenario.potential_profit,
      risk_reward_ratio: scenario.risk_reward_ratio,
      simulation_result: 'pending',
      exit_price: null,
      profit_loss: null,
      notes: `Created from scenario: ${scenario.scenario_name}\n\n${scenario.notes}`
    };
    
    return this.create(userId, simulationData);
  }

  // Execute simulation (simulate trade outcome)
  static async executeSimulation(simulationId, userId, executionData) {
    const { 
      exit_price, 
      simulation_result, 
      notes
    } = executionData;

    // Get the simulation
    const simulation = await this.getSimulationById(simulationId, userId);
    if (!simulation) {
      throw new Error('Simulation not found');
    }

    // Calculate profit/loss
    let profit_loss = 0;
    if (exit_price && simulation.entry_price) {
      const priceDiff = exit_price - simulation.entry_price;
      profit_loss = priceDiff * simulation.position_size;
    }

    // Update the simulation with results
    const [result] = await db.execute(
      `UPDATE TradeSimulations 
       SET simulation_result = ?,
           exit_price = ?,
           profit_loss = ?,
           notes = CONCAT(notes, '\n\nExecution Notes: ', ?),
           executed_at = NOW()
       WHERE simulation_id = ? AND user_id = ?`,
      [
        simulation_result,
        exit_price,
        profit_loss,
        notes || '',
        simulationId,
        userId
      ]
    );

    return {
      updated: result.affectedRows > 0,
      profit_loss
    };
  }

  // Get simulation statistics for a user
  static async getSimulationStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
         COUNT(*) as total_simulations,
         SUM(CASE WHEN simulation_result = 'win' THEN 1 ELSE 0 END) as wins,
         SUM(CASE WHEN simulation_result = 'loss' THEN 1 ELSE 0 END) as losses,
         SUM(CASE WHEN simulation_result = 'breakeven' THEN 1 ELSE 0 END) as breakevens,
         SUM(profit_loss) as total_profit_loss,
         AVG(CASE WHEN simulation_result = 'win' THEN profit_loss ELSE NULL END) as avg_win,
         AVG(CASE WHEN simulation_result = 'loss' THEN profit_loss ELSE NULL END) as avg_loss,
         AVG(risk_reward_ratio) as avg_risk_reward
       FROM TradeSimulations 
       WHERE user_id = ? AND simulation_result IS NOT NULL`,
      [userId]
    );

    return stats[0];
  }
}

module.exports = TradeSimulation;