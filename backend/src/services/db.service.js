import { useSupabase, getSupabaseClient, formatResponse, formatForSupabase } from '../utils/db.js';
import User from '../models/User.js';

/**
 * Database service that provides seamless integration with Supabase and MongoDB
 * Automatically uses Supabase if configured, otherwise falls back to MongoDB
 */

class DatabaseService {
  constructor() {
    this.useSupabase = useSupabase();
    if (this.useSupabase) {
      this.supabase = getSupabaseClient();
      console.log('DatabaseService: Using Supabase');
    } else {
      console.log('DatabaseService: Using MongoDB');
    }
  }

  /**
   * Find one user by query
   */
  async findUser(query) {
    if (this.useSupabase) {
      return this.findUserSupabase(query);
    } else {
      return this.findUserMongo(query);
    }
  }

  /**
   * Find user in Supabase
   */
  async findUserSupabase(query) {
    const { email, username, _id, id } = query;
    let queryBuilder = this.supabase.from('users').select('*');
    
    if (email) {
      queryBuilder = queryBuilder.eq('email', email);
    } else if (username) {
      queryBuilder = queryBuilder.eq('username', username);
    } else if (_id || id) {
      queryBuilder = queryBuilder.eq('id', _id || id);
    }
    
    const { data, error } = await queryBuilder.single();
    if (error) {
      // PGRST116 is "relation does not exist", PGRST103 is "no rows returned"
      if (error.code === 'PGRST103' || error.code === '42P01') {
        return null;
      }
      throw error;
    }
    
    return data ? formatResponse(data, true) : null;
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
    if (this.useSupabase) {
      return this.createUserSupabase(userData);
    } else {
      return this.createUserMongo(userData);
    }
  }

  /**
   * Create user in Supabase
   */
  async createUserSupabase(userData) {
    // Map camelCase to snake_case for Supabase
    const formattedData = {
      email: userData.email,
      password_hash: userData.passwordHash,
      username: userData.username,
      sigil: userData.sigil,
      house: userData.house,
      display_name: userData.displayName || null,
      status: userData.status || 'pending',
      role: userData.role || 'user',
      points: userData.points || 0,
      rank: userData.rank || 'Novice',
      email_verified: false,
      photo_url: null,
      hero_card_url: null,
      admin_message: null,
      member_status: null
    };
    
    const { data, error } = await this.supabase
      .from('users')
      .insert([formattedData])
      .select()
      .single();
    
    if (error) throw error;
    return formatResponse(data, true);
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
    if (this.useSupabase) {
      return this.updateUserSupabase(query, updateData);
    } else {
      return this.updateUserMongo(query, updateData);
    }
  }

  /**
   * Update user in Supabase
   */
  async updateUserSupabase(query, updateData) {
    const { _id, id, email, username } = query;
    const identifier = _id || id || email || username;
    
    let queryBuilder = this.supabase.from('users').update(formatForSupabase(updateData));
    
    if (_id || id) {
      queryBuilder = queryBuilder.eq('id', _id || id);
    } else if (email) {
      queryBuilder = queryBuilder.eq('email', email);
    } else if (username) {
      queryBuilder = queryBuilder.eq('username', username);
    }
    
    const { data, error } = await queryBuilder.select().single();
    if (error) throw error;
    return formatResponse(data, true);
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
    if (this.useSupabase) {
      return this.findUsersSupabase(query, options);
    } else {
      return this.findUsersMongo(query, options);
    }
  }

  /**
   * Find users in Supabase
   */
  async findUsersSupabase(query, options = {}) {
    let queryBuilder = this.supabase.from('users').select('*');
    
    // Apply filters
    Object.keys(query).forEach(key => {
      if (key === 'status') {
        queryBuilder = queryBuilder.eq('status', query[key]);
      } else if (key === 'house') {
        queryBuilder = queryBuilder.eq('house', query[key]);
      } else if (key === '$or') {
        // Handle MongoDB-style $or queries
        // This is simplified - you may need to expand this
      }
    });
    
    // Apply sorting
    if (options.sort) {
      const [field, order] = Object.entries(options.sort)[0];
      queryBuilder = queryBuilder.order(field, { ascending: order === 1 });
    }
    
    // Apply limit
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }
    
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return formatResponse(data, false);
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

