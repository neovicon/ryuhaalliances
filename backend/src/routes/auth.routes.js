import { Router } from 'express';
import { login, signup, validateLogin, validateSignup, verifyEmail, resendVerification, sendVerificationCode, verifyEmailCode, validateVerifyEmailCode } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { getMe } from "../controllers/auth.controller.js";


const router = Router();
router.get('/me', requireAuth, getMe);
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/verify', verifyEmail);
router.post('/resend-verification', requireAuth, resendVerification);
router.post('/send-verification-code', requireAuth, sendVerificationCode);
router.post('/verify-email-code', requireAuth, validateVerifyEmailCode, verifyEmailCode);
export default router;


