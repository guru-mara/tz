const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createScenario,
  getUserScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario,
  createFromTemplate
} = require('../controllers/scenarioController');

const router = express.Router();

// All routes are protected and require authentication
router.route('/')
  .post(protect, createScenario)      // Create a new scenario
  .get(protect, getUserScenarios);    // Get all user scenarios

router.route('/template')
  .post(protect, createFromTemplate); // Create scenario from template

router.route('/:id')
  .get(protect, getScenarioById)      // Get specific scenario
  .put(protect, updateScenario)       // Update a scenario
  .delete(protect, deleteScenario);   // Delete a scenario

module.exports = router;