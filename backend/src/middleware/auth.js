import { verifyJwt } from '../utils/jwt.js';
import User from '../models/User.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = verifyJwt(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Helper function to load full user data including moderatorType
async function loadUserData(req) {
  if (!req.user || !req.user.id) return null;
  if (req.userData) return req.userData; // Cache user data for the request

  try {
    const user = await User.findById(req.user.id).select('role moderatorType');
    if (user) {
      req.userData = user;
      // Merge moderatorType into req.user for convenience
      req.user.moderatorType = user.moderatorType;
      req.user.role = user.role; // Ensure role is up to date
    }
    return user;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
}

export async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  // Load full user data to ensure role is up to date
  const user = await loadUserData(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

export async function requireModerator(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  // Load full user data to ensure role is up to date
  const user = await loadUserData(req);
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Permission middleware for specific moderator types
export function requireModeratorType(allowedTypes) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Load full user data to get moderatorType
    const user = await loadUserData(req);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Admins have access to everything
    if (user.role === 'admin') {
      return next();
    }

    // Check if user is a moderator with the required type
    if (user.role === 'moderator' && user.moderatorType && allowedTypes.includes(user.moderatorType)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  };
}

// Specific permission middleware functions
export const requireAesther = requireModeratorType(['Aesther']);
export const requireVigil = requireModeratorType(['Vigil']);
export const requireArtisan = requireModeratorType(['Artisan']);
export const requireArbiter = requireModeratorType(['Arbiter']);
export const requireOverseer = requireModeratorType(['Overseer']);
export const requireGatekeeper = requireModeratorType(['Gatekeeper']);

// Allow either admin or Arbiter moderators
export async function requireArbiterOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // Load full user data to ensure role and moderatorType are available
  const user = await loadUserData(req);
  if (!user) return res.status(401).json({ error: 'User not found' });

  if (user.role === 'admin') return next();
  if (user.role === 'moderator' && user.moderatorType === 'Arbiter') return next();

  return res.status(403).json({ error: 'Forbidden' });
}

// Allow either admin or Artisan moderators
export async function requireArtisanOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = await loadUserData(req);
  if (!user) return res.status(401).json({ error: 'User not found' });

  if (user.role === 'admin') return next();
  if (user.role === 'moderator' && user.moderatorType === 'Artisan') return next();

  return res.status(403).json({ error: 'Forbidden' });
}

// Combined permissions (multiple moderator types can access)
export const requireAestherOrOverseer = requireModeratorType(['Aesther', 'Overseer']);
export const requireAestherOrVigilOrOverseer = requireModeratorType(['Aesther', 'Vigil', 'Overseer']);


