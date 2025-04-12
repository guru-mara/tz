const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createSimulation,
  getUserSimulations,
  getSimulationById,
  updateSimulation,
  deleteSimulation,
  createFromScenario,
  executeSimulation,
  getSimulationStats
} = require('../controllers/simulationController');

const router = express.Router();

// All routes are protected and require authentication
router.route('/')
  .post(protect, createSimulation)    // Create a new simulation
  .get(protect, getUserSimulations);  // Get all user simulations

router.route('/scenario')
  .post(protect, createFromScenario); // Create simulation from scenario

router.route('/stats')
  .get(protect, getSimulationStats);  // Get simulation statistics

router.route('/:id')
  .get(protect, getSimulationById)    // Get specific simulation
  .put(protect, updateSimulation)     // Update a simulation
  .delete(protect, deleteSimulation); // Delete a simulation

router.route('/:id/execute')
  .post(protect, executeSimulation);  // Execute a simulation

module.exports = router;