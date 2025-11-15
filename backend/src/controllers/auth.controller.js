import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User, { allowedHouses } from '../models/User.js';
import { signJwt, verifyJwt } from '../utils/jwt.js';
import { getPhotoUrl } from '../utils/photoUrl.js';

export const validateSignup = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('sigil').notEmpty().withMessage('Sigil code is required'),
  body('house').isIn(allowedHouses).withMessage(`House must be one of: ${allowedHouses.join(', ')}`),
  body('displayName').optional({ nullable: true, checkFalsy: true }).isLength({ max: 64 }).withMessage('Display name must be less than 64 characters'),
];

export async function signup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      const field = err.path || err.param;
      const msg = err.msg;
      return `${field}: ${msg}`;
    }).join(', ');
    return res.status(400).json({ error: errorMessages, errors: errors.array() });
  }

  const { email, password, username, sigil, house, displayName } = req.body;
  
  // Trim and clean up input
  const cleanEmail = email?.trim();
  const cleanUsername = username?.trim();
  const cleanSigil = sigil?.trim();
  const cleanDisplayName = displayName?.trim() || undefined;
  
  const existing = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
  if (existing) return res.status(409).json({ error: 'Email or username already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  // All new signups start as pending (status defaults to 'pending' in the model)
  const user = await User.create({ 
    email: cleanEmail, 
    passwordHash, 
    username: cleanUsername, 
    sigil: cleanSigil, 
    house, 
    displayName: cleanDisplayName
  });
  const token = signJwt({ id: user._id, role: user.role, username: user.username });
  return res.status(201).json({ token, user: await sanitizeUser(user, req) });
}

export const validateLogin = [
  body('email').isEmail(),
  body('password').isString(),
];

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  
  // Check if user account is approved
  if (user.status === 'pending') {
    const message = user.adminMessage ? ` Message: ${user.adminMessage}` : '';
    return res.status(403).json({ 
      error: 'Your account is pending approval. Please wait for an admin to review your account.' + message,
      adminMessage: user.adminMessage || null
    });
  }
  if (user.status === 'declined') {
    const message = user.adminMessage ? ` Your account has been declined. Message: ${user.adminMessage}` : ' Your account has been declined.';
    return res.status(403).json({ error: `Account declined.${message}` });
  }
  
  const token = signJwt({ id: user._id, role: user.role, username: user.username });
  res.json({ token, user: await sanitizeUser(user, req) });
}

export async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    const decoded = verifyJwt(token);
    if (decoded.type !== 'verify') return res.status(400).json({ error: 'Invalid token' });
    await User.findByIdAndUpdate(decoded.id, { emailVerified: true });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
}

export async function resendVerification(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.emailVerified) return res.status(400).json({ error: 'Already verified' });
  const verifyToken = signJwt({ id: user._id, type: 'verify' }, { expiresIn: '24h' });
  const base = process.env.CLIENT_ORIGIN?.replace(/\/$/, '') || 'http://localhost:5173';
  const link = `${base}/verify-email?token=${verifyToken}`;
  await sendEmail({ to: user.email, subject: 'Verify your email', html: `<p>Click <a href="${link}">here</a> to verify your email.</p>` });
  res.json({ ok: true });
}

async function sanitizeUser(user, req = null) {
  const userObj = user.toObject ? user.toObject() : user;
  const { _id, email, username, displayName, sigil, house, photoUrl, heroCardUrl, points, role, status, adminMessage, rank, createdAt, updatedAt } = userObj;
  return { 
    id: _id, 
    email, 
    username, 
    displayName, 
    sigil, 
    house, 
    photoUrl: await getPhotoUrl(photoUrl, req), 
    heroCardUrl: await getPhotoUrl(heroCardUrl, req),
    points, 
    role, 
    status,
    adminMessage,
    rank,
    createdAt, 
    updatedAt 
  };
}


