import { supabase } from '../config/supabase.js';
import mongoose from 'mongoose';

/**
 * Database utility functions that provide seamless integration with Supabase
 * Falls back to MongoDB if Supabase is not configured
 */

export const useSupabase = () => {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
};

/**
 * Get a Supabase client instance
 */
export const getSupabaseClient = () => {
  if (!useSupabase()) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
};

/**
 * Convert MongoDB-style ObjectId to Supabase UUID (if needed)
 */
export const toSupabaseId = (id) => {
  if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]+$/.test(id)) {
    // This is a MongoDB ObjectId, we might want to convert it
    // For now, we'll keep it as is if Supabase table uses text IDs
    return id;
  }
  return id;
};

/**
 * Convert Supabase response to MongoDB-like format
 */
export const formatResponse = (data, single = false) => {
  if (!data) return single ? null : [];
  
  if (single) {
    return formatSingleRecord(data);
  }
  
  return Array.isArray(data) ? data.map(formatSingleRecord) : [];
};

/**
 * Format a single record to match MongoDB document structure
 */
const formatSingleRecord = (record) => {
  if (!record) return null;
  
  // Supabase returns records with snake_case, convert to camelCase
  const formatted = {
    _id: record.id || record._id,
    id: record.id || record._id,
    ...record
  };
  
  // Convert snake_case keys to camelCase for consistency
  Object.keys(formatted).forEach(key => {
    if (key.includes('_') && key !== '_id') {
      const camelKey = snakeToCamel(key);
      if (camelKey !== key) {
        formatted[camelKey] = formatted[key];
        delete formatted[key];
      }
    }
  });
  
  return formatted;
};

/**
 * Convert snake_case to camelCase
 */
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase to snake_case for Supabase
 */
export const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Format object keys for Supabase (camelCase to snake_case)
 */
export const formatForSupabase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const formatted = {};
  Object.keys(obj).forEach(key => {
    const snakeKey = key === '_id' ? 'id' : toSnakeCase(key);
    formatted[snakeKey] = obj[key];
  });
  
  return formatted;
};

