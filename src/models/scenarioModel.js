const db = require('../config/database');

class TradingScenario {
  // Create a new trading scenario
  static async create(userId, scenarioData) {
    const { 
      scenario_name, 
      account_id = null,
      market_condition = null,
      initial_price = null,
      stop_loss = null,
      take_profit = null,
      position_size = null,
      entry_price = null,
      risk_amount = null,
      potential_profit = null,
      risk_reward_ratio = null,
      win_probability = null,
      expected_value = null,
      notes = null
    } = scenarioData;

    const [result] = await db.execute(
      `INSERT INTO TradingScenarios 
      (user_id, scenario_name, account_id, market_condition, initial_price, 
       stop_loss, take_profit, position_size, entry_price, risk_amount, 
       potential_profit, risk_reward_ratio, win_probability, expected_value, 
       notes, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId, 
        scenario_name, 
        account_id,
        market_condition,
        initial_price,
        stop_loss,
        take_profit,
        position_size,
        entry_price,
        risk_amount,
        potential_profit,
        risk_reward_ratio,
        win_probability,
        expected_value,
        notes
      ]
    );

    return result.insertId;
  }

  // Get all scenarios for a user
  static async getUserScenarios(userId) {
    const [scenarios] = await db.execute(
      `SELECT s.*, a.account_name 
       FROM TradingScenarios s
       LEFT JOIN TradingAccounts a ON s.account_id = a.account_id
       WHERE s.user_id = ? 
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return scenarios;
  }

  // Get a specific scenario by ID and user
  static async getScenarioById(scenarioId, userId) {
    const [scenarios] = await db.execute(
      `SELECT s.*, a.account_name 
       FROM TradingScenarios s
       LEFT JOIN TradingAccounts a ON s.account_id = a.account_id
       WHERE s.scenario_id = ? AND s.user_id = ?`,
      [scenarioId, userId]
    );

    return scenarios[0];
  }

  // Update a scenario
  static async updateScenario(scenarioId, userId, scenarioData) {
    const { 
      scenario_name, 
      account_id = null,
      market_condition = null,
      initial_price = null,
      stop_loss = null,
      take_profit = null,
      position_size = null,
      entry_price = null,
      risk_amount = null,
      potential_profit = null,
      risk_reward_ratio = null,
      win_probability = null,
      expected_value = null,
      notes = null
    } = scenarioData;

    const [result] = await db.execute(
      `UPDATE TradingScenarios 
       SET scenario_name = ?, 
           account_id = ?,
           market_condition = ?,
           initial_price = ?,
           stop_loss = ?,
           take_profit = ?,
           position_size = ?,
           entry_price = ?,
           risk_amount = ?,
           potential_profit = ?,
           risk_reward_ratio = ?,
           win_probability = ?,
           expected_value = ?,
           notes = ?,
           updated_at = NOW()
       WHERE scenario_id = ? AND user_id = ?`,
      [
        scenario_name, 
        account_id,
        market_condition,
        initial_price,
        stop_loss,
        take_profit,
        position_size,
        entry_price,
        risk_amount,
        potential_profit,
        risk_reward_ratio,
        win_probability,
        expected_value,
        notes,
        scenarioId,
        userId
      ]
    );

    return result.affectedRows > 0;
  }

  // Delete a scenario
  static async deleteScenario(scenarioId, userId) {
    const [result] = await db.execute(
      `DELETE FROM TradingScenarios WHERE scenario_id = ? AND user_id = ?`,
      [scenarioId, userId]
    );

    return result.affectedRows > 0;
  }

  // Convert template to scenario
  static async createFromTemplate(userId, templateId, accountId, marketData) {
    // First get the template
    const [templates] = await db.execute(
      `SELECT * FROM TradeTemplates WHERE template_id = ? AND user_id = ?`,
      [templateId, userId]
    );
    
    if (templates.length === 0) {
      throw new Error('Template not found');
    }
    
    const template = templates[0];
    
    // Create scenario using template data and market data
    const scenarioData = {
      scenario_name: `${template.template_name} - Scenario`,
      account_id: accountId,
      market_condition: marketData.market_condition || template.market,
      initial_price: marketData.initial_price || null,
      stop_loss: marketData.stop_loss || null,
      take_profit: marketData.take_profit || null,
      position_size: marketData.position_size || null,
      entry_price: marketData.entry_price || null,
      risk_amount: marketData.risk_amount || null,
      potential_profit: marketData.potential_profit || null,
      risk_reward_ratio: template.risk_reward_ratio || null,
      win_probability: marketData.win_probability || 0.5,
      expected_value: marketData.expected_value || null,
      notes: `Created from template: ${template.template_name}\n\n${template.notes || ''}`
    };
    
    return this.create(userId, scenarioData);
  }
}

module.exports = TradingScenario;