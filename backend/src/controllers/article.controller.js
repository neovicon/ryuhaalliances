import { body, validationResult, param } from 'express-validator';
import Article from '../models/Article.js';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import * as notificationService from '../services/notification.service.js';

export const validateCreateArticle = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
];

export async function createArticle(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, content, imageUrl } = req.body;
    const article = await Article.create({
      title,
      content,
      imageUrl: imageUrl || null,
      createdBy: req.user.id,
      isActive: true,
    });

    await article.populate('createdBy', 'username displayName');
    const articleObj = article.toObject();
    if (articleObj.imageUrl) {
      articleObj.imageUrl = await getPhotoUrl(articleObj.imageUrl, req);
    }
    const { _id, ...rest } = articleObj;

    // Create notification
    notificationService.createNotification({
      target: 'all',
      sender: req.user.id,
      type: 'article',
      title: 'New Article',
      message: `${req.user.username} posted a new article: ${title}`,
      link: `/articles/${_id}`
    });

    res.status(201).json({ article: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
}

export async function listArticles(req, res) {
  try {
    const { activeOnly } = req.query;
    const query = activeOnly === 'true' ? { isActive: true } : {};
    const articles = await Article.find(query).populate('createdBy', 'username displayName').sort({ createdAt: -1 });
    const withUrls = await Promise.all(articles.map(async a => {
      const obj = a.toObject();
      if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
      const { _id, ...rest } = obj;
      return { id: _id, ...rest };
    }));
    res.json({ articles: withUrls });
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
}

export const validateGetArticle = [param('id').isMongoId().withMessage('Invalid article ID')];

export async function getArticleById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { id } = req.params;
    const article = await Article.findById(id).populate('createdBy', 'username displayName photoUrl').populate('comments.author', 'username displayName photoUrl');
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const obj = article.toObject();
    if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
    if (obj.createdBy && obj.createdBy.photoUrl) obj.createdBy.photoUrl = await getPhotoUrl(obj.createdBy.photoUrl, req);
    if (obj.comments) {
      obj.comments = await Promise.all(obj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        return comment;
      }));
    }
    const { _id, ...rest } = obj;
    res.json({ article: { id: _id, ...rest } });
  } catch (err) {
    console.error('Error fetching article:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
}

export const validateAddComment = [
  param('id').isMongoId().withMessage('Invalid article ID'),
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
    const article = await Article.findById(id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    article.comments.push({ author: req.user.id, content: req.body.content });
    await article.save();
    await article.populate('createdBy', 'username displayName photoUrl');
    await article.populate('comments.author', 'username displayName photoUrl');
    const obj = article.toObject();
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
      title: 'New Comment on Article',
      message: `${req.user.username} commented on the article: ${article.title}`,
      link: `/articles/${_id}`
    });

    res.status(201).json({ article: { id: _id, ...rest } });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export const validateUpdateArticle = [param('id').isMongoId(), body('title').optional().notEmpty().withMessage('Title cannot be empty'), body('content').optional().notEmpty().withMessage('Content cannot be empty'), body('isActive').optional().isBoolean()];

export async function updateArticle(req, res) {
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
    const article = await Article.findByIdAndUpdate(id, updateData, { new: true }).populate('createdBy', 'username displayName');
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const obj = article.toObject();
    if (obj.imageUrl) obj.imageUrl = await getPhotoUrl(obj.imageUrl, req);
    const { _id, ...rest } = obj;
    res.json({ article: { id: _id, ...rest } });
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
}

export const validateDeleteArticle = [param('id').isMongoId()];

export async function deleteArticle(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { id } = req.params;
    const article = await Article.findByIdAndDelete(id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    // Delete associated notifications
    notificationService.deleteByLink(`/articles/${id}`);

    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
}

export const validateReact = [
  param('id').isMongoId().withMessage('Invalid article ID'),
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
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const { key } = req.body;
    let reaction = article.reactions.find(r => r.key === key);
    if (!reaction) {
      reaction = { key, userIds: [] };
      article.reactions.push(reaction);
    }
    const idx = reaction.userIds.findIndex(u => String(u) === req.user.id);
    if (idx >= 0) reaction.userIds.splice(idx, 1); else reaction.userIds.push(req.user.id);
    await article.save();
    res.json({ article });
  } catch (err) {
    console.error('Error reacting to article:', err);
    res.status(500).json({ error: 'Failed to react' });
  }
}
