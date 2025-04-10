const db = require('../config/database');

class Account {
  // Create a new trading account
  static async create(userId, accountData) {
    const { 
      account_name, 
      broker_name, 
      initial_balance, 
      account_type 
    } = accountData;

    const [result] = await db.execute(
      `INSERT INTO TradingAccounts 
      (user_id, account_name, broker_name, initial_balance, current_balance, account_type) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        account_name, 
        broker_name, 
        initial_balance, 
        initial_balance, 
        account_type
      ]
    );

    return result.insertId;
  }

  // Get all accounts for a user
  static async getUserAccounts(userId) {
    const [accounts] = await db.execute(
      `SELECT * FROM TradingAccounts WHERE user_id = ?`,
      [userId]
    );

    return accounts;
  }

  // Get a specific account by ID and user
  static async getAccountById(accountId, userId) {
    const [accounts] = await db.execute(
      `SELECT * FROM TradingAccounts WHERE account_id = ? AND user_id = ?`,
      [accountId, userId]
    );

    return accounts[0];
  }

  // Update account balance
  static async updateBalance(accountId, newBalance) {
    await db.execute(
      `UPDATE TradingAccounts SET current_balance = ? WHERE account_id = ?`,
      [newBalance, accountId]
    );
  }

  // Delete an account
  static async deleteAccount(accountId, userId) {
    const [result] = await db.execute(
      `DELETE FROM TradingAccounts WHERE account_id = ? AND user_id = ?`,
      [accountId, userId]
    );

    return result.affectedRows > 0;
  }
}

module.exports = Account;