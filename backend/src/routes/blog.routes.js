import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createBlog, deleteBlog, listBlogs, setArchived, validateArchive, validateCreateBlog, validateDeleteBlog, validateListBlogs } from '../controllers/blog.controller.js';

const router = Router();
router.get('/', requireAuth, validateListBlogs, listBlogs);
router.post('/', requireAuth, requireAdmin, validateCreateBlog, createBlog);
router.patch('/:id/archive', requireAuth, requireAdmin, validateArchive, setArchived);
router.delete('/:id', requireAuth, requireAdmin, validateDeleteBlog, deleteBlog);
export default router;


