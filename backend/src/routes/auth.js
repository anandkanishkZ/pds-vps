import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import config from '../config.js';

const router = express.Router();

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;

router.post(
  '/register',
  [
    body('name').isString().isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, config.security.saltRounds);
      const user = await User.create({ name, email, passwordHash, role: 'admin' });

      return res.status(201).json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
      // Secure error logging - never log sensitive data
      console.error('Registration error:', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        email: email ? email.substring(0, 3) + '***' : 'unknown',
        error: err.name
      });
      return res.status(500).json({ error: 'REGISTRATION_FAILED' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      if (user.status === 'blocked') {
        let remaining = null;
        if (user.blockedUntil && user.blockedUntil > new Date()) {
          remaining = Math.max(0, Math.floor((user.blockedUntil.getTime() - Date.now())/1000));
        }
        return res.status(403).json({ message: 'Account is blocked. Contact support.', remainingBlockSeconds: remaining });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  // Update last login time (skip if blocked - already returned)
  await user.update({ lastLoginAt: new Date() });

      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      // Secure error logging - never log the full error object
      console.error('Login error:', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        email: email ? email.substring(0, 3) + '***' : 'unknown',
        error: err.name
      });
      return res.status(500).json({ error: 'AUTHENTICATION_FAILED' });
    }
  }
);

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: JWT_EXPIRES_IN
    });
    
    // Validate token expiry explicitly
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    }
    
    req.user = payload;
    next();
  } catch (err) {
    // Log security event without sensitive data
    console.warn('Authentication failed:', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent'),
      error: err.name,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}

export default router;
