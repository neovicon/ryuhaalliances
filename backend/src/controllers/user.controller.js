import { body, validationResult, query } from 'express-validator';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import bcrypt from 'bcryptjs';

export const validateDisplayName = [ body('displayName').isString().isLength({ min: 1, max: 64 }) ];
export async function updateDisplayName(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const user = await User.findByIdAndUpdate(req.user.id, { displayName: req.body.displayName }, { new: true });
  const userObj = user.toObject();
  userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
  res.json({ user: userObj });
}

export const validateSearch = [ query('q').optional().isString(), query('house').optional().isString() ];

export async function searchUsers(req, res) {
  const { q, house } = req.query;
  const filter = {};
  if (q) filter.username = { $regex: q, $options: 'i' };
  if (house) filter.house = house;
  const users = await User.find(filter).select('username displayName house points photoUrl');
  const usersWithFullUrl = users.map(user => {
    const userObj = user.toObject();
    userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
    return userObj;
  });
  res.json({ users: usersWithFullUrl });
}

export async function getMe(req, res) {
  const me = await User.findById(req.user.id).select('-passwordHash');
  if (!me) {
    return res.status(404).json({ error: 'User not found' });
  }
  const userObj = me.toObject();
  userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
  userObj.heroCardUrl = getPhotoUrl(userObj.heroCardUrl, req);
  // Convert _id to id for consistency
  const { _id, ...rest } = userObj;
  res.json({ user: { id: _id, ...rest } });
}

export async function updatePhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { photoUrl: url }, { new: true });
  // Return user with full photoUrl
  const userObj = user.toObject();
  userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
  res.json({ user: userObj });
}

export async function updateHeroCard(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { heroCardUrl: url }, { new: true });
  // Return user with full heroCardUrl
  const userObj = user.toObject();
  userObj.heroCardUrl = getPhotoUrl(userObj.heroCardUrl, req);
  res.json({ user: userObj });
}

export const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
];

export async function changePassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user.id, { passwordHash });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}


