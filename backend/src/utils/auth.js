import jwt from 'jsonwebtoken';
import config from '../config.js';
import { User } from '../models/index.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
        maxAge: config.jwt.expiresIn
      });
      
      // Validate token expiry explicitly
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ error: 'TOKEN_EXPIRED' });
      }
      
      // Fetch user from database to ensure they still exist and are active
      // JWT payload uses 'sub' for user ID
      const userId = decoded.sub || decoded.id;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'name', 'role', 'status']
      });
      
      if (!user) {
        return res.status(401).json({ error: 'USER_NOT_FOUND' });
      }

      if (user.status === 'blocked' || user.status === 'inactive') {
        return res.status(403).json({ error: 'ACCOUNT_BLOCKED' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
  } catch (error) {
    // Secure error logging without sensitive data
    console.error('Auth middleware error:', { 
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.name
    });
    return res.status(500).json({ error: 'AUTHENTICATION_ERROR' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};
