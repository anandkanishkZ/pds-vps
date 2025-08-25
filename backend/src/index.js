import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import config from './config.js';
import { sequelize } from './models/index.js';
import { ensureDatabaseExists, seedAdminUser } from './utils/initDb.js';
import { authLimiter, contactLimiter, apiLimiter, uploadLimiter, speedLimiter, requestSizeLimiter, securityHeaders } from './utils/security.js';
import { secureLogger } from './utils/secureLogger.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import usersRoutes from './routes/users.js';
import productsRoutes from './routes/products.js';
import mediaRoutes from './routes/media.js';
import inquiriesRoutes from './routes/inquiries.js';
import dealershipInquiriesRoutes from './routes/dealershipInquiries.js';
import galleryRoutes from './routes/gallery.js';
import careersRoutes from './routes/careers.js';
import leadershipRoutes from './routes/leadership.js';
import sitemapRoutes from './routes/sitemap.js';
import heroSlidesRoutes from './routes/heroSlides.js';

dotenv.config();

const app = express();

// Trust proxy for proper IP detection behind load balancers/proxies
app.set('trust proxy', 1);

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use(securityHeaders);

// Request size limiting
app.use(requestSizeLimiter('10mb'));

// Progressive speed limiting
app.use(speedLimiter);

// CORS whitelist with enhanced security
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = config.corsOrigins.includes(origin);
      if (!ok) {
        secureLogger.security('CORS violation attempt', {
          origin,
          allowed: config.corsOrigins
        });
      }
      cb(ok ? null : new Error('Not allowed by CORS'), ok);
    },
    credentials: true,
  })
);

// Enhanced JSON parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Static uploads (avatars)
// Serve uploads with permissive CORP so frontend (different origin) can load images
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Apply rate limiting to different route groups
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/products', apiLimiter, productsRoutes);
app.use('/api/media', uploadLimiter, mediaRoutes);
// NOTE: Do NOT wrap entire inquiries router with contactLimiter; POST / (public form)
// is already protected inside inquiries.js by its own contactFormLimiter + strictContactLimiter.
// Applying contactLimiter globally caused 429 for authenticated admin GET listing & stats.
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/dealership-inquiries', dealershipInquiriesRoutes);
app.use('/api/gallery', apiLimiter, galleryRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/leadership', leadershipRoutes);
app.use('/api/hero-slides', apiLimiter, heroSlidesRoutes);
// Public dynamic sitemap (not rate limited heavily to allow bots)
app.use('/', sitemapRoutes);

// Global error handler - must be last middleware
app.use((err, req, res, next) => {
  // Log error securely without sensitive data
  secureLogger.error('Unhandled error:', {
    error: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Don't expose internal errors in production
  if (config.isDev) {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack
    });
  } else {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    });
  }
});

// Handle 404 routes
app.use('*', (req, res) => {
  secureLogger.warn('Route not found:', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  });
});

const PORT = config.server.port;

async function start() {
  try {
    // Ensure DB exists only when allowed (true by default in dev)
    if (config.flags.allowDbCreate) {
      await ensureDatabaseExists();
    }

  await sequelize.authenticate();
  // Note: schema is managed via migrations; do not sync in production

    if (config.flags.seedAdmin) {
      await seedAdminUser();
    }

  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
      secureLogger.info(`Server started successfully`, {
    host: HOST,
    port: PORT,
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    secureLogger.error('Failed to start server:', {
      error: err.name,
      message: err.message
    });
    process.exit(1);
  }
}

start();
