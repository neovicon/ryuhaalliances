import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getPendingUsers, approveUser, declineUser, sendMessageToUser, validateApproveUser, validateDeclineUser, validateSendMessage, getAllUsers, updateHouse, validateUpdateHouse, addModerator, validateAddModerator, removeUser, validateRemoveUser } from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication and admin role
router.get('/pending-users', requireAuth, requireAdmin, getPendingUsers);
router.get('/all-users', requireAuth, requireAdmin, getAllUsers);
router.post('/approve-user', requireAuth, requireAdmin, validateApproveUser, approveUser);
router.post('/decline-user', requireAuth, requireAdmin, validateDeclineUser, declineUser);
router.post('/send-message', requireAuth, requireAdmin, validateSendMessage, sendMessageToUser);
router.post('/update-house', requireAuth, requireAdmin, validateUpdateHouse, updateHouse);
router.post('/add-moderator', requireAuth, requireAdmin, validateAddModerator, addModerator);
router.delete('/user/:userId', requireAuth, requireAdmin, validateRemoveUser, removeUser);

export default router;

