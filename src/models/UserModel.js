const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(username, email, password) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO Users (username, email, password_hash, last_login) VALUES (?, ?, ?, NOW())',
      [username, email, hashedPassword]
    );

    return result.insertId;
  }

  // Find user by username
  static async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT * FROM Users WHERE username = ?',
      [username]
    );

    return rows[0];
  }

  // Verify user credentials
  static async verifyCredentials(username, password) {
    const user = await this.findByUsername(username);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (isMatch) {
      // Update last login time
      await db.execute(
        'UPDATE Users SET last_login = NOW() WHERE user_id = ?',
        [user.user_id]
      );
    }

    return isMatch ? user : null;
  }

  // Update last login
  static async updateLastLogin(userId) {
    await db.execute(
      'UPDATE Users SET last_login = NOW() WHERE user_id = ?',
      [userId]
    );
  }
}

module.exports = User;