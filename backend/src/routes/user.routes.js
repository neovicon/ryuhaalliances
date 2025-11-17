import { Router } from 'express';
import { requireAuth, requireAdmin, requireArtisan, requireArbiter } from '../middleware/auth.js';
import { updateDisplayName, validateDisplayName, searchUsers, validateSearch, getMe, updatePhoto, updateHeroCard, deleteHeroCard, changePassword, validateChangePassword, getPublicProfile, validatePublicProfile, publicSearch, validatePublicSearch, updateMemberHeroCard, validateUpdateMemberHeroCard, uploadCertificate, validateUploadCertificate, uploadWarningNotice, validateUploadWarningNotice } from '../controllers/user.controller.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';
import { adjustPoints, leaderboard, validateAdjust, updateRank, validateUpdateRank } from '../controllers/points.controller.js';

const router = Router();
router.get('/public/profile', validatePublicProfile, getPublicProfile);
router.get('/public/search', validatePublicSearch, publicSearch);
router.get('/me', requireAuth, getMe);
router.patch('/me/display-name', requireAuth, validateDisplayName, updateDisplayName);
router.post('/me/photo', requireAuth, uploadImage.single('photo'), uploadToStorage, updatePhoto);
router.post('/me/hero-card', requireAuth, uploadImage.single('heroCard'), uploadToStorage, updateHeroCard);
router.delete('/me/hero-card', requireAuth, deleteHeroCard);
router.post('/me/change-password', requireAuth, validateChangePassword, changePassword);
router.get('/search', requireAuth, validateSearch, searchUsers);
router.post('/:userId/points', requireAuth, requireAdmin, validateAdjust, adjustPoints);
router.patch('/:userId/rank', requireAuth, requireAdmin, validateUpdateRank, updateRank);
router.get('/leaderboard', requireAuth, leaderboard);

// Artisan routes: Modify Hero License and upload Certificates for members
router.post('/:userId/hero-card', requireAuth, requireArtisan, validateUpdateMemberHeroCard, uploadImage.single('heroCard'), uploadToStorage, updateMemberHeroCard);
router.post('/:userId/certificate', requireAuth, requireArtisan, validateUploadCertificate, uploadImage.single('certificate'), uploadToStorage, uploadCertificate);

// Arbiter routes: Upload warning notice for members (image optional, text optional, but at least one required)
router.post('/:userId/warning-notice', requireAuth, requireArbiter, uploadImage.single('warningNotice'), uploadToStorage, validateUploadWarningNotice, uploadWarningNotice);

export default router;


