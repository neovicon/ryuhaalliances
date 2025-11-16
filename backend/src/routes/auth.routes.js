import { Router } from 'express';
import { login, signup, validateLogin, validateSignup, verifyEmail, resendVerification, sendVerificationCode, verifyEmailCode, validateVerifyEmailCode } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/verify', verifyEmail);
router.post('/resend-verification', requireAuth, resendVerification);
router.post('/send-verification-code', requireAuth, sendVerificationCode);
router.post('/verify-email-code', requireAuth, validateVerifyEmailCode, verifyEmailCode);
export default router;


