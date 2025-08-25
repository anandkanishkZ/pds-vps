import dotenv from 'dotenv';

dotenv.config();

function required(name, value) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV !== 'production';

// Parse origins from comma-separated string
const corsOriginsRaw = process.env.CORS_ORIGIN;
const corsOrigins = (corsOriginsRaw && corsOriginsRaw.split(',').map(s => s.trim()).filter(Boolean))
  || (isDev ? ['http://localhost:5173', 'http://localhost:5174'] : []);
if (!isDev && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must be set in production');
}

const db = {
  host: required('DB_HOST', process.env.DB_HOST),
  port: Number(required('DB_PORT', process.env.DB_PORT)),
  name: required('DB_NAME', process.env.DB_NAME),
  user: required('DB_USER', process.env.DB_USER),
  pass: required('DB_PASS', process.env.DB_PASS),
  ssl: String(process.env.DB_SSL || 'false') === 'true'
};

const jwt = {
  secret: required('JWT_SECRET', process.env.JWT_SECRET),
  expiresIn: process.env.JWT_EXPIRES_IN || '1d'
};

const security = {
  saltRounds: Number(process.env.SALT_ROUNDS || 12),
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 100)
  }
};

const flags = {
  allowDbCreate: String(process.env.ALLOW_DB_CREATE || (isDev ? 'true' : 'false')) === 'true',
  seedAdmin: String(process.env.SEED_ADMIN || 'false') === 'true'
};

const server = {
  // Default to 3001 for local/VPS testing; override with PORT env
  port: Number(process.env.PORT || 3001)
};

export default { NODE_ENV, isDev, corsOrigins, db, jwt, security, flags, server };
