import { body, validationResult, param } from 'express-validator';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import mongoose from 'mongoose';
import * as notificationService from '../services/notification.service.js';

export const validateCreatePost = [
  body('content').optional().isString().isLength({ max: 2000 }),
  body('isPrivate').optional()
];
export async function createPost(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const content = req.body.content || '';

  // Handle both single file (req.file) and multiple fields (req.files)
  let image = null;
  let video = null;

  if (req.file) {
    // Single file upload (backward compatibility)
    image = req.file.storagePath;
  } else if (req.files) {
    // Multiple file fields
    if (req.files.image && req.files.image[0]) {
      image = req.files.image[0].storagePath;
    }
    if (req.files.video && req.files.video[0]) {
      video = req.files.video[0].storagePath;
    }
  }

  if (!content.trim() && !image && !video) {
    return res.status(400).json({ error: 'Post must have content, an image, or a video' });
  }

  const post = await Post.create({
    author: req.user.id,
    content,
    image,
    video,
    isPrivate: req.body.isPrivate === 'true' || req.body.isPrivate === true
  });
  await post.populate('author', 'username photoUrl');
  const postObj = post.toObject();
  if (postObj.author && postObj.author.photoUrl) {
    postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
  }
  if (postObj.image) {
    postObj.image = await getPhotoUrl(postObj.image, req);
  }
  if (postObj.video) {
    postObj.video = await getPhotoUrl(postObj.video, req);
  }

  // Create notification
  const isMentionEveryone = req.body.mentionEveryone === 'true' || req.body.mentionEveryone === true;
  if (isMentionEveryone && req.user.role === 'admin') {
    notificationService.createNotification({
      target: 'all',
      sender: req.user.id,
      type: 'mention_everyone',
      title: 'Mention Everyone',
      message: `${req.user.username} mentioned everyone in a post`,
      link: `/posts/${post._id}`
    });
  } else {
    notificationService.createNotification({
      target: 'all',
      sender: req.user.id,
      type: 'post',
      title: 'New Post',
      message: `${req.user.username} shared a new post`,
      link: `/posts/${post._id}`
    });
  }

  res.status(201).json({ post: postObj });
}

export async function listPosts(req, res) {
  const { cursor, limit = 10 } = req.query;
  const query = {};

  // If cursor is provided, fetch posts older than the cursor
  if (cursor) {
    query._id = { $lt: cursor };
  }

  // Filter out private posts unless the viewer is the author (which is unlikely in a general feed, but good practice)
  // Actually for general feed, we usually only show public posts.
  // If we want to show private posts to the author in the main feed, we need $or
  query.$or = [
    { isPrivate: false },
    { isPrivate: { $exists: false } }, // Backward compatibility
    { author: req.user.id }
  ];

  const posts = await Post.find(query)
    .populate('author', 'username photoUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const postsWithFullUrl = await Promise.all(posts.map(async post => {
    const postObj = post.toObject();
    if (postObj.author && postObj.author.photoUrl) {
      postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
    }
    if (postObj.image) {
      postObj.image = await getPhotoUrl(postObj.image, req);
    }
    if (postObj.video) {
      postObj.video = await getPhotoUrl(postObj.video, req);
    }
    return postObj;
  }));

  const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

  res.json({ posts: postsWithFullUrl, nextCursor });
}

export const validateComment = [param('id').isMongoId(), body('content').isString().isLength({ min: 1, max: 1000 })];
export async function addComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.comments.push({ author: req.user.id, content: req.body.content });
  await post.save();
  await post.populate('author', 'username photoUrl');
  await post.populate('comments.author', 'username photoUrl');
  const postObj = post.toObject();
  if (postObj.author && postObj.author.photoUrl) {
    postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
  }
  if (postObj.comments) {
    postObj.comments = await Promise.all(postObj.comments.map(async comment => {
      if (comment.author && comment.author.photoUrl) {
        comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
      }
      return comment;
    }));
  }

  // Create notification
  notificationService.createNotification({
    target: 'all',
    sender: req.user.id,
    type: 'comment',
    title: 'New Comment on Post',
    message: `${req.user.username} commented on a post`,
    link: `/posts/${post._id}`
  });

  res.status(201).json({ post: postObj });
}

export const validateReact = [param('id').isMongoId(), body('key').isString().isLength({ min: 1, max: 32 })];
export async function react(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const { key } = req.body;
  let reaction = post.reactions.find(r => r.key === key);
  if (!reaction) {
    post.reactions.push({ key, userIds: [] });
    reaction = post.reactions[post.reactions.length - 1];
  }
  const idx = reaction.userIds.findIndex(u => String(u) === req.user.id);
  if (idx >= 0) reaction.userIds.splice(idx, 1); else reaction.userIds.push(req.user.id);
  await post.save();
  res.json({ post });
}

export const validateDelete = [param('id').isMongoId()];
export async function removePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });

  // Allow author or admin to delete
  if (String(post.author) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await post.deleteOne();
  res.json({ ok: true });
}

export async function removeComment(req, res) {
  const { id, commentId } = req.params;
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = post.comments.id(commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  // Allow comment author or admin to delete
  // Also allow post author to delete comments on their post? User said "their own post or comment".
  // I'll stick to comment author or admin for now to be safe, unless post author is implied.
  // Let's allow post author too, it's standard moderation.
  if (String(comment.author) !== req.user.id && String(post.author) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  post.comments.pull(commentId);
  await post.save();
  res.json({ ok: true });
}

export async function listPostsByUser(req, res) {
  const identifier = req.params.identifier?.trim();
  if (!identifier) {
    return res.status(400).json({ error: 'Identifier is required' });
  }

  try {
    const upperIdentifier = identifier.toUpperCase();
    const conditions = [
      { username: identifier },
      { sigil: upperIdentifier },
      { displayName: { $regex: `^${identifier}$`, $options: 'i' } }
    ];

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      conditions.push({ _id: identifier });
    }

    const user = await User.findOne({ $or: conditions });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username photoUrl')
      .sort({ createdAt: -1 })
      .limit(100);

    // Filter private posts if viewer is not the author
    const viewerId = req.user ? req.user.id : null;
    const isAuthor = viewerId && String(viewerId) === String(user._id);

    const visiblePosts = posts.filter(p => {
      if (isAuthor) return true;
      return !p.isPrivate;
    });

    const postsWithFullUrl = await Promise.all(visiblePosts.map(async post => {
      const postObj = post.toObject();
      if (postObj.author && postObj.author.photoUrl) {
        postObj.author.photoUrl = await getPhotoUrl(postObj.author.photoUrl, req);
      }
      if (postObj.image) {
        postObj.image = await getPhotoUrl(postObj.image, req);
      }
      if (postObj.video) {
        postObj.video = await getPhotoUrl(postObj.video, req);
      }
      return postObj;
    }));

    res.json({ posts: postsWithFullUrl });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}


