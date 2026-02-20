import { body, validationResult, param } from 'express-validator';
import Story from '../models/Story.js';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import * as notificationService from '../services/notification.service.js';

export const validateCreateStory = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
];

export async function createStory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, content, imageUrl } = req.body;
    const story = await Story.create({ title, content, imageUrl: imageUrl || null, createdBy: req.user.id, isActive: true });
    await story.populate('createdBy', 'username displayName');
    const obj = story.toObject();
    if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
    const { _id, ...rest } = obj;

    // Create notification
    notificationService.createNotification({
      target: 'all',
      sender: req.user.id,
      type: 'story',
      title: 'New Story',
      message: `${req.user.username} posted a new story: ${title}`,
      link: `/stories/${_id}`
    });

    res.status(201).json({ story: { id: _id, ...rest } });
  } catch (err) {
    console.error('Error creating story:', err);
    res.status(500).json({ error: 'Failed to create story' });
  }
}

export async function listStories(req, res) {
  try {
    const { activeOnly } = req.query;
    const query = activeOnly === 'true' ? { isActive: true } : {};
    const stories = await Story.find(query).populate('createdBy', 'username displayName').sort({ createdAt: -1 });
    const out = await Promise.all(stories.map(async s => {
      const obj = s.toObject();
      if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
      const { _id, ...rest } = obj;
      return { id: _id, ...rest };
    }));
    res.json({ stories: out });
  } catch (err) {
    console.error('Error fetching stories:', err);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
}

export const validateGetStory = [param('id').isMongoId().withMessage('Invalid story ID')];

export async function getStoryById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { id } = req.params;
    const story = await Story.findById(id).populate('createdBy', 'username displayName photoUrl').populate('comments.author', 'username displayName photoUrl');
    if (!story) return res.status(404).json({ error: 'Story not found' });
    const obj = story.toObject();
    if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
    if (obj.createdBy && obj.createdBy.photoUrl) obj.createdBy.photoUrl = await getPhotoUrl(obj.createdBy.photoUrl, req);
    if (obj.comments) {
      obj.comments = await Promise.all(obj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        return comment;
      }));
    }
    const { _id, ...rest } = obj;
    res.json({ story: { id: _id, ...rest } });
  } catch (err) {
    console.error('Error fetching story:', err);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
}

export const validateAddComment = [
  param('id').isMongoId().withMessage('Invalid story ID'),
  body('content')
    .isString()
    .withMessage('Comment must be text')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

export async function addComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    story.comments.push({ author: req.user.id, content: req.body.content });
    await story.save();
    await story.populate('createdBy', 'username displayName photoUrl');
    await story.populate('comments.author', 'username displayName photoUrl');
    const obj = story.toObject();
    if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
    if (obj.createdBy && obj.createdBy.photoUrl) obj.createdBy.photoUrl = await getPhotoUrl(obj.createdBy.photoUrl, req);
    if (obj.comments) {
      obj.comments = await Promise.all(obj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        return comment;
      }));
    }
    const { _id, ...rest } = obj;

    // Create notification
    notificationService.createNotification({
      target: 'all',
      sender: req.user.id,
      type: 'comment',
      title: 'New Comment on Story',
      message: `${req.user.username} commented on the story: ${story.title}`,
      link: `/stories/${_id}`
    });

    res.status(201).json({ story: { id: _id, ...rest } });
  } catch (err) {
    console.error('Error adding story comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export const validateUpdateStory = [param('id').isMongoId(), body('title').optional().notEmpty().withMessage('Title cannot be empty'), body('content').optional().notEmpty().withMessage('Content cannot be empty'), body('isActive').optional().isBoolean()];

export async function updateStory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { id } = req.params;
    const { title, content, imageUrl, isActive } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    const story = await Story.findByIdAndUpdate(id, updateData, { new: true }).populate('createdBy', 'username displayName');
    if (!story) return res.status(404).json({ error: 'Story not found' });
    const obj = story.toObject();
    if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
    const { _id, ...rest } = obj;
    res.json({ story: { id: _id, ...rest } });
  } catch (err) {
    console.error('Error updating story:', err);
    res.status(500).json({ error: 'Failed to update story' });
  }
}

export const validateDeleteStory = [param('id').isMongoId()];

export async function deleteStory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { id } = req.params;
    const story = await Story.findByIdAndDelete(id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.json({ message: 'Story deleted successfully' });
  } catch (err) {
    console.error('Error deleting story:', err);
    res.status(500).json({ error: 'Failed to delete story' });
  }
}

export const validateReact = [
  param('id').isMongoId().withMessage('Invalid story ID'),
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
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    const { key } = req.body;
    let reaction = story.reactions.find(r => r.key === key);
    if (!reaction) {
      reaction = { key, userIds: [] };
      story.reactions.push(reaction);
    }
    const idx = reaction.userIds.findIndex(u => String(u) === req.user.id);
    if (idx >= 0) reaction.userIds.splice(idx, 1); else reaction.userIds.push(req.user.id);
    await story.save();
    res.json({ story });
  } catch (err) {
    console.error('Error reacting to story:', err);
    res.status(500).json({ error: 'Failed to react' });
  }
}
