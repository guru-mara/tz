// src/controllers/templateController.js
const Template = require('../models/templateModel');

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templateData = req.body;

    // Validate input
    if (!templateData.template_name) {
      return res.status(400).json({ 
        message: 'Template name is required' 
      });
    }

    // Set default market if not provided
    templateData.market = templateData.market || 'Gold';

    // Create template
    const templateId = await Template.create(userId, templateData);

    res.status(201).json({
      message: 'Template created successfully',
      template_id: templateId,
      ...templateData,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({ message: 'Error creating template' });
  }
};

// Get user's templates
exports.getUserTemplates = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templates = await Template.getUserTemplates(userId);

    res.json(templates);
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ message: 'Error fetching templates' });
  }
};

// Get a specific template
exports.getTemplateById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templateId = req.params.id;

    const template = await Template.getTemplateById(templateId, userId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Fetch template error:', error);
    res.status(500).json({ message: 'Error fetching template details' });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templateId = req.params.id;
    const templateData = req.body;

    // Validate input
    if (!templateData.template_name) {
      return res.status(400).json({ 
        message: 'Template name is required' 
      });
    }

    const updated = await Template.updateTemplate(templateId, userId, templateData);

    if (!updated) {
      return res.status(404).json({ message: 'Template not found or unauthorized' });
    }

    const updatedTemplate = await Template.getTemplateById(templateId, userId);

    res.json({ 
      message: 'Template updated successfully',
      ...updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Error updating template' });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templateId = req.params.id;

    const deleted = await Template.deleteTemplate(templateId, userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Template not found or unauthorized' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Error deleting template' });
  }
};