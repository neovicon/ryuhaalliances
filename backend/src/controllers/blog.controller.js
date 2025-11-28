import { body, validationResult, param, query } from 'express-validator';
import Blog from '../models/Blog.js';
import { getPhotoUrl } from '../utils/photoUrl.js';

export const validateCreateBlog = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
];

export async function createBlog(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, content, imageUrl } = req.body;
    const blog = await Blog.create({
      title,
      content,
      imageUrl: imageUrl || null,
      createdBy: req.user.id,
      lastEditedBy: req.user.id,
    });

    await blog.populate('createdBy', 'username displayName');
    await blog.populate('lastEditedBy', 'username displayName');

    const blogObj = blog.toObject();
    if (blogObj.imageUrl) {
      blogObj.imageUrl = await getPhotoUrl(blogObj.imageUrl, req);
    }
    const { _id, ...rest } = blogObj;
    res.status(201).json({ blog: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
}

export const validateListBlogs = [query('archived').optional().isBoolean().toBoolean()];
export async function listBlogs(req, res) {
  try {
    const archived = req.query.archived ?? false;
    const blogs = await Blog.find({ archived })
      .populate('createdBy', 'username displayName')
      .populate('lastEditedBy', 'username displayName')
      .sort({ createdAt: -1 });

    const blogsWithFullUrl = await Promise.all(blogs.map(async blog => {
      const blogObj = blog.toObject();
      if (blogObj.imageUrl) {
        blogObj.imageUrl = await getPhotoUrl(blogObj.imageUrl, req);
      }
      const { _id, ...rest } = blogObj;
      return { id: _id, ...rest };
    }));

    res.json({ blogs: blogsWithFullUrl });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
}

export const validateUpdateBlog = [
  param('id').isMongoId(),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
];

export async function updateBlog(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const { title, content, imageUrl } = req.body;

    const updateData = { lastEditedBy: req.user.id };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'username displayName')
      .populate('lastEditedBy', 'username displayName');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const blogObj = blog.toObject();
    if (blogObj.imageUrl) {
      blogObj.imageUrl = await getPhotoUrl(blogObj.imageUrl, req);
    }
    const { _id, ...rest } = blogObj;
    res.json({ blog: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
}

export const validateDeleteBlog = [param('id').isMongoId()];
export async function deleteBlog(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
}

export const validateArchive = [param('id').isMongoId(), body('archived').isBoolean()];
export async function setArchived(req, res) {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, { archived: req.body.archived }, { new: true });
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json({ blog });
  } catch (error) {
    console.error('Error setting archived on blog:', error);
    res.status(500).json({ error: 'Failed to update archive status' });
  }
}

export const validateGetBlog = [param('id').isMongoId().withMessage('Invalid blog ID')];
export async function getBlogById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const blog = await Blog.findById(id)
      .populate('createdBy', 'username displayName photoUrl')
      .populate('lastEditedBy', 'username displayName')
      .populate('comments.author', 'username displayName photoUrl');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const blogObj = blog.toObject();
    if (blogObj.imageUrl) {
      blogObj.imageUrl = await getPhotoUrl(blogObj.imageUrl, req);
    }
    if (blogObj.createdBy && blogObj.createdBy.photoUrl) {
      blogObj.createdBy.photoUrl = await getPhotoUrl(blogObj.createdBy.photoUrl, req);
    }
    if (blogObj.comments) {
      blogObj.comments = await Promise.all(blogObj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) {
          comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        }
        return comment;
      }));
    }
    const { _id, ...rest } = blogObj;
    res.json({ blog: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error fetching blog:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid blog ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch blog' });
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
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.comments.push({
      author: req.user.id,
      content: req.body.content,
    });

    await blog.save();
    await blog.populate('createdBy', 'username displayName photoUrl');
    await blog.populate('lastEditedBy', 'username displayName');
    await blog.populate('comments.author', 'username displayName photoUrl');

    const blogObj = blog.toObject();
    if (blogObj.imageUrl) {
      blogObj.imageUrl = await getPhotoUrl(blogObj.imageUrl, req);
    }
    if (blogObj.createdBy && blogObj.createdBy.photoUrl) {
      blogObj.createdBy.photoUrl = await getPhotoUrl(blogObj.createdBy.photoUrl, req);
    }
    if (blogObj.comments) {
      blogObj.comments = await Promise.all(blogObj.comments.map(async comment => {
        if (comment.author && comment.author.photoUrl) {
          comment.author.photoUrl = await getPhotoUrl(comment.author.photoUrl, req);
        }
        return comment;
      }));
    }
    const { _id, ...rest } = blogObj;
    res.status(201).json({ blog: { id: _id, ...rest } });
  } catch (error) {
    console.error('Error adding comment to blog:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export const validateReact = [param('id').isMongoId(), body('key').isString().isLength({ min: 1, max: 32 })];

export async function react(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    const { key } = req.body;
    let reaction = blog.reactions.find(r => r.key === key);
    if (!reaction) {
      reaction = { key, userIds: [] };
      blog.reactions.push(reaction);
    }
    const idx = reaction.userIds.findIndex(u => String(u) === req.user.id);
    if (idx >= 0) reaction.userIds.splice(idx, 1); else reaction.userIds.push(req.user.id);
    await blog.save();
    res.json({ blog });
  } catch (err) {
    console.error('Error reacting to blog:', err);
    res.status(500).json({ error: 'Failed to react' });
  }
}


