import { body, validationResult, param, query } from 'express-validator';
import Blog from '../models/Blog.js';

export const validateCreateBlog = [ body('title').isString().isLength({ min: 1, max: 200 }), body('content').isString().isLength({ min: 1 }) ];
export async function createBlog(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const blog = await Blog.create({ title: req.body.title, content: req.body.content, author: req.user.id });
  res.status(201).json({ blog });
}

export const validateListBlogs = [ query('archived').optional().isBoolean().toBoolean() ];
export async function listBlogs(req, res) {
  const archived = req.query.archived ?? false;
  const blogs = await Blog.find({ archived }).populate('author', 'username').sort({ createdAt: -1 });
  res.json({ blogs });
}

export const validateArchive = [ param('id').isMongoId(), body('archived').isBoolean() ];
export async function setArchived(req, res) {
  const blog = await Blog.findByIdAndUpdate(req.params.id, { archived: req.body.archived }, { new: true });
  if (!blog) return res.status(404).json({ error: 'Not found' });
  res.json({ blog });
}

export const validateDeleteBlog = [ param('id').isMongoId() ];
export async function deleteBlog(req, res) {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Not found' });
  await blog.deleteOne();
  res.json({ ok: true });
}


