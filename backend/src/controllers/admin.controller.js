import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import Post from '../models/Post.js';

export async function getPendingUsers(req, res) {
  try {
    const users = await User.find({ status: 'pending' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    const usersWithFullUrl = users.map(user => {
      const userObj = user.toObject();
      userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
      // Convert _id to id for consistency
      const { _id, ...rest } = userObj;
      return { id: _id, ...rest };
    });
    
    res.json({ users: usersWithFullUrl });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
}

export const validateApproveUser = [
  body('userId').notEmpty().withMessage('User ID is required'),
];

export async function approveUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'approved', adminMessage: null },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userObj = user.toObject();
    userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
    // Convert _id to id for consistency
    const { _id, ...rest } = userObj;
    
    res.json({ user: { id: _id, ...rest }, message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
}

export const validateDeclineUser = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('message').optional().isString().withMessage('Message must be a string'),
];

export async function declineUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId, message } = req.body;
    const updateData = { status: 'declined' };
    if (message) {
      updateData.adminMessage = message.trim();
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userObj = user.toObject();
    userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
    // Convert _id to id for consistency
    const { _id, ...rest } = userObj;
    
    res.json({ user: { id: _id, ...rest }, message: 'User declined successfully' });
  } catch (error) {
    console.error('Error declining user:', error);
    res.status(500).json({ error: 'Failed to decline user' });
  }
}

export const validateSendMessage = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('message').notEmpty().withMessage('Message is required'),
];

export async function sendMessageToUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId, message } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { adminMessage: message.trim() },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userObj = user.toObject();
    userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
    // Convert _id to id for consistency
    const { _id, ...rest } = userObj;
    
    res.json({ user: { id: _id, ...rest }, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message to user:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

export async function getAllUsers(req, res) {
  try {
    // Exclude pending users from the all users list
    const users = await User.find({ status: { $ne: 'pending' } })
      .select('-passwordHash')
      .sort({ points: -1, createdAt: -1 });
    
    const usersWithFullUrl = users.map(user => {
      const userObj = user.toObject();
      userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
      userObj.heroCardUrl = getPhotoUrl(userObj.heroCardUrl, req);
      // Convert _id to id for consistency
      const { _id, ...rest } = userObj;
      return { id: _id, ...rest };
    });
    
    res.json({ users: usersWithFullUrl });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export const validateUpdateHouse = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('house').notEmpty().withMessage('House is required'),
];

export async function updateHouse(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId, house } = req.body;
    const { allowedHouses } = await import('../models/User.js');
    
    if (!allowedHouses.includes(house)) {
      return res.status(400).json({ error: `House must be one of: ${allowedHouses.join(', ')}` });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { house },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userObj = user.toObject();
    userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
    const { _id, ...rest } = userObj;
    
    res.json({ user: { id: _id, ...rest }, message: 'House updated successfully' });
  } catch (error) {
    console.error('Error updating house:', error);
    res.status(500).json({ error: 'Failed to update house' });
  }
}

export const validateAddModerator = [
  body('userId').notEmpty().withMessage('User ID is required'),
];

export async function addModerator(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'moderator' },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userObj = user.toObject();
    userObj.photoUrl = getPhotoUrl(userObj.photoUrl, req);
    const { _id, ...rest } = userObj;
    
    res.json({ user: { id: _id, ...rest }, message: 'User promoted to moderator successfully' });
  } catch (error) {
    console.error('Error adding moderator:', error);
    res.status(500).json({ error: 'Failed to add moderator' });
  }
}

export const validateRemoveUser = [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
];

export async function removeUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId } = req.params;
    if (String(req.user.id) === userId) {
      return res.status(400).json({ error: 'You cannot remove your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot remove an admin account' });
    }

    await Post.deleteMany({ author: user._id });
    await user.deleteOne();

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
}

