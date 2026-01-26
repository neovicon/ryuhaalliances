import jwt from 'jsonwebtoken';

export function signJwt(payload, options = {}) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign(payload, secret, { expiresIn: '7d', ...options });
}

export function verifyJwt(token) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.verify(token, secret);
}


