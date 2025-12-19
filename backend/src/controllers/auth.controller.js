import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User, { allowedHouses } from '../models/User.js';
import { signJwt, verifyJwt } from '../utils/jwt.js';
import { getPhotoUrl } from '../utils/photoUrl.js';
import { sendEmail } from '../services/mailer.js';
import * as notificationService from '../services/notification.service.js';

export const validateSignup = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('sigil').notEmpty().withMessage('Sigil code is required'),
  body('house').isIn(allowedHouses).withMessage(`House must be one of: ${allowedHouses.join(', ')}`),
  body('displayName').optional({ nullable: true, checkFalsy: true }).isLength({ max: 64 }).withMessage('Display name must be less than 64 characters'),
];

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: await sanitizeUser(user, req) });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export async function signup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      const field = err.path || err.param;
      const msg = err.msg;
      return `${field}: ${msg}`;
    }).join(', ');
    return res.status(400).json({ error: errorMessages, errors: errors.array() });
  }

  const { email, password, username, sigil, house, displayName } = req.body;

  // Trim and clean up input
  const cleanEmail = email?.trim();
  const cleanUsername = username?.trim();
  const cleanSigil = sigil?.trim();
  const cleanDisplayName = displayName?.trim() || undefined;

  // Only check for approved users - declined/pending users shouldn't block new signups
  // The compound unique indexes (email+status, username+status) prevent duplicates with the same status
  const existing = await User.findOne({
    $or: [{ email: cleanEmail }, { username: cleanUsername }],
    status: 'approved'
  });
  if (existing) return res.status(409).json({ error: 'Email or username already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  // All new signups start as pending (status defaults to 'pending' in the model)
  const user = await User.create({
    email: cleanEmail,
    passwordHash,
    username: cleanUsername,
    sigil: cleanSigil,
    house,
    displayName: cleanDisplayName
  });
  const token = signJwt({ id: user._id, role: user.role, username: user.username });

  // Create notification for admins
  notificationService.createNotification({
    target: 'admins',
    sender: user._id,
    type: 'signup',
    title: 'New User Signup',
    message: `A new user ${user.username} has signed up and is pending approval.`,
    link: `/admin/users` // Assuming there's an admin users page
  });

  return res.status(201).json({ token, user: await sanitizeUser(user, req) });
}

export const validateLogin = [
  body('email').isEmail(),
  body('password').isString(),
];

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

  // Check if user account is approved
  if (user.status === 'pending') {
    const message = user.adminMessage ? ` Message: ${user.adminMessage}` : '';
    return res.status(403).json({
      error: 'Your account is pending approval. Please wait for an admin to review your account.' + message,
      adminMessage: user.adminMessage || null
    });
  }
  if (user.status === 'declined') {
    const message = user.adminMessage ? ` Your account has been declined. Message: ${user.adminMessage}` : ' Your account has been declined.';
    return res.status(403).json({ error: `Account declined.${message}` });
  }

  const token = signJwt({ id: user._id, role: user.role, username: user.username });
  res.json({ token, user: await sanitizeUser(user, req) });
}

export async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    const decoded = verifyJwt(token);
    if (decoded.type !== 'verify') return res.status(400).json({ error: 'Invalid token' });
    await User.findByIdAndUpdate(decoded.id, { emailVerified: true });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
}

export async function resendVerification(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.emailVerified) return res.status(400).json({ error: 'Already verified' });
  const verifyToken = signJwt({ id: user._id, type: 'verify' }, { expiresIn: '24h' });
  const base = process.env.CLIENT_ORIGIN?.replace(/\/$/, '') || 'http://localhost:5173';
  const link = `${base}/verify-email?token=${verifyToken}`;
  await sendEmail({ to: user.email, subject: 'Verify your email', html: `<p>Click <a href="${link}">here</a> to verify your email.</p>` });
  res.json({ ok: true });
}

