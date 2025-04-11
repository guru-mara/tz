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

  // Update account balance - fixed to handle large numbers and potential issues
  static async updateBalance(accountId, newBalance) {
    try {
      // Ensure newBalance is a valid number and within reasonable range
      if (isNaN(newBalance)) {
        throw new Error("Invalid balance value: not a number");
      }
      
      // Limit to 2 decimal places to avoid floating point issues
      const formattedBalance = parseFloat(newBalance.toFixed(2));
      
      // Check if the value is within the DECIMAL(20,2) range
      if (Math.abs(formattedBalance) > 99999999999999999.99) {
        throw new Error("Balance value exceeds allowed range");
      }
      
      // Execute the update with the safely formatted balance
      await db.execute(
        `UPDATE TradingAccounts SET current_balance = ? WHERE account_id = ?`,
        [formattedBalance, accountId]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
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