// src/models/templateModel.js
const db = require('../config/database');

class Template {
  // Create a new template
  static async create(userId, templateData) {
    const { 
      template_name, 
      market, 
      setup_type,
      entry_criteria,
      exit_criteria,
      risk_reward_ratio,
      position_size_rule,
      notes,
      tags
    } = templateData;

    const [result] = await db.execute(
      `INSERT INTO TradingTemplates 
      (user_id, template_name, market, setup_type, entry_criteria, exit_criteria, 
       risk_reward_ratio, position_size_rule, notes, tags, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId, 
        template_name, 
        market,
        setup_type,
        entry_criteria,
        exit_criteria,
        risk_reward_ratio,
        position_size_rule,
        notes,
        tags
      ]
    );

    return result.insertId;
  }

  // Get all templates for a user
  static async getUserTemplates(userId) {
    const [templates] = await db.execute(
      `SELECT * FROM TradingTemplates WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    return templates;
  }

  // Get a specific template by ID and user
  static async getTemplateById(templateId, userId) {
    const [templates] = await db.execute(
      `SELECT * FROM TradingTemplates WHERE template_id = ? AND user_id = ?`,
      [templateId, userId]
    );

    return templates[0];
  }

  // Update a template
  static async updateTemplate(templateId, userId, templateData) {
    const { 
      template_name, 
      market, 
      setup_type,
      entry_criteria,
      exit_criteria,
      risk_reward_ratio,
      position_size_rule,
      notes,
      tags
    } = templateData;

    const [result] = await db.execute(
      `UPDATE TradingTemplates 
       SET template_name = ?, market = ?, setup_type = ?, entry_criteria = ?, 
           exit_criteria = ?, risk_reward_ratio = ?, position_size_rule = ?, 
           notes = ?, tags = ?, updated_at = NOW() 
       WHERE template_id = ? AND user_id = ?`,
      [
        template_name, 
        market,
        setup_type,
        entry_criteria,
        exit_criteria,
        risk_reward_ratio,
        position_size_rule,
        notes,
        tags,
        templateId, 
        userId
      ]
    );

    return result.affectedRows > 0;
  }

  // Delete a template
  static async deleteTemplate(templateId, userId) {
    const [result] = await db.execute(
      `DELETE FROM TradingTemplates WHERE template_id = ? AND user_id = ?`,
      [templateId, userId]
    );

    return result.affectedRows > 0;
  }
}

module.exports = Template;