export async function sanitizeUser(user, req = null) {
  const userObj = user.toObject ? user.toObject() : user;
  const { _id, email, username, displayName, sigil, house, photoUrl, heroCardUrl, points, role, moderatorType, status, adminMessage, rank, memberStatus, emailVerified, createdAt, updatedAt } = userObj;
  return {
    id: _id,
    email,
    username,
    displayName,
    sigil,
    house,
    photoUrl: await getPhotoUrl(photoUrl, req),
    heroCardUrl: await getPhotoUrl(heroCardUrl, req),
    certificates: userObj.certificates ? await Promise.all(userObj.certificates.map(c => getPhotoUrl(c, req))) : [],
    warningNotice: await getPhotoUrl(userObj.warningNotice, req),
    warningText: userObj.warningText,
    points,
    role,
    moderatorType: moderatorType || null,
    status,
    adminMessage,
    rank,
    memberStatus,
    emailVerified: emailVerified || false,
    createdAt,
    updatedAt
  };
}

export async function sendVerificationCode(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

    // Save code to user
    user.emailVerificationCode = code;
    user.emailVerificationCodeExpires = expiresAt;
    await user.save();

    // Send email with code
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #b10f2e 0%, #8b0d26 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .code { background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .code-number { font-size: 32px; font-weight: bold; color: #b10f2e; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Ryuha Alliance</h1>
            </div>
            <div class="content">
              <h2>Email Verification Code</h2>
              <p>Please use the following code to verify your email address:</p>
              <div class="code">
                <div class="code-number">${code}</div>
              </div>
              <p>This code will expire in 15 minutes.</p>
              <div class="footer">
                <p>If you didn't request this code, please ignore this email.</p>
                <p>© ${new Date().getFullYear()} Ryuha Alliance. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Your Email Verification Code',
      html
    });

    res.json({ ok: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}

export async function verifyEmailCode(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    // Check if code exists and is valid
    if (!user.emailVerificationCode) {
      return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
    }

    // Check if code has expired
    if (new Date() > user.emailVerificationCodeExpires) {
      user.emailVerificationCode = undefined;
      user.emailVerificationCodeExpires = undefined;
      await user.save();
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Check if code matches
    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpires = undefined;
    await user.save();

    res.json({ ok: true, message: 'Email verified successfully', user: await sanitizeUser(user, req) });
  } catch (error) {
    console.error('Error verifying email code:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
}

export const validateVerifyEmailCode = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  body('code').matches(/^\d+$/).withMessage('Verification code must contain only numbers'),
];



export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'approved') return res.status(403).json({ error: 'Account not approved' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    user.passwordResetCode = code;
    user.passwordResetExpires = expiresAt;
    await user.save();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #b10f2e 0%, #8b0d26 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .code { background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .code-number { font-size: 32px; font-weight: bold; color: #b10f2e; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Ryuha Alliance</h1>
            </div>
            <div class="content">
              <h2>Password Reset Code</h2>
              <p>You requested to reset your password. Use the following code:</p>
              <div class="code">
                <div class="code-number">${code}</div>
              </div>
              <p>This code will expire in 15 minutes.</p>
              <div class="footer">
                <p>If you didn't request this, please ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Code',
      html
    });

    res.json({ ok: true, message: 'Reset code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset code' });
  }
}

export async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email, status: 'approved' });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.passwordResetCode || user.passwordResetCode !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }
    if (new Date() > user.passwordResetExpires) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email, status: 'approved' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.passwordResetCode || user.passwordResetCode !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }
    if (new Date() > user.passwordResetExpires) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

export async function sendLoginLink(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'approved') return res.status(403).json({ error: 'Account not approved' });

    const token = signJwt({ id: user._id, type: 'login-link' }, { expiresIn: '15m' });
    const base = process.env.CLIENT_ORIGIN?.replace(/\/$/, '') || 'http://localhost:5173';
    const link = `${base}/login?token=${token}&action=magic-login`;

    const html = `
      <p>Click <a href="${link}">here</a> to login to your account.</p>
      <p>This link expires in 15 minutes.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Login Link',
      html
    });

    res.json({ ok: true, message: 'Login link sent to your email' });
  } catch (error) {
    console.error('Send login link error:', error);
    res.status(500).json({ error: 'Failed to send login link' });
  }
}

export async function verifyLoginLink(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    if (decoded.type !== 'login-link') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Account not approved' });
    }

    const authToken = signJwt({ id: user._id, role: user.role, username: user.username });
    res.json({ token: authToken, user: await sanitizeUser(user, req) });
  } catch (error) {
    console.error('Verify login link error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}
