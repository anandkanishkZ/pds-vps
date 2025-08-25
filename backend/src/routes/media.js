import express from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from './auth.js';
import { ProductMedia, Product } from '../models/index.js';
import config from '../config.js';
import multer from 'multer';
import crypto from 'crypto';

// Media library endpoint: list any file under /uploads plus DB-backed product media metadata.
// NOTE: For now we only enrich product media (those recorded in product_media table). Other
// loose files (e.g., avatars) are returned with minimal info.

const router = express.Router();

function walk(dir, baseUrl, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue; // skip dotfiles
    const abs = path.join(dir, e.name);
    const relFs = path.relative(path.join(process.cwd(), 'uploads'), abs).split(path.sep).join('/');
    if (e.isDirectory()) {
      walk(abs, baseUrl, out);
    } else {
      const stat = fs.statSync(abs);
      out.push({
        path: '/' + relFs,
        url: baseUrl + '/' + relFs,
        size: stat.size,
        mtime: stat.mtime,
        ext: path.extname(e.name).toLowerCase()
      });
    }
  }
}

// Multer storage for unattached media (reuse uploads/products for simplicity)
const mediaRoot = path.join(process.cwd(), 'uploads', 'library');
if (!fs.existsSync(mediaRoot)) fs.mkdirSync(mediaRoot, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req,_file,cb)=> cb(null, mediaRoot),
  filename: (_req, file, cb) => {
    const id = crypto.randomUUID();
    cb(null, id + path.extname(file.originalname).toLowerCase());
  }
});
const upload = multer({ storage, limits:{ fileSize: 10*1024*1024 } });

// POST /api/media/upload (admin) - direct upload without product
router.post('/upload', authMiddleware, (req,res,next)=> {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  return upload.single('file')(req,res,(err)=> {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req,res)=> {
  try {
    if (!req.file) return res.status(400).json({ message:'No file' });
    const { altText, type } = req.body;
    const rel = path.posix.join('library', req.file.filename);
    const buffer = fs.readFileSync(req.file.path);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    // Derive type if not provided
    let t = type && typeof type === 'string' ? type.toLowerCase() : '';
    if (!t) {
      if (req.file.mimetype.startsWith('image/')) t='image';
      else if (req.file.mimetype === 'application/pdf') t='brochure';
      else if (req.file.originalname.toLowerCase().includes('msds')) t='msds';
      else t='spec'; // safe generic bucket; MUST match enum
    }
    const allowedTypes = new Set(['image','spec','msds','brochure']);
    if (!allowedTypes.has(t)) {
      // Normalize unexpected types to 'spec'
      t = t === 'file' ? 'spec' : 'image';
      if (!allowedTypes.has(t)) t = 'spec';
    }
    const order = await ProductMedia.count();
    const media = await ProductMedia.create({ productId: null, type: t, url: `/uploads/${rel}`, altText: altText||null, order, meta:{ originalName: req.file.originalname, size: req.file.size, mime: req.file.mimetype }, checksum });
    res.status(201).json({ media });
  } catch (e) {
    // Secure error logging without sensitive data
    console.error('Direct media upload error:', { 
      timestamp: new Date().toISOString(),
      error: e.name,
      userId: req.user?.id,
      fileSize: req.file?.size,
      fileType: req.file?.mimetype
    });
    // Common cause: productId null constraint if migration not run
    const likelyMigration = /null value in column "productId"/i.test(e.message || '');
    res.status(500).json({ 
      error: 'UPLOAD_FAILED',
      ...(config.isDev ? { 
        hint: likelyMigration ? 'Run server migrations: npm run db:migrate (product_media.productId still NOT NULL)' : undefined 
      } : {})
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
  const page = Math.max(parseInt(req.query.page)||1,1);
  const pageSize = Math.min(parseInt(req.query.pageSize)||50,200);
    const q = (req.query.q||'').toString().toLowerCase();
    const typeFilter = (req.query.type||'').toString(); // image|spec|msds|brochure
  const sortRaw = (req.query.sort||'-createdAt').toString(); // -createdAt (default), createdAt, name, -name

    const uploadsRoot = path.join(process.cwd(),'uploads');
    if (!fs.existsSync(uploadsRoot)) return res.json({ data:[], pagination:{ page, pageSize, total:0, pages:0 } });

    // Collect filesystem files
    const files = [];
    walk(uploadsRoot, '/uploads', files);

    // Fetch product media metadata to enrich
    const dbMedia = await ProductMedia.findAll({ include:[{ model: Product, as:'Product', attributes:['id','name'] }] });
    const dbMediaByUrl = new Map(dbMedia.map(m => [m.url, m]));

    function infer(ext) {
      switch(ext) {
        case '.jpg': case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        case '.svg': return 'image/svg+xml';
        case '.pdf': return 'application/pdf';
        default: return null;
      }
    }
    const items = files.map(f => {
      const pm = dbMediaByUrl.get(f.path.replace(/\\/g,'/')) || dbMediaByUrl.get(f.url);
      const mime = pm?.meta?.mime || infer(f.ext);
      const type = pm?.type || (mime && mime.startsWith('image/') ? 'image' : null);
      return {
        id: pm?.id || null,
        productId: pm?.productId || null,
        productName: pm?.Product?.name || null,
        type,
        url: f.url.startsWith('/uploads') ? f.url : f.path,
        altText: pm?.altText || null,
        size: f.size,
        mime,
        createdAt: pm?.createdAt || f.mtime,
        fsPath: f.path,
        ext: f.ext
      };
    });

    // Sorting
    if (sortRaw === '-createdAt' || sortRaw === 'createdAt') {
      items.sort((a,b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortRaw.startsWith('-') ? bt - at : at - bt;
      });
    } else if (sortRaw === 'name' || sortRaw === '-name') {
      items.sort((a,b) => {
        const an = (a.productName || a.url).toLowerCase();
        const bn = (b.productName || b.url).toLowerCase();
        if (an < bn) return sortRaw.startsWith('-') ? 1 : -1;
        if (an > bn) return sortRaw.startsWith('-') ? -1 : 1;
        return 0;
      });
    }

    // Filters
    let filtered = items;
    if (q) filtered = filtered.filter(i => (i.productName||'').toLowerCase().includes(q) || (i.altText||'').toLowerCase().includes(q) || (i.url||'').toLowerCase().includes(q));
    if (typeFilter) filtered = filtered.filter(i => i.type === typeFilter);

    const total = filtered.length;
    const pages = Math.ceil(total / pageSize) || 1;
    const slice = filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);

    res.json({ data: slice, pagination:{ page, pageSize, total, pages } });
  } catch (e) {
    console.error('List media error', e);
    res.status(500).json({ message: 'Failed to list media' });
  }
});

export default router;
