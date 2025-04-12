// src/services/simulationService.js
import axios from 'axios';
import config from '../config';

const { API } = config;

// Get all simulations
const getSimulations = async () => {
  try {
    const response = await axios.get(API.endpoints.simulations.base);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch simulations' };
  }
};

// Get simulation by ID
const getSimulationById = async (id) => {
  try {
    const response = await axios.get(API.endpoints.simulations.getById(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch simulation' };
  }
};

// Create new simulation
const createSimulation = async (simulationData) => {
  try {
    const response = await axios.post(API.endpoints.simulations.base, simulationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create simulation' };
  }
};

// Create simulation from scenario
const createFromScenario = async (scenarioId) => {
  try {
    const response = await axios.post(API.endpoints.simulations.fromScenario, { scenarioId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create simulation from scenario' };
  }
};

// Execute simulation
const executeSimulation = async (id, executionData) => {
  try {
    const response = await axios.post(API.endpoints.simulations.execute(id), executionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to execute simulation' };
  }
};

// Get simulation statistics
const getSimulationStats = async () => {
  try {
    const response = await axios.get(API.endpoints.simulations.stats);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch simulation statistics' };
  }
};

// Update simulation
const updateSimulation = async (id, simulationData) => {
  try {
    const response = await axios.put(API.endpoints.simulations.getById(id), simulationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update simulation' };
  }
};

// Delete simulation
const deleteSimulation = async (id) => {
  try {
    const response = await axios.delete(API.endpoints.simulations.getById(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete simulation' };
  }
};

const simulationService = {
  getSimulations,
  getSimulationById,
  createSimulation,
  createFromScenario,
  executeSimulation,
  getSimulationStats,
  updateSimulation,
  deleteSimulation
};

export default simulationService;