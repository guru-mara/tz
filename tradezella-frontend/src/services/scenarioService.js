// src/services/scenarioService.js
import axios from 'axios';
import config from '../config';

const { API } = config;

// Get all scenarios
const getScenarios = async () => {
  try {
    const response = await axios.get(API.endpoints.scenarios.base);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch scenarios' };
  }
};

// Get scenario by ID
const getScenarioById = async (id) => {
  try {
    const response = await axios.get(API.endpoints.scenarios.getById(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch scenario' };
  }
};

// Create new scenario
const createScenario = async (scenarioData) => {
  try {
    const response = await axios.post(API.endpoints.scenarios.base, scenarioData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create scenario' };
  }
};

// Create scenario from template
const createFromTemplate = async (templateId, accountId, marketData) => {
  try {
    const response = await axios.post(API.endpoints.scenarios.fromTemplate, {
      templateId,
      accountId,
      marketData
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create scenario from template' };
  }
};

// Update scenario
const updateScenario = async (id, scenarioData) => {
  try {
    const response = await axios.put(API.endpoints.scenarios.getById(id), scenarioData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update scenario' };
  }
};

// Delete scenario
const deleteScenario = async (id) => {
  try {
    const response = await axios.delete(API.endpoints.scenarios.getById(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete scenario' };
  }
};

const scenarioService = {
  getScenarios,
  getScenarioById,
  createScenario,
  createFromTemplate,
  updateScenario,
  deleteScenario
};

export default scenarioService;