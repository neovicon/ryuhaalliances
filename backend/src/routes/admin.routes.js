import { Router } from 'express';
import { requireAuth, requireAdmin, requireGatekeeper, requireArbiter } from '../middleware/auth.js';
import { getPendingUsers, approveUser, declineUser, sendMessageToUser, validateApproveUser, validateDeclineUser, validateSendMessage, getAllUsers, searchUsers, updateHouse, validateUpdateHouse, addModerator, validateAddModerator, removeUser, validateRemoveUser, updateMemberStatus, validateUpdateMemberStatus, getHouseMembers, getHouse, getAllHouses, updateHouseDetails, validateUpdateHouseDetails, updateUsername, validateUpdateUsername, updateDisplayName, validateUpdateDisplayName, removeModerator, validateRemoveModerator, updateEmail, validateUpdateEmail } from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication and admin role
router.get('/pending-users', requireAuth, requireGatekeeper, getPendingUsers);
router.get('/all-users', requireAuth, requireAdmin, getAllUsers);
router.get('/search-users', requireAuth, requireAdmin, searchUsers);
router.post('/approve-user', requireAuth, requireGatekeeper, validateApproveUser, approveUser);
router.post('/decline-user', requireAuth, requireAdmin, validateDeclineUser, declineUser);
router.post('/send-message', requireAuth, requireAdmin, validateSendMessage, sendMessageToUser);
router.post('/update-house', requireAuth, requireAdmin, validateUpdateHouse, updateHouse);
router.post('/update-member-status', requireAuth, requireAdmin, validateUpdateMemberStatus, updateMemberStatus);
router.post('/add-moderator', requireAuth, requireAdmin, validateAddModerator, addModerator);
router.delete('/user/:userId', requireAuth, requireArbiter, validateRemoveUser, removeUser);
router.get('/house-members', getHouseMembers);
router.get('/house', getHouse);
router.get('/all-houses', requireAuth, requireAdmin, getAllHouses);
router.post('/update-house-details', requireAuth, requireAdmin, validateUpdateHouseDetails, updateHouseDetails);
router.post('/update-username', requireAuth, requireAdmin, validateUpdateUsername, updateUsername);
router.post('/update-display-name', requireAuth, requireAdmin, validateUpdateDisplayName, updateDisplayName);
router.post('/remove-moderator', requireAuth, requireAdmin, validateRemoveModerator, removeModerator);
router.post('/update-email', requireAuth, requireAdmin, validateUpdateEmail, updateEmail);

export default router;

