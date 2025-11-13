import { Router } from 'express';
import { login, signup, validateLogin, validateSignup, verifyEmail, resendVerification } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/verify', verifyEmail);
router.post('/resend-verification', requireAuth, resendVerification);
export default router;


