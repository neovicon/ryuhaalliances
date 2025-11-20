import { body, validationResult, query, param } from 'express-validator';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { sanitizeUser } from './auth.controller.js';

export const validateDisplayName = [ body('displayName').isString().isLength({ min: 1, max: 64 }) ];
export async function updateDisplayName(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const user = await User.findByIdAndUpdate(req.user.id, { displayName: req.body.displayName }, { new: true });
  const userObj = user.toObject();
  userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
  res.json({ user: userObj });
}

export const validateSearch = [ query('q').optional().isString(), query('house').optional().isString() ];

export async function getHouses(req, res) {
  const houses = await User.distinct('house');
  res.json({ houses: houses.filter(Boolean).sort() });
}

export async function searchUsers(req, res) {
  const { q, house } = req.query;
  const filter = {};
  if (q) filter.username = { $regex: q, $options: 'i' };
  if (house) filter.house = house;
  const users = await User.find(filter).select('username displayName house points photoUrl');
  const usersWithFullUrl = await Promise.all(users.map(async user => {
    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    return userObj;
  }));
  res.json({ users: usersWithFullUrl });
}

export async function getMe(req, res) {
  const me = await User.findById(req.user.id);
  if (!me) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: await sanitizeUser(me, req) });
}

export async function updatePhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Use storagePath from Supabase (filename only), otherwise fall back to local path
  const filePath = req.file.storagePath || `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { photoUrl: filePath }, { new: true });
  // Return user with signed URL for photoUrl
  const userObj = user.toObject();
  userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
  res.json({ user: userObj });
}

export async function updateHeroCard(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Use storagePath from Supabase (filename only), otherwise fall back to local path
  const filePath = req.file.storagePath || `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { heroCardUrl: filePath }, { new: true });
  // Return user with signed URL for heroCardUrl
  const userObj = user.toObject();
  userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
  res.json({ user: userObj });
}

export async function deleteHeroCard(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { heroCardUrl: null }, { new: true });
    // Return user with updated heroCardUrl (should be null)
    const userObj = user.toObject();
    userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
    res.json({ user: userObj });
  } catch (error) {
    console.error('Error deleting hero card:', error);
    res.status(500).json({ error: 'Failed to delete hero card' });
  }
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

export const validatePublicProfile = [
  query('identifier').isString().trim().isLength({ min: 1, max: 128 }).withMessage('Identifier is required'),
];

