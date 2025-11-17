import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireVigil } from '../middleware/auth.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';
import {
	createBlog,
	deleteBlog,
	listBlogs,
	setArchived,
	validateArchive,
	validateCreateBlog,
	validateDeleteBlog,
	validateListBlogs,
	validateUpdateBlog,
	updateBlog,
	validateGetBlog,
	getBlogById,
	validateAddComment,
	addComment
} from '../controllers/blog.controller.js';

const router = Router();

// Error handler for multer file size errors
const handleMulterError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ error: 'File is too large, only 30MB is accepted' });
		}
		return res.status(400).json({ error: err.message });
	}
	if (err) {
		return res.status(400).json({ error: err.message });
	}
	next();
};

router.get('/', listBlogs);
// GET by id (specific) must come before POST/PUT/DELETE
router.get('/:id', validateGetBlog, getBlogById);

router.post('/', requireAuth, requireVigil, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
	if (req.file) {
		req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
	}
	next();
}, validateCreateBlog, createBlog);

router.put('/:id', requireAuth, requireVigil, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
	if (req.file) {
		req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
	}
	next();
}, validateUpdateBlog, updateBlog);

router.delete('/:id', requireAuth, requireVigil, validateDeleteBlog, deleteBlog);
router.patch('/:id/archive', requireAuth, requireVigil, validateArchive, setArchived);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);

export default router;


