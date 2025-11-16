import { body, validationResult, param } from 'express-validator';
import Announcement from '../models/Announcement.js';
import { getPhotoUrl } from '../utils/photoUrl.js';

export const validateCreateAnnouncement = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
];

export async function createAnnouncement(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, content, imageUrl } = req.body;
    const announcement = await Announcement.create({
      title,
      content,
      imageUrl: imageUrl || null,
      createdBy: req.user.id,
      isActive: true,
    });

    await announcement.populate('createdBy', 'username displayName');
    
    const announcementObj = announcement.toObject();
    if (announcementObj.imageUrl) {
      announcementObj.imageUrl = await getPhotoUrl(announcementObj.imageUrl, req);
    }
    const { _id, ...rest } = announcementObj;
    res.status(201).json({ announcement: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
}

export async function listAnnouncements(req, res) {
  try {
    const { activeOnly } = req.query;
    const query = activeOnly === 'true' ? { isActive: true } : {};
    
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'username displayName')
      .sort({ createdAt: -1 });

    const announcementsWithFullUrl = await Promise.all(announcements.map(async announcement => {
      const announcementObj = announcement.toObject();
      if (announcementObj.imageUrl) {
        announcementObj.imageUrl = await getPhotoUrl(announcementObj.imageUrl, req);
      }
      const { _id, ...rest } = announcementObj;
      return { id: _id, ...rest };
    }));

    res.json({ announcements: announcementsWithFullUrl });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
}

export const validateGetAnnouncement = [ param('id').isMongoId().withMessage('Invalid announcement ID') ];

export async function getAnnouncementById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'username displayName photoUrl')
      .populate('comments.author', 'username displayName photoUrl');

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const announcementObj = announcement.toObject();
    if (announcementObj.imageUrl) {
      announcementObj.imageUrl = await getPhotoUrl(announcementObj.imageUrl, req);
    }
    if (announcementObj.createdBy && announcementObj.createdBy.photoUrl) {
      announcementObj.createdBy.photoUrl = await getPhotoUrl(announcementObj.createdBy.photoUrl, req);
    }
    if (announcementObj.comments) {
      announcementObj.comments = await Promise.all(announcementObj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) {
          comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        }
        return comment;
      }));
    }
    const { _id, ...rest } = announcementObj;
    res.json({ announcement: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid announcement ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
}

export const validateAddComment = [
  param('id').isMongoId(),
  body('content').isString().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
];

export async function addComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    announcement.comments.push({
      author: req.user.id,
      content: req.body.content,
    });

    await announcement.save();
    await announcement.populate('createdBy', 'username displayName photoUrl');
    await announcement.populate('comments.author', 'username displayName photoUrl');

    const announcementObj = announcement.toObject();
    if (announcementObj.imageUrl) {
      announcementObj.imageUrl = await getPhotoUrl(announcementObj.imageUrl, req);
    }
    if (announcementObj.createdBy && announcementObj.createdBy.photoUrl) {
      announcementObj.createdBy.photoUrl = await getPhotoUrl(announcementObj.createdBy.photoUrl, req);
    }
    if (announcementObj.comments) {
      announcementObj.comments = await Promise.all(announcementObj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) {
          comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        }
        return comment;
      }));
    }
    const { _id, ...rest } = announcementObj;
    res.status(201).json({ announcement: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export const validateUpdateAnnouncement = [
  param('id').isMongoId(),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('isActive').optional().isBoolean(),
];

export async function updateAnnouncement(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const { title, content, imageUrl, isActive } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isActive !== undefined) updateData.isActive = isActive;
    // Only update imageUrl if a new image was uploaded (imageUrl is set by middleware)
    // If imageUrl is explicitly set to null/empty string, remove the image
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    const announcement = await Announcement.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'username displayName');

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const announcementObj = announcement.toObject();
    if (announcementObj.imageUrl) {
      announcementObj.imageUrl = await getPhotoUrl(announcementObj.imageUrl, req);
    }
    const { _id, ...rest } = announcementObj;
    res.json({ announcement: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
}

export const validateDeleteAnnouncement = [ param('id').isMongoId() ];

export async function deleteAnnouncement(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
}

