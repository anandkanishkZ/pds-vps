import express from 'express';
import { ProductCategory, Product } from '../models/index.js';

// In-memory cache to avoid rebuilding the sitemap too often
let cachedXml = null;
let cachedAt = 0;
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const router = express.Router();

// Helper to build absolute URL
function abs(req, path) {
  // Support proxy (trust proxy enabled in index.js)
  const proto = req.protocol;
  const host = req.get('host');
  return `${proto}://${host}${path}`;
}

// Static public routes to always include
const staticRoutes = [
  '/',
  '/about',
  '/products',
  '/gallery',
  '/career',
  '/dealership-inquiry',
  '/contact',
  '/privacy',
  '/terms'
];

router.get('/sitemap.xml', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedXml && (now - cachedAt) < TTL_MS) {
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600'); // clients can cache for 1h
      return res.send(cachedXml);
    }

    // Fetch categories (active + coming soon separately) and active products
    const [categories, products] = await Promise.all([
      ProductCategory.findAll({ order: [['sortOrder','ASC'], ['name','ASC']] }),
      Product.findAll({ where: { isActive: true }, order: [['updatedAt','DESC']] })
    ]);

    // Build URL entries
    const urls = [];

    const isoDate = (d) => new Date(d).toISOString().split('T')[0];
    const today = isoDate(new Date());

    // Static pages
    for (const route of staticRoutes) {
      urls.push({ loc: abs(req, route), lastmod: today, changefreq: 'monthly', priority: '0.6' });
    }

    // Categories
    for (const cat of categories) {
      if (cat.status === 'archived') continue; // skip archived
      const loc = abs(req, `/products/category/${cat.slug}`);
      urls.push({
        loc,
        lastmod: isoDate(cat.updatedAt || cat.createdAt || new Date()),
        changefreq: cat.status === 'coming_soon' ? 'weekly' : 'weekly',
        priority: cat.status === 'coming_soon' ? '0.4' : '0.7'
      });
    }

    // Products
    for (const p of products) {
      // Category may be archived; safer to ensure find associated category in memory
      const cat = categories.find(c => c.id === p.categoryId);
      if (cat && cat.status === 'archived') continue;
      urls.push({
        loc: abs(req, `/products/item/${p.slug}`),
        lastmod: isoDate(p.updatedAt || p.createdAt || new Date()),
        changefreq: 'monthly',
        priority: '0.8'
      });
    }

    // Generate XML (simple, no images namespace yet)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(u => {
        return `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
      }).join('\n') +
      `\n</urlset>`;

    cachedXml = xml;
    cachedAt = now;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (e) {
    console.error('Sitemap generation error', e);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
