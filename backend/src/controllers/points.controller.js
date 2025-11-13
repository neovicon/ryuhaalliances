import { body, validationResult, param } from 'express-validator';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import { RANKS } from '../utils/rank.js';

export const validateAdjust = [ param('userId').isMongoId(), body('delta').isInt({ min: -100000, max: 100000 }).toInt() ];
export async function adjustPoints(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const user = await User.findByIdAndUpdate(req.params.userId, { $inc: { points: req.body.delta } }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

export const validateUpdateRank = [ 
  param('userId').isMongoId(), 
  body('rank').isIn(RANKS).withMessage(`Rank must be one of: ${RANKS.join(', ')}`)
];
export async function updateRank(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const user = await User.findByIdAndUpdate(req.params.userId, { rank: req.body.rank }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

export async function leaderboard(req, res) {
  // Exclude pending users and admins from leaderboard
  const top = await User.find({ 
    status: 'approved',
    role: { $ne: 'admin' }
  })
    .select('username group points photoUrl rank')
    .sort({ points: -1 })
    .limit(50);
  const topWithFullUrl = top.map(user => {
    const userObj = user.toObject();
    userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
    return userObj;
  });
  res.json({ top: topWithFullUrl });
}


