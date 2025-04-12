const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createTemplate,
  getUserTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
} = require('../controllers/templateController');

const router = express.Router();

// All routes are protected and require authentication
router.route('/')
  .post(protect, createTemplate)     // Create a new template
  .get(protect, getUserTemplates);   // Get all user templates

router.route('/:id')
  .get(protect, getTemplateById)     // Get specific template
  .put(protect, updateTemplate)      // Update a template
  .delete(protect, deleteTemplate);  // Delete a template

module.exports = router;