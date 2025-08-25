/**
 * Secure logging utility to prevent sensitive data leakage
 */

const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'token', 'secret', 'authorization', 
  'cookie', 'session', 'key', 'private', 'auth', 'credential'
];

/**
 * Sanitize log data by removing or masking sensitive information
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data
 */
export function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (key === 'email' && typeof value === 'string') {
      // Partially mask email addresses
      const [local, domain] = value.split('@');
      sanitized[key] = local ? `${local.substring(0, 2)}***@${domain}` : '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Secure logger wrapper
 */
export const secureLogger = {
  info: (message, data = {}) => {
    console.info(message, sanitizeLogData(data));
  },
  
  warn: (message, data = {}) => {
    console.warn(message, sanitizeLogData(data));
  },
  
  error: (message, data = {}) => {
    const sanitized = sanitizeLogData(data);
    console.error(message, {
      ...sanitized,
      timestamp: new Date().toISOString()
    });
  },
  
  security: (event, data = {}) => {
    console.warn(`[SECURITY] ${event}`, {
      ...sanitizeLogData(data),
      timestamp: new Date().toISOString(),
      level: 'SECURITY'
    });
  }
};

export default secureLogger;
