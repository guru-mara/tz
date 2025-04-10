const Account = require('../models/accountModel');

// Create a new trading account
exports.createAccount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const accountData = req.body;

    // Validate input
    if (!accountData.account_name || !accountData.initial_balance) {
      return res.status(400).json({ 
        message: 'Account name and initial balance are required' 
      });
    }

    // Set default account type if not provided
    accountData.account_type = accountData.account_type || 'Personal';

    // Create account
    const accountId = await Account.create(userId, accountData);

    res.status(201).json({
      message: 'Account created successfully',
      account_id: accountId,
      ...accountData
    });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({ message: 'Error creating trading account' });
  }
};

// Get user's trading accounts
exports.getUserAccounts = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const accounts = await Account.getUserAccounts(userId);

    res.json(accounts);
  } catch (error) {
    console.error('Fetch accounts error:', error);
    res.status(500).json({ message: 'Error fetching trading accounts' });
  }
};

// Get a specific account
exports.getAccountById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const accountId = req.params.id;

    const account = await Account.getAccountById(accountId, userId);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Fetch account error:', error);
    res.status(500).json({ message: 'Error fetching account details' });
  }
};

// Delete an account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const accountId = req.params.id;

    const deleted = await Account.deleteAccount(accountId, userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Account not found or unauthorized' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error deleting trading account' });
  }
};