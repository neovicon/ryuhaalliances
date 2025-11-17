import { Router } from 'express';
import { requireAuth, requireAdmin, requireVigil } from '../middleware/auth.js';
import { createBlog, deleteBlog, listBlogs, setArchived, validateArchive, validateCreateBlog, validateDeleteBlog, validateListBlogs } from '../controllers/blog.controller.js';

const router = Router();
router.get('/', requireAuth, validateListBlogs, listBlogs);
router.post('/', requireAuth, requireVigil, validateCreateBlog, createBlog);
router.patch('/:id/archive', requireAuth, requireVigil, validateArchive, setArchived);
router.delete('/:id', requireAuth, requireVigil, validateDeleteBlog, deleteBlog);
export default router;


