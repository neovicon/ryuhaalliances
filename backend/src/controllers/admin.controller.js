import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import House from '../models/House.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import Post from '../models/Post.js';

export async function getPendingUsers(req, res) {
  try {
    const users = await User.find({ status: 'pending' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    const usersWithFullUrl = await Promise.all(users.map(async user => {
      const userObj = user.toObject();
      userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
      // Convert _id to id for consistency
      const { _id, ...rest } = userObj;
      return { id: _id, ...rest };
    }));

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
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
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
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
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
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Exclude pending users from the all users list
    const users = await User.find({ status: { $ne: 'pending' } })
      .select('-passwordHash')
      .sort({ points: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({ status: { $ne: 'pending' } });
    const totalPages = Math.ceil(totalUsers / limit);

    const usersWithFullUrl = await Promise.all(users.map(async user => {
      const userObj = user.toObject();
      userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
      userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
      // Convert _id to id for consistency
      const { _id, ...rest } = userObj;
      return { id: _id, ...rest };
    }));

    res.json({
      users: usersWithFullUrl,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q.trim();
    const searchRegex = new RegExp(query, 'i'); // case-insensitive search

    // Search across username, displayName, email, and house
    const users = await User.find({
      status: { $ne: 'pending' },
      $or: [
        { username: searchRegex },
        { displayName: searchRegex },
        { email: searchRegex },
        { house: searchRegex }
      ]
    })
      .select('-passwordHash')
      .sort({ points: -1, createdAt: -1 })
      .limit(50); // Limit search results to 50

    const usersWithFullUrl = await Promise.all(users.map(async user => {
      const userObj = user.toObject();
      userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
      userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
      // Convert _id to id for consistency
      const { _id, ...rest } = userObj;
      return { id: _id, ...rest };
    }));

    res.json({ users: usersWithFullUrl });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
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
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'House updated successfully' });
  } catch (error) {
    console.error('Error updating house:', error);
    res.status(500).json({ error: 'Failed to update house' });
  }
}

export const validateAddModerator = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('moderatorType').isIn(['Arbiter', 'Artisan', 'Vigil', 'Aesther', 'Gatekeeper', 'Overseer', 'Emissary']).withMessage('Valid moderator type is required'),
];

export async function addModerator(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId, moderatorType } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'moderator', moderatorType },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
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

export const validateUpdateMemberStatus = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('memberStatus').optional().isString().withMessage('Member status must be a string'),
];

export async function updateMemberStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId, memberStatus } = req.body;
    const { allowedMemberStatuses } = await import('../models/User.js');

    if (memberStatus !== null && memberStatus !== undefined && memberStatus !== '' && !allowedMemberStatuses.includes(memberStatus)) {
      return res.status(400).json({ error: `Member status must be one of: ${allowedMemberStatuses.join(', ')}` });
    }

    const updateData = memberStatus === null || memberStatus === undefined || memberStatus === ''
      ? { $unset: { memberStatus: 1 } }
      : { memberStatus };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'Member status updated successfully' });
  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({ error: 'Failed to update member status' });
  }
}

export async function getHouseMembers(req, res) {
  try {
    const { house } = req.query;
    if (!house) {
      return res.status(400).json({ error: 'House parameter is required' });
    }

    const users = await User.find({
      house: house,
      status: 'approved'
    })
      .select('-passwordHash')
      .sort({ memberStatus: 1, points: -1, createdAt: -1 });

    const usersWithFullUrl = await Promise.all(users.map(async user => {
      const userObj = user.toObject();
      userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
      userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
      // Convert _id to id for consistency
      const { _id, ...rest } = userObj;
      return { id: _id, ...rest };
    }));

    res.json({ members: usersWithFullUrl });
  } catch (error) {
    console.error('Error fetching house members:', error);
    res.status(500).json({ error: 'Failed to fetch house members' });
  }
}

