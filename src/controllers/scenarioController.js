const TradingScenario = require('../models/scenarioModel');
const Account = require('../models/accountModel');

// Create a new trading scenario
exports.createScenario = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const scenarioData = req.body;

    // Validate input
    if (!scenarioData.scenario_name) {
      return res.status(400).json({ 
        message: 'Scenario name is required' 
      });
    }

    // Sanitize data: convert undefined values to null
    Object.keys(scenarioData).forEach(key => {
      if (scenarioData[key] === undefined) {
        scenarioData[key] = null;
      }
    });

    // Verify account belongs to user if account_id is provided
    if (scenarioData.account_id) {
      const account = await Account.getAccountById(scenarioData.account_id, userId);
      if (!account) {
        return res.status(400).json({ message: 'Invalid account selected' });
      }
    }

    // Calculate expected value if not provided
    if (!scenarioData.expected_value && scenarioData.win_probability && scenarioData.potential_profit && scenarioData.risk_amount) {
      const winSide = scenarioData.potential_profit * scenarioData.win_probability;
      const lossSide = scenarioData.risk_amount * (1 - scenarioData.win_probability);
      scenarioData.expected_value = winSide - lossSide;
    }

    // Create scenario
    const scenarioId = await TradingScenario.create(userId, scenarioData);

    res.status(201).json({
      message: 'Trading scenario created successfully',
      scenario_id: scenarioId,
      ...scenarioData
    });
  } catch (error) {
    console.error('Scenario creation error:', error);
    res.status(500).json({ message: 'Error creating trading scenario' });
  }
};

// Get user's trading scenarios
exports.getUserScenarios = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const scenarios = await TradingScenario.getUserScenarios(userId);

    res.json(scenarios);
  } catch (error) {
    console.error('Fetch scenarios error:', error);
    res.status(500).json({ message: 'Error fetching trading scenarios' });
  }
};

// Get a specific scenario
exports.getScenarioById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const scenarioId = req.params.id;

    const scenario = await TradingScenario.getScenarioById(scenarioId, userId);

    if (!scenario) {
      return res.status(404).json({ message: 'Scenario not found' });
    }

    res.json(scenario);
  } catch (error) {
    console.error('Fetch scenario error:', error);
    res.status(500).json({ message: 'Error fetching scenario details' });
  }
};

// Update a scenario
exports.updateScenario = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const scenarioId = req.params.id;
    const scenarioData = req.body;

    // Validate input
    if (!scenarioData.scenario_name) {
      return res.status(400).json({ 
        message: 'Scenario name is required' 
      });
    }

    // Sanitize data: convert undefined values to null
    Object.keys(scenarioData).forEach(key => {
      if (scenarioData[key] === undefined) {
        scenarioData[key] = null;
      }
    });

    // Verify account belongs to user if account_id is provided
    if (scenarioData.account_id) {
      const account = await Account.getAccountById(scenarioData.account_id, userId);
      if (!account) {
        return res.status(400).json({ message: 'Invalid account selected' });
      }
    }

    // Recalculate expected value if relevant fields changed
    if (scenarioData.win_probability && scenarioData.potential_profit && scenarioData.risk_amount) {
      const winSide = scenarioData.potential_profit * scenarioData.win_probability;
      const lossSide = scenarioData.risk_amount * (1 - scenarioData.win_probability);
      scenarioData.expected_value = winSide - lossSide;
    }

    const updated = await TradingScenario.updateScenario(scenarioId, userId, scenarioData);

    if (!updated) {
      return res.status(404).json({ message: 'Scenario not found or unauthorized' });
    }

    res.json({ 
      message: 'Scenario updated successfully',
      scenario_id: scenarioId,
      ...scenarioData
    });
  } catch (error) {
    console.error('Update scenario error:', error);
    res.status(500).json({ message: 'Error updating trading scenario' });
  }
};

// Delete a scenario
exports.deleteScenario = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const scenarioId = req.params.id;

    const deleted = await TradingScenario.deleteScenario(scenarioId, userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Scenario not found or unauthorized' });
    }

    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    console.error('Delete scenario error:', error);
    res.status(500).json({ message: 'Error deleting trading scenario' });
  }
};

// Create a scenario from template
exports.createFromTemplate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { templateId, accountId, marketData } = req.body;

    if (!templateId || !accountId || !marketData) {
      return res.status(400).json({ 
        message: 'Template ID, account ID, and market data are required' 
      });
    }

    // Sanitize market data: convert undefined values to null
    Object.keys(marketData).forEach(key => {
      if (marketData[key] === undefined) {
        marketData[key] = null;
      }
    });

    // Verify account belongs to user
    const account = await Account.getAccountById(accountId, userId);
    if (!account) {
      return res.status(400).json({ message: 'Invalid account selected' });
    }

    // Create scenario from template
    const scenarioId = await TradingScenario.createFromTemplate(userId, templateId, accountId, marketData);

    const scenario = await TradingScenario.getScenarioById(scenarioId, userId);

    res.status(201).json({
      message: 'Scenario created from template successfully',
      scenario
    });
  } catch (error) {
    console.error('Create from template error:', error);
    res.status(500).json({ message: 'Error creating scenario from template: ' + error.message });
  }
};