import { Router } from 'express';
import { requireAuth, requireAestherOrVigilOrOverseer } from '../middleware/auth.js';
import multer from 'multer';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';
import { createArticle, listArticles, getArticleById, addComment, updateArticle, deleteArticle, validateCreateArticle, validateGetArticle, validateAddComment, validateUpdateArticle, validateDeleteArticle } from '../controllers/article.controller.js';

const router = Router();

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File is too large, only 30MB is accepted' });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

router.get('/', listArticles);
router.get('/:id', validateGetArticle, getArticleById);
router.post('/:id/comments', requireAuth, validateAddComment, addComment);
router.post('/', requireAuth, requireAestherOrVigilOrOverseer, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
  if (req.file) req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  next();
}, validateCreateArticle, createArticle);
router.put('/:id', requireAuth, requireAestherOrVigilOrOverseer, uploadImage.single('image'), handleMulterError, uploadToStorage, async (req, res, next) => {
  if (req.file) req.body.imageUrl = req.file.storagePath || `/uploads/${req.file.filename}`;
  next();
}, validateUpdateArticle, updateArticle);
router.delete('/:id', requireAuth, requireAestherOrVigilOrOverseer, validateDeleteArticle, deleteArticle);

export default router;