export async function getPublicProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const identifier = req.query.identifier.trim();
    const upperIdentifier = identifier.toUpperCase();

    const conditions = [
      { username: identifier },
      { sigil: upperIdentifier },
      { displayName: { $regex: `^${identifier}$`, $options: 'i' } }
    ];

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      conditions.push({ _id: identifier });
    }

    const user = await User.findOne({ $or: conditions }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
    // Convert certificate paths to full URLs
    if (userObj.certificates && userObj.certificates.length > 0) {
      userObj.certificates = await Promise.all(
        userObj.certificates.map(cert => getPhotoUrl(cert, req))
      );
    }
    userObj.warningNotice = await getPhotoUrl(userObj.warningNotice, req);

    const { _id, email, adminMessage, ...rest } = userObj;
    const publicUser = {
      id: _id,
      username: rest.username,
      displayName: rest.displayName,
      house: rest.house,
      sigil: rest.sigil,
      points: rest.points,
      rank: rest.rank,
      role: rest.role,
      status: rest.status,
      memberStatus: rest.memberStatus,
      photoUrl: rest.photoUrl,
      heroCardUrl: rest.heroCardUrl,
      certificates: rest.certificates || [],
      warningNotice: rest.warningNotice,
      warningText: rest.warningText,
      createdAt: rest.createdAt,
      updatedAt: rest.updatedAt
    };

    res.json({ user: publicUser });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export const validatePublicSearch = [
  query('q').optional().isString().trim().isLength({ min: 1, max: 64 }),
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function publicSearch(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const q = req.query.q?.trim();
  if (!q) {
    return res.json({ users: [] });
  }

  try {
    const regex = new RegExp(escapeRegex(q), 'i');
    const users = await User.find({
      $or: [
        { username: regex },
        { displayName: regex },
        { sigil: regex }
      ]
    })
      .select('username displayName sigil house photoUrl')
      .limit(10);

    const results = await Promise.all(users.map(async user => {
      const userObj = user.toObject();
      userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
      return {
        id: userObj._id,
        username: userObj.username,
        displayName: userObj.displayName,
        sigil: userObj.sigil,
        house: userObj.house,
        photoUrl: userObj.photoUrl
      };
    }));

    res.json({ users: results });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
}

// Artisan endpoints: Modify Hero License and upload Certificates for members
export const validateUpdateMemberHeroCard = [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
];

export async function updateMemberHeroCard(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const { userId } = req.params;
    const filePath = req.file.storagePath || `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, { heroCardUrl: filePath }, { new: true }).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'Hero License updated successfully' });
  } catch (error) {
    console.error('Error updating member hero card:', error);
    res.status(500).json({ error: 'Failed to update hero license' });
  }
}

export const validateUploadCertificate = [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
];

export async function uploadCertificate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const { userId } = req.params;
    const filePath = req.file.storagePath || `/uploads/${req.file.filename}`;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add certificate to the array
    const certificates = user.certificates || [];
    certificates.push(filePath);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { certificates },
      { new: true }
    ).select('-passwordHash');

    const userObj = updatedUser.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
    // Convert certificate paths to full URLs
    if (userObj.certificates && userObj.certificates.length > 0) {
      userObj.certificates = await Promise.all(
        userObj.certificates.map(cert => getPhotoUrl(cert, req))
      );
    }
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'Certificate uploaded successfully' });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({ error: 'Failed to upload certificate' });
  }
}

// Arbiter endpoints: Upload warning notice for members
export const validateUploadWarningNotice = [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('warningText').optional().isString().withMessage('Warning text must be a string'),
];

export async function uploadWarningNotice(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { warningText } = req.body;
  const hasFile = !!req.file;
  const hasText = warningText && warningText.trim().length > 0;

  if (!hasFile && !hasText) {
    return res.status(400).json({ error: 'Either warning text or warning image must be provided' });
  }

  try {
    const { userId } = req.params;
    const updateData = {};
    
    if (hasFile) {
      const filePath = req.file.storagePath || `/uploads/${req.file.filename}`;
      updateData.warningNotice = filePath;
    }
    
    if (hasText) {
      updateData.warningText = warningText.trim();
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
    userObj.warningNotice = await getPhotoUrl(userObj.warningNotice, req);
    // Convert certificate paths to full URLs if they exist
    if (userObj.certificates && userObj.certificates.length > 0) {
      userObj.certificates = await Promise.all(
        userObj.certificates.map(cert => getPhotoUrl(cert, req))
      );
    }
    const { _id, ...rest } = userObj;

    res.json({ user: { id: _id, ...rest }, message: 'Warning notice updated successfully' });
  } catch (error) {
    console.error('Error uploading warning notice:', error);
    res.status(500).json({ error: 'Failed to upload warning notice' });
  }
}

export async function removeWarningNotice(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.warningNotice = null;
    user.warningText = null;
    await user.save();

    const userObj = user.toObject();
    userObj.photoUrl = await getPhotoUrl(userObj.photoUrl, req);
    userObj.heroCardUrl = await getPhotoUrl(userObj.heroCardUrl, req);
    userObj.warningNotice = await getPhotoUrl(userObj.warningNotice, req);
    if (userObj.certificates && userObj.certificates.length > 0) {
      userObj.certificates = await Promise.all(userObj.certificates.map(cert => getPhotoUrl(cert, req)));
    }
    const { _id, ...rest } = userObj;
    res.json({ user: { id: _id, ...rest }, message: 'Warning removed' });
  } catch (error) {
    console.error('Error removing warning notice:', error);
    res.status(500).json({ error: 'Failed to remove warning notice' });
  }
}


