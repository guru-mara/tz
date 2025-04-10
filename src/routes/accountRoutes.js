const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createAccount,
  getUserAccounts,
  getAccountById,
  deleteAccount
} = require('../controllers/accountController');

const router = express.Router();

// All routes are protected and require authentication
router.route('/')
  .post(protect, createAccount)   // Create a new account
  .get(protect, getUserAccounts); // Get all user accounts

router.route('/:id')
  .get(protect, getAccountById)     // Get specific account
  .delete(protect, deleteAccount);  // Delete an account

module.exports = router;