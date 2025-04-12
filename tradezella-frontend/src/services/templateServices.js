// src/services/templateService.js
import axios from 'axios';
import config from '../config';

const { API } = config;

// Get all templates
const getTemplates = async () => {
  try {
    const response = await axios.get(API.endpoints.templates.base);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch templates' };
  }
};

// Get template by ID
const getTemplateById = async (id) => {
  try {
    const response = await axios.get(API.endpoints.templates.getById(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch template' };
  }
};

// Create new template
const createTemplate = async (templateData) => {
  try {
    const response = await axios.post(API.endpoints.templates.base, templateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create template' };
  }
};

// Update template
const updateTemplate = async (id, templateData) => {
  try {
    const response = await axios.put(API.endpoints.templates.getById(id), templateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update template' };
  }
};

// Delete template
const deleteTemplate = async (id) => {
  try {
    const response = await axios.delete(API.endpoints.templates.getById(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete template' };
  }
};

const templateService = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};

export default templateService;