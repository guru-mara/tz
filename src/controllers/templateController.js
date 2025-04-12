const TradeTemplate = require('../models/tradeTemplateModel');

// Create a new trade template
exports.createTemplate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templateData = req.body;

    // Validate input
    if (!templateData.template_name || !templateData.market) {
      return res.status(400).json({ 
        message: 'Template name and market are required' 
      });
    }

    // Create template
    const templateId = await TradeTemplate.create(userId, templateData);

    res.status(201).json({
      message: 'Trade template created successfully',
      template_id: templateId,
      ...templateData
    });
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({ message: 'Error creating trade template' });
  }
};

// Get user's trade templates
exports.getUserTemplates = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templates = await TradeTemplate.getUserTemplates(userId);

    res.json(templates);
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ message: 'Error fetching trade templates' });
  }
};

// Get a specific template
exports.getTemplateById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templateId = req.params.id;

    const template = await TradeTemplate.getTemplateById(templateId, userId);

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
    if (!templateData.template_name || !templateData.market) {
      return res.status(400).json({ 
        message: 'Template name and market are required' 
      });
    }

    const updated = await TradeTemplate.updateTemplate(templateId, userId, templateData);

    if (!updated) {
      return res.status(404).json({ message: 'Template not found or unauthorized' });
    }

    res.json({ 
      message: 'Template updated successfully',
      template_id: templateId,
      ...templateData
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Error updating trade template' });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const templateId = req.params.id;

    const deleted = await TradeTemplate.deleteTemplate(templateId, userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Template not found or unauthorized' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Error deleting trade template' });
  }
};