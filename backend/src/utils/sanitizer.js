/**
 * API Response Sanitization Utilities
 * Prevents sensitive data leakage in API responses
 */

/**
 * Sanitize user data for API responses
 * @param {Object} user - User object from database
 * @returns {Object} - Sanitized user data
 */
export function sanitizeUser(user) {
  if (!user) return null;
  
  const sanitized = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    phone: user.phone,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
  
  // Never expose these sensitive fields
  delete sanitized.passwordHash;
  delete sanitized.adminNotes;
  delete sanitized.blockedAt;
  delete sanitized.blockedUntil;
  delete sanitized.tokenVersion;
  
  return sanitized;
}

/**
 * Sanitize error responses
 * @param {Error} error - Error object
 * @param {boolean} isDev - Whether in development mode
 * @returns {Object} - Sanitized error response
 */
export function sanitizeError(error, isDev = false) {
  const sanitized = {
    error: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // Only expose detailed error information in development
  if (isDev && error) {
    sanitized.details = error.message;
    sanitized.type = error.name;
    // Never expose stack traces in production
    if (process.env.NODE_ENV === 'development') {
      sanitized.stack = error.stack;
    }
  }

  return sanitized;
}

/**
 * Sanitize database validation errors
 * @param {Object} validationError - Sequelize validation error
 * @returns {Object} - User-friendly validation errors
 */
export function sanitizeValidationError(validationError) {
  if (!validationError.errors) {
    return { error: 'VALIDATION_FAILED' };
  }

  const errors = validationError.errors.map(err => ({
    field: err.path,
    message: getGenericValidationMessage(err.validatorKey),
    value: undefined // Never expose the invalid value
  }));

  return { error: 'VALIDATION_FAILED', details: errors };
}

/**
 * Get generic validation messages to avoid exposing system internals
 * @param {string} validatorKey - Sequelize validator key
 * @returns {string} - Generic error message
 */
function getGenericValidationMessage(validatorKey) {
  const messages = {
    notNull: 'This field is required',
    notEmpty: 'This field cannot be empty',
    isEmail: 'Please provide a valid email address',
    len: 'Field length is invalid',
    isUUID: 'Invalid identifier format',
    isIn: 'Invalid value provided',
    unique: 'This value is already in use'
  };

  return messages[validatorKey] || 'Invalid input provided';
}

/**
 * Remove sensitive query parameters from request logs
 * @param {Object} query - Request query parameters
 * @returns {Object} - Sanitized query parameters
 */
export function sanitizeQuery(query) {
  if (!query || typeof query !== 'object') return query;

  const sanitized = { ...query };
  const sensitiveParams = ['token', 'password', 'secret', 'key', 'auth'];
  
  sensitiveParams.forEach(param => {
    if (sanitized[param]) {
      sanitized[param] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Sanitize request body for logging
 * @param {Object} body - Request body
 * @returns {Object} - Sanitized body
 */
export function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'creditCard', 'ssn'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

export default {
  sanitizeUser,
  sanitizeError,
  sanitizeValidationError,
  sanitizeQuery,
  sanitizeRequestBody
};