export async function getHouse(req, res) {
  try {
    const { houseName } = req.query;
    if (!houseName) {
      return res.status(400).json({ error: 'House name parameter is required' });
    }

    let house = await House.findOne({ name: houseName });

    // If house doesn't exist, create it with default values
    if (!house) {
      const defaultDescription = getDefaultHouseDescription(houseName);
      house = await House.create({
        name: houseName,
        description: defaultDescription,
        status: 'Active'
      });
    }

    const houseObj = house.toObject();
    const { _id, ...rest } = houseObj;

    res.json({ house: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error fetching house:', error);
    res.status(500).json({ error: 'Failed to fetch house' });
  }
}

function getDefaultHouseDescription(houseName) {
  const descriptions = {
    'Pendragon': 'A house of legendary warriors and noble knights, embodying honor, chivalry, and unwavering loyalty. Members of Pendragon stand as guardians of tradition and defenders of justice.',
    'Phantomhive': 'Masters of shadow and precision, Phantomhive represents elegance, intelligence, and strategic thinking. This house values perfection and the art of subtlety.',
    'Tempest': 'A force of nature and raw power, Tempest embodies strength, resilience, and the unstoppable spirit of those who rise above adversity.',
    'Zoldyck': 'The house of assassins and silent guardians, Zoldyck values discipline, precision, and the mastery of one\'s craft. Members are known for their dedication and skill.',
    'Fritz': 'Warriors of justice and protectors of the innocent, Fritz represents courage, determination, and the unwavering pursuit of what is right.',
    'Elric': 'Scholars and alchemists, Elric embodies knowledge, transformation, and the pursuit of understanding. This house values wisdom and the power of learning.',
    'Dragneel': 'A house of fire and passion, Dragneel represents friendship, loyalty, and the burning spirit of those who never give up. Members are known for their fierce determination.',
    'Hellsing': 'Guardians of the night and protectors of secrets, Hellsing values strength, independence, and the power to stand alone against darkness.',
    'Obsidian Order': 'The elite and mysterious order, Obsidian Order represents power, strategy, and the mastery of both light and shadow. Members are the architects of change.',
    'Council of IV': 'A house of wisdom and governance, Council of IV represents leadership, unity, and the collective strength of those who guide and protect.',
    'Abyssal IV': 'A house of depth and mystery, Abyssal IV represents the hidden depths of power, resilience, and the unyielding force that emerges from the shadows.',
    'Von Einzbern': 'An ancient and noble lineage of magi, the Von Einzbern house is synonymous with alchemical mastery and the pursuit of the Holy Grail. They value tradition, precision, and the manifestation of supreme magical mysteries.',
  };
  return descriptions[houseName] || 'A distinguished house within the Ryuha Alliance, dedicated to honor, discipline, and unity.';
}

export async function getAllHouses(req, res) {
  try {
    const houses = await House.find().sort({ name: 1 });

    const housesList = houses.map(house => {
      const houseObj = house.toObject();
      const { _id, ...rest } = houseObj;
      return { id: _id, ...rest };
    });

    res.json({ houses: housesList });
  } catch (error) {
    console.error('Error fetching houses:', error);
    res.status(500).json({ error: 'Failed to fetch houses' });
  }
}

export const validateUpdateHouseDetails = [
  body('houseName').notEmpty().withMessage('House name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];

export async function updateHouseDetails(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { houseName, description, status } = req.body;

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    let house = await House.findOneAndUpdate(
      { name: houseName },
      updateData,
      { new: true, upsert: true }
    );

    const houseObj = house.toObject();
    const { _id, ...rest } = houseObj;

    res.json({ house: { id: _id, ...rest }, message: 'House details updated successfully' });
  } catch (error) {
    console.error('Error updating house details:', error);
    res.status(500).json({ error: 'Failed to update house details' });
  }
}

export const validateUpdateUsername = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('username').isString().isLength({ min: 1, max: 32 }).withMessage('Username must be between 1 and 32 characters'),
];

export async function updateUsername(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId, username } = req.body;
    const cleanUsername = username.trim();

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ username: cleanUsername, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already in use' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username: cleanUsername },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'Username updated successfully' });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
}

export const validateUpdateDisplayName = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('displayName').optional().isString().isLength({ min: 1, max: 64 }).withMessage('Display name must be between 1 and 64 characters'),
];

export async function updateDisplayName(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId, displayName } = req.body;
    const cleanDisplayName = displayName?.trim() || null;

    const updateData = cleanDisplayName ? { displayName: cleanDisplayName } : { $unset: { displayName: 1 } };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'Display name updated successfully' });
  } catch (error) {
    console.error('Error updating display name:', error);
    res.status(500).json({ error: 'Failed to update display name' });
  }
}

export const validateRemoveModerator = [
  body('userId').notEmpty().withMessage('User ID is required'),
];

export async function removeModerator(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'user', moderatorType: null },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'Moderator role removed successfully' });
  } catch (error) {
    console.error('Error removing moderator:', error);
    res.status(500).json({ error: 'Failed to remove moderator' });
  }
}

