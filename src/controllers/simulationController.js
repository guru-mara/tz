const TradeSimulation = require('../models/simulationModel');
const Account = require('../models/accountModel');

// Create a new trade simulation
exports.createSimulation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const simulationData = req.body;

    // Validate input
    if (!simulationData.simulation_name) {
      return res.status(400).json({ 
        message: 'Simulation name is required' 
      });
    }

    // Verify account belongs to user if account_id is provided
    if (simulationData.account_id) {
      const account = await Account.getAccountById(simulationData.account_id, userId);
      if (!account) {
        return res.status(400).json({ message: 'Invalid account selected' });
      }
    }

    // Create simulation
    const simulationId = await TradeSimulation.create(userId, simulationData);

    res.status(201).json({
      message: 'Trade simulation created successfully',
      simulation_id: simulationId,
      ...simulationData
    });
  } catch (error) {
    console.error('Simulation creation error:', error);
    res.status(500).json({ message: 'Error creating trade simulation' });
  }
};

// Get user's trade simulations
exports.getUserSimulations = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const simulations = await TradeSimulation.getUserSimulations(userId);

    res.json(simulations);
  } catch (error) {
    console.error('Fetch simulations error:', error);
    res.status(500).json({ message: 'Error fetching trade simulations' });
  }
};

// Get a specific simulation
exports.getSimulationById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const simulationId = req.params.id;

    const simulation = await TradeSimulation.getSimulationById(simulationId, userId);

    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    res.json(simulation);
  } catch (error) {
    console.error('Fetch simulation error:', error);
    res.status(500).json({ message: 'Error fetching simulation details' });
  }
};

// Update a simulation
exports.updateSimulation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const simulationId = req.params.id;
    const simulationData = req.body;

    // Validate input
    if (!simulationData.simulation_name) {
      return res.status(400).json({ 
        message: 'Simulation name is required' 
      });
    }

    // Verify account belongs to user if account_id is provided
    if (simulationData.account_id) {
      const account = await Account.getAccountById(simulationData.account_id, userId);
      if (!account) {
        return res.status(400).json({ message: 'Invalid account selected' });
      }
    }

    const updated = await TradeSimulation.updateSimulation(simulationId, userId, simulationData);

    if (!updated) {
      return res.status(404).json({ message: 'Simulation not found or unauthorized' });
    }

    res.json({ 
      message: 'Simulation updated successfully',
      simulation_id: simulationId,
      ...simulationData
    });
  } catch (error) {
    console.error('Update simulation error:', error);
    res.status(500).json({ message: 'Error updating trade simulation' });
  }
};

// Delete a simulation
exports.deleteSimulation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const simulationId = req.params.id;

    const deleted = await TradeSimulation.deleteSimulation(simulationId, userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Simulation not found or unauthorized' });
    }

    res.json({ message: 'Simulation deleted successfully' });
  } catch (error) {
    console.error('Delete simulation error:', error);
    res.status(500).json({ message: 'Error deleting trade simulation' });
  }
};

// Create a simulation from scenario
exports.createFromScenario = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { scenarioId } = req.body;

    if (!scenarioId) {
      return res.status(400).json({ message: 'Scenario ID is required' });
    }

    // Create simulation from scenario
    const simulationId = await TradeSimulation.createFromScenario(userId, scenarioId);

    const simulation = await TradeSimulation.getSimulationById(simulationId, userId);

    res.status(201).json({
      message: 'Simulation created from scenario successfully',
      simulation
    });
  } catch (error) {
    console.error('Create from scenario error:', error);
    res.status(500).json({ message: 'Error creating simulation from scenario: ' + error.message });
  }
};

// Execute a trade simulation
exports.executeSimulation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const simulationId = req.params.id;
    const executionData = req.body;

    // Validate input
    if (!executionData.exit_price || !executionData.simulation_result) {
      return res.status(400).json({ 
        message: 'Exit price and simulation result are required' 
      });
    }

    // Execute the simulation
    const result = await TradeSimulation.executeSimulation(simulationId, userId, executionData);

    if (!result.updated) {
      return res.status(404).json({ message: 'Simulation not found or unauthorized' });
    }

    res.json({ 
      message: 'Simulation executed successfully',
      profit_loss: result.profit_loss,
      simulation_result: executionData.simulation_result
    });
  } catch (error) {
    console.error('Execute simulation error:', error);
    res.status(500).json({ message: 'Error executing trade simulation: ' + error.message });
  }
};

// Get simulation statistics
exports.getSimulationStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const stats = await TradeSimulation.getSimulationStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('Simulation stats error:', error);
    res.status(500).json({ message: 'Error fetching simulation statistics' });
  }
};