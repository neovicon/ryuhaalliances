import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { updateDisplayName, validateDisplayName, searchUsers, validateSearch, getMe, updatePhoto, updateHeroCard, changePassword, validateChangePassword } from '../controllers/user.controller.js';
import { uploadImage } from '../middleware/upload.js';
import { adjustPoints, leaderboard, validateAdjust, updateRank, validateUpdateRank } from '../controllers/points.controller.js';

const router = Router();
router.get('/me', requireAuth, getMe);
router.patch('/me/display-name', requireAuth, validateDisplayName, updateDisplayName);
router.post('/me/photo', requireAuth, uploadImage.single('photo'), updatePhoto);
router.post('/me/hero-card', requireAuth, uploadImage.single('heroCard'), updateHeroCard);
router.post('/me/change-password', requireAuth, validateChangePassword, changePassword);
router.get('/search', requireAuth, validateSearch, searchUsers);
router.post('/:userId/points', requireAuth, requireAdmin, validateAdjust, adjustPoints);
router.patch('/:userId/rank', requireAuth, requireAdmin, validateUpdateRank, updateRank);
router.get('/leaderboard', requireAuth, leaderboard);
export default router;


