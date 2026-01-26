import { Router } from 'express';
import { login, signup, validateLogin, validateSignup, verifyEmail, resendVerification, sendVerificationCode, verifyEmailCode, validateVerifyEmailCode, forgotPassword, verifyResetCode, resetPassword, sendLoginLink, verifyLoginLink } from '../controllers/auth.controller.js';
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

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/send-login-link', sendLoginLink);
router.post('/verify-login-link', verifyLoginLink);

export default router;
