import { Router } from 'express';
import { requireAuth, requireAdmin, requireArtisan, requireArbiter, requireArbiterOrAdmin, requireArtisanOrAdmin } from '../middleware/auth.js';
import {
  updateDisplayName,
  validateDisplayName,
  searchUsers,
  validateSearch,
  getMe,
  updatePhoto,
  updateHeroCard,
  deleteHeroCard,
  changePassword,
  validateChangePassword,
  getPublicProfile,
  validatePublicProfile,
  publicSearch,
  validatePublicSearch,
  updateMemberHeroCard,
  validateUpdateMemberHeroCard,
  uploadCertificate,
  validateUploadCertificate,
  uploadWarningNotice,
  validateUploadWarningNotice,
  removeWarningNotice,
  getHouses,
  getUsersByHouse,
  deleteCertificate,
  validateDeleteCertificate
} from '../controllers/user.controller.js';
import { uploadImage, uploadToStorage } from '../middleware/upload.js';
import { adjustPoints, leaderboard, validateAdjust, updateRank, validateUpdateRank } from '../controllers/points.controller.js';
import multer from 'multer';

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

router.get('/public/profile', validatePublicProfile, getPublicProfile);
router.get('/public/search', validatePublicSearch, publicSearch);
router.get('/me', requireAuth, getMe);
router.patch('/me/display-name', requireAuth, validateDisplayName, updateDisplayName);
router.post('/me/photo', requireAuth, uploadImage.single('photo'), handleMulterError, uploadToStorage, updatePhoto);
router.post('/me/hero-card', requireAuth, uploadImage.single('heroCard'), handleMulterError, uploadToStorage, updateHeroCard);
router.delete('/me/hero-card', requireAuth, deleteHeroCard);
router.post('/me/change-password', requireAuth, validateChangePassword, changePassword);
router.get('/search', requireAuth, validateSearch, searchUsers);
router.get('/houses', requireAuth, getHouses);

// New route to get users by house
router.get('/by-house/:house', getUsersByHouse);

router.post('/:userId/points', requireAuth, requireAdmin, validateAdjust, adjustPoints);
router.patch('/:userId/rank', requireAuth, requireAdmin, validateUpdateRank, updateRank);
router.get('/leaderboard', requireAuth, leaderboard);

// Artisan routes: Modify Hero License and upload Certificates for members
router.post('/:userId/hero-card', requireAuth, requireArtisan, validateUpdateMemberHeroCard, uploadImage.single('heroCard'), handleMulterError, uploadToStorage, updateMemberHeroCard);
router.post('/:userId/certificate', requireAuth, requireArtisan, validateUploadCertificate, uploadImage.single('certificate'), handleMulterError, uploadToStorage, uploadCertificate);
router.delete('/:userId/certificate', requireAuth, requireArtisanOrAdmin, validateDeleteCertificate, deleteCertificate);

// Arbiter routes: Upload warning notice for members (image optional, text optional, but at least one required)
router.post('/:userId/warning-notice', requireAuth, requireArbiter, uploadImage.single('warningNotice'), handleMulterError, uploadToStorage, validateUploadWarningNotice, uploadWarningNotice);
// Allow Arbiter or Admin to remove warnings
router.delete('/:userId/warning-notice', requireAuth, requireArbiterOrAdmin, validateUploadWarningNotice, removeWarningNotice);

export default router;