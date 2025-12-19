import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMessages } from '../controllers/message.controller.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getMessages);

export default router;
