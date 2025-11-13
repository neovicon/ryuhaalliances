import { body, validationResult, param } from 'express-validator';
import Post from '../models/Post.js';
import { getPhotoUrl } from '../utils/photoUrl.js';

export const validateCreatePost = [ body('content').isString().isLength({ min: 1, max: 2000 }) ];
export async function createPost(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const post = await Post.create({ author: req.user.id, content: req.body.content });
  await post.populate('author', 'username photoUrl');
  const postObj = post.toObject();
  if (postObj.author && postObj.author.photoUrl) {
    postObj.author.photoUrl = getPhotoUrl(postObj.author.photoUrl, req);
  }
  res.status(201).json({ post: postObj });
}

export async function listPosts(req, res) {
  const posts = await Post.find({}).populate('author', 'username photoUrl').sort({ createdAt: -1 }).limit(100);
  const postsWithFullUrl = posts.map(post => {
    const postObj = post.toObject();
    if (postObj.author && postObj.author.photoUrl) {
      postObj.author.photoUrl = getPhotoUrl(postObj.author.photoUrl, req);
    }
    return postObj;
  });
  res.json({ posts: postsWithFullUrl });
}

export const validateComment = [ param('id').isMongoId(), body('content').isString().isLength({ min: 1, max: 1000 }) ];
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
    postObj.author.photoUrl = getPhotoUrl(postObj.author.photoUrl, req);
  }
  if (postObj.comments) {
    postObj.comments = postObj.comments.map(comment => {
      if (comment.author && comment.author.photoUrl) {
        comment.author.photoUrl = getPhotoUrl(comment.author.photoUrl, req);
      }
      return comment;
    });
  }
  res.status(201).json({ post: postObj });
}

export const validateReact = [ param('id').isMongoId(), body('key').isString().isLength({ min: 1, max: 32 }) ];
export async function react(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const { key } = req.body;
  let reaction = post.reactions.find(r => r.key === key);
  if (!reaction) {
    reaction = { key, userIds: [] };
    post.reactions.push(reaction);
  }
  const idx = reaction.userIds.findIndex(u => String(u) === req.user.id);
  if (idx >= 0) reaction.userIds.splice(idx, 1); else reaction.userIds.push(req.user.id);
  await post.save();
  res.json({ post });
}

export const validateDelete = [ param('id').isMongoId() ];
export async function removePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.deleteOne();
  res.json({ ok: true });
}


