import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getHouseDetails, donate, purchaseItem, undoPurchase, updateCreatureStats } from '../controllers/beastlord.controller.js';

const router = Router();

router.get('/', requireAuth, getHouseDetails);
router.post('/donate', requireAuth, donate);
router.post('/purchase', requireAuth, purchaseItem);
router.post('/undo-purchase/:transactionId', requireAuth, undoPurchase);
router.post('/update-stats', requireAuth, updateCreatureStats);


export default router;
