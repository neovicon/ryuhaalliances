import User from '../models/User.js';

/**
 * Database service that provides integration with MongoDB
 * Previously supported Supabase, now exclusively MongoDB
 */

class DatabaseService {
  constructor() {
    console.log('DatabaseService: Using MongoDB');
  }

  /**
   * Find one user by query
   */
  async findUser(query) {
    return this.findUserMongo(query);
  }

  /**
   * Find user in MongoDB
   */
  async findUserMongo(query) {
    return await User.findOne(query);
  }

  /**
   * Create a user
   */
  async createUser(userData) {
    return this.createUserMongo(userData);
  }

  /**
   * Create user in MongoDB
   */
  async createUserMongo(userData) {
    return await User.create(userData);
  }

  /**
   * Update user
   */
  async updateUser(query, updateData) {
    return this.updateUserMongo(query, updateData);
  }

  /**
   * Update user in MongoDB
   */
  async updateUserMongo(query, updateData) {
    return await User.findOneAndUpdate(query, updateData, { new: true });
  }

  /**
   * Find users with query
   */
  async findUsers(query = {}, options = {}) {
    return this.findUsersMongo(query, options);
  }

  /**
   * Find users in MongoDB
   */
  async findUsersMongo(query, options = {}) {
    let mongoQuery = User.find(query);

    if (options.sort) {
      mongoQuery = mongoQuery.sort(options.sort);
    }

    if (options.limit) {
      mongoQuery = mongoQuery.limit(options.limit);
    }

    return await mongoQuery;
  }
}

// Export singleton instance
export default new DatabaseService();


