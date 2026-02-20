import { body, validationResult, param } from 'express-validator';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import { sendBulkEmails } from '../services/mailer.js';
import * as notificationService from '../services/notification.service.js';

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
    const announcementId = announcementObj._id || announcementObj.id;
    let fullImageUrl = null;
    if (announcementObj.imageUrl) {
      fullImageUrl = await getPhotoUrl(announcementObj.imageUrl, req);
      announcementObj.imageUrl = fullImageUrl;
    }
    const { _id, ...rest } = announcementObj;

    // Send email notifications to all approved users (non-blocking)
    sendAnnouncementEmails({
      id: announcementId,
      title: announcementObj.title,
      content: announcementObj.content,
      imageUrl: fullImageUrl
    }).catch(error => {
      console.error('Error sending announcement emails:', error);
    });

    // Create notification
    notificationService.createNotification({
      target: 'all',
      sender: req.user.id,
      type: 'announcement',
      title: 'New Announcement',
      message: `${req.user.username} posted a new announcement: ${title}`,
      link: `/announcements/${announcementId}`
    });

    res.status(201).json({ announcement: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
}

async function sendAnnouncementEmails(announcement) {
  try {
    // Get all approved users with verified emails
    const users = await User.find({ status: 'approved', emailVerified: true }).select('email displayName username');

    if (users.length === 0) {
      console.log('No approved users to send announcement emails to');
      return;
    }

    const baseUrl = process.env.CLIENT_ORIGIN?.replace(/\/$/, '') || 'http://localhost:5173';
    const announcementId = announcement.id || announcement._id;
    const announcementUrl = `${baseUrl}/announcements/${announcementId}`;

    // Escape HTML in content to prevent XSS, but preserve line breaks
    const escapedContent = announcement.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #b10f2e 0%, #8b0d26 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #b10f2e; }
            .announcement-content { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
            .button { display: inline-block; background: #b10f2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Ryuha Alliance</h1>
            </div>
            <div class="content">
              <div class="title">New Announcement: ${announcement.title}</div>
              <div class="announcement-content">${escapedContent}</div>
              ${announcement.imageUrl ? `<img src="${announcement.imageUrl}" alt="${announcement.title}" style="max-width: 100%; border-radius: 8px; margin: 20px 0;" />` : ''}
              <a href="${announcementUrl}" class="button">View Full Announcement</a>
              <div class="footer">
                <p>You are receiving this email because you are a registered member of Ryuha Alliance.</p>
                <p>© ${new Date().getFullYear()} Ryuha Alliance. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const subject = `New Announcement: ${announcement.title}`;
    const recipientEmails = users.map(user => user.email).filter(email => email);

    console.log(`Sending announcement email to ${recipientEmails.length} users...`);
    const results = await sendBulkEmails({
      recipients: recipientEmails,
      subject,
      html
    });

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`Announcement emails sent: ${successCount} successful, ${failCount} failed`);
  } catch (error) {
    console.error('Error in sendAnnouncementEmails:', error);
    throw error;
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

export const validateGetAnnouncement = [param('id').isMongoId().withMessage('Invalid announcement ID')];

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
  param('id').isMongoId().withMessage('Invalid announcement ID'),
  body('content')
    .isString()
    .withMessage('Comment must be text')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
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

    // Create notification
    notificationService.createNotification({
      target: 'all',
      sender: req.user.id,
      type: 'comment',
      title: 'New Comment on Announcement',
      message: `${req.user.username} commented on the announcement: ${announcement.title}`,
      link: `/announcements/${_id}`
    });

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

export const validateDeleteAnnouncement = [param('id').isMongoId()];

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

export const validateReact = [
  param('id').isMongoId().withMessage('Invalid announcement ID'),
  body('key')
    .isString()
    .withMessage('Reaction key must be text')
    .isLength({ min: 1, max: 32 })
    .withMessage('Reaction key must be between 1 and 32 characters')
];

export async function react(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    const { key } = req.body;
    let reaction = announcement.reactions.find(r => r.key === key);
    if (!reaction) {
      reaction = { key, userIds: [] };
      announcement.reactions.push(reaction);
    }
    const idx = reaction.userIds.findIndex(u => String(u) === req.user.id);
    if (idx >= 0) reaction.userIds.splice(idx, 1); else reaction.userIds.push(req.user.id);
    await announcement.save();
    res.json({ announcement });
  } catch (err) {
    console.error('Error reacting to announcement:', err);
    res.status(500).json({ error: 'Failed to react' });
  }
}

