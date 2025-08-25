import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { secureLogger } from './secureLogger.js';

/**
 * Create enhanced rate limiter with security logging
 */
function createSecureRateLimit(options) {
  const { windowMs, max, message, skipSuccessfulRequests = false } = options;
  
  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      secureLogger.security('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
      
      res.status(429).json({ 
        error: 'TOO_MANY_REQUESTS',
        message: message || 'Too many requests, please try again later',
        retryAfter: Math.round(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/ping';
    }
  });
}

// Auth endpoints - very strict limits
export const authLimiter = createSecureRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true
});

// Contact form - prevent spam
export const contactLimiter = createSecureRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 submissions per hour
  message: 'Too many contact form submissions'
});

// API endpoints - moderate limits
export const apiLimiter = createSecureRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'API rate limit exceeded'
});

// Upload endpoints - strict limits
export const uploadLimiter = createSecureRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Upload rate limit exceeded'
});

// Progressive slowdown for repeated requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per window at full speed
  delayMs: () => 500, // Fixed delay of 500ms per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  validate: { delayMs: false } // Disable deprecation warning
});

/**
 * Request size limiter middleware
 */
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSizeBytes = typeof maxSize === 'string' 
      ? parseSize(maxSize) 
      : maxSize;
    
    if (contentLength > maxSizeBytes) {
      secureLogger.security('Request size limit exceeded', {
        ip: req.ip,
        contentLength,
        maxSize: maxSizeBytes,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(413).json({
        error: 'REQUEST_TOO_LARGE',
        message: 'Request size exceeds maximum allowed'
      });
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const [, num, unit] = match;
  return parseInt(num) * (units[unit] || 1);
}

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  
  next();
};

export default {
  authLimiter,
  contactLimiter,
  apiLimiter,
  uploadLimiter,
  speedLimiter,
  requestSizeLimiter,
  securityHeaders
};
