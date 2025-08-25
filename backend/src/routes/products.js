import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authMiddleware } from './auth.js';
import { ProductCategory, Product, ProductFeature, ProductApplication, ProductPackSize, ProductMedia } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

// Helpers
function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

// Multer storage for product media
const productMediaRoot = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(productMediaRoot)) {
  fs.mkdirSync(productMediaRoot, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productMediaRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = crypto.randomUUID();
    cb(null, id + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const type = req.body.type;
    const allowedTypes = ['image','spec','msds','brochure'];
    if (!allowedTypes.includes(type)) return cb(new Error('Invalid media type field'));
    if (type === 'image') {
      if (!/^image\//.test(file.mimetype)) return cb(new Error('Only image files allowed for type=image'));
    } else { // spec/msds/brochure -> expect PDF
      if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF allowed for non-image media'));
    }
    cb(null, true);
  }
});

// PUBLIC: list categories
router.get('/categories', async (req,res) => {
  try {
    const { status } = req.query; // optional filter
    const where = {};
    if (status) where.status = status;
    else where.status = { [Op.in]: ['active','coming_soon'] };
    const cats = await ProductCategory.findAll({ where, order: [['sortOrder','ASC'], ['name','ASC']] });
    res.json({ data: cats });
  } catch (e) {
    console.error('List categories error', e);
    res.status(500).json({ message: 'Failed to list categories' });
  }
});

// ADMIN: list all categories with product counts
router.get('/admin/categories', [authMiddleware], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  try {
    const cats = await ProductCategory.findAll({ order: [['sortOrder','ASC'], ['name','ASC']] });
    // Attach product counts in one query per category (acceptable for small N; optimize later with GROUP BY)
    const withCounts = await Promise.all(cats.map(async c => {
      const count = await Product.count({ where: { categoryId: c.id } });
      return { ...c.toJSON(), productCount: count };
    }));
    res.json({ data: withCounts });
  } catch (e) {
    console.error('Admin list categories error', e);
    res.status(500).json({ message: 'Failed to list categories (admin)' });
  }
});

// PUBLIC: category detail + optional product count
router.get('/categories/:slug', async (req,res) => {
  try {
    const cat = await ProductCategory.findOne({ where: { slug: req.params.slug } });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const count = await Product.count({ where: { categoryId: cat.id, isActive: true } });
    res.json({ category: cat, productCount: count });
  } catch (e) {
    console.error('Get category error', e);
    res.status(500).json({ message: 'Failed to fetch category' });
  }
});

// PUBLIC: products under category
router.get('/categories/:slug/products', [
  query('page').optional().isInt({ min:1 }),
  query('pageSize').optional().isInt({ min:1, max:100 })
], async (req,res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const cat = await ProductCategory.findOne({ where: { slug: req.params.slug } });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const page = Number(req.query.page)||1;
    const pageSize = Math.min(Number(req.query.pageSize)||25,100);
    const offset = (page-1)*pageSize;
    const where = { categoryId: cat.id, isActive: true };
    if (cat.status === 'coming_soon') return res.json({ data: [], pagination:{ page, pageSize, total:0, pages:0 }});
    const { rows, count } = await Product.findAndCountAll({ where, order:[['createdAt','DESC']], limit: pageSize, offset, attributes:{ exclude:['healthSafety','meta'] } });
    res.json({ data: rows, pagination:{ page, pageSize, total: count, pages: Math.ceil(count/pageSize) } });
  } catch (e) {
    console.error('Category product list error', e);
    res.status(500).json({ message: 'Failed to list products' });
  }
});

// ADMIN: list all products across all categories
router.get('/items', [authMiddleware], async (req,res) => {
  try {
    const page = Number(req.query.page)||1;
    const pageSize = Math.min(Number(req.query.pageSize)||25,100);
    const offset = (page-1)*pageSize;
    
    const { rows, count } = await Product.findAndCountAll({ 
      include: [{ 
        model: ProductCategory, 
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }],
      order:[['createdAt','DESC']], 
      limit: pageSize, 
      offset, 
      attributes:{ exclude:['healthSafety','meta'] } 
    });
    
    res.json({ 
      data: rows, 
      pagination:{ page, pageSize, total: count, pages: Math.ceil(count/pageSize) } 
    });
  } catch (e) {
    console.error('All products list error', e);
    res.status(500).json({ message: 'Failed to list all products' });
  }
});

// PUBLIC: product detail
router.get('/items/:slug', async (req,res) => {
  try {
    const product = await Product.findOne({ where: { slug: req.params.slug, isActive: true }, include:[
      { model: ProductCategory, as:'category' },
      { model: ProductFeature, as:'features', order:[['order','ASC']] },
      { model: ProductApplication, as:'applications', order:[['order','ASC']] },
      { model: ProductPackSize, as:'packSizes', order:[['order','ASC']] },
      { model: ProductMedia, as:'media', order:[['order','ASC']] }
    ] });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (e) {
    console.error('Get product detail error', e);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// ADMIN: create category
router.post('/categories', [
  authMiddleware,
  body('name').isString().isLength({ min:2 }),
  body('code').optional().isString().isLength({ max:16 }),
  body('status').optional().isIn(['active','coming_soon','archived']),
  body('heroImageUrl').optional().isString(),
  body('sortOrder').optional().isInt()
], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, code, status, heroImageUrl, sortOrder } = req.body;
    const slugBase = slugify(name);
    let slug = slugBase; let i=2;
    while (await ProductCategory.findOne({ where: { slug } })) { slug = slugBase + '-' + i++; }
    const cat = await ProductCategory.create({ name, code, status: status || 'active', slug, heroImageUrl: heroImageUrl || null, sortOrder: sortOrder ?? 0 });
    res.status(201).json({ category: cat });
  } catch (e) {
    console.error('Create category error', e);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// ADMIN: update category
router.patch('/categories/:id', [authMiddleware, param('id').isUUID()], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const cat = await ProductCategory.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message:'Category not found' });
    const allowed = ['name','code','shortDescription','longDescription','heroImageUrl','status','sortOrder','seoMeta'];
    const updates={};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k]=req.body[k];
    // slug change only if name changed & not archived
    if (updates.name && updates.name !== cat.name) {
      const slugBase = slugify(updates.name); let slug = slugBase; let i=2;
      while (await ProductCategory.findOne({ where: { slug, id:{ [Op.ne]: cat.id } } })) slug = slugBase+'-'+i++;
      updates.slug = slug;
    }
    await cat.update(updates);
    res.json({ category: cat });
  } catch (e) {
    console.error('Update category error', e);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// ADMIN: delete category
router.delete('/categories/:id', [authMiddleware, param('id').isUUID()], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const cat = await ProductCategory.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message:'Category not found' });
    
    // Check if category has products
    const productCount = await Product.count({ where: { categoryId: cat.id } });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with products', 
        details: `This category contains ${productCount} product(s). Please move or delete all products first.`,
        productCount 
      });
    }
    
    await cat.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (e) {
    console.error('Delete category error', e);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// ADMIN: create product (basic)
router.post('/items', [
  authMiddleware,
  body('categoryId').isUUID(),
  body('name').isString().isLength({ min:2 }),
  body('viscosity').optional().isString(),
  body('apiGrade').optional().isString()
], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, categoryId } = req.body;
    const cat = await ProductCategory.findByPk(categoryId);
    if (!cat) return res.status(400).json({ message: 'Invalid category' });
    const base = slugify(name); let slug=base; let i=2;
    while (await Product.findOne({ where: { slug } })) slug = base+'-'+i++;
    const product = await Product.create({
      categoryId,
      name,
      slug,
      shortDescription: req.body.shortDescription || null,
      longDescription: req.body.longDescription || null,
      imageUrl: req.body.imageUrl || null,
      viscosity: req.body.viscosity || null,
      apiGrade: req.body.apiGrade || null,
      healthSafety: req.body.healthSafety || null,
      meta: req.body.meta || null
    });
    res.status(201).json({ product });
  } catch (e) {
    console.error('Create product error', e);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// ADMIN: update product
router.patch('/items/:id', [
  authMiddleware,
  param('id').isUUID(),
  body('slug').optional().isLength({ min:3, max:160 }).matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Invalid slug format')
], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message:'Product not found' });
    const allowed = ['name','slug','shortDescription','longDescription','imageUrl','viscosity','apiGrade','healthSafety','isActive','meta','categoryId'];
    const updates={};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k]=req.body[k];
    // Slug precedence: explicit slug provided -> validate uniqueness; else regenerate if name changed
    if (updates.slug) {
      const existing = await Product.findOne({ where:{ slug: updates.slug, id: { [Op.ne]: product.id } } });
      if (existing) return res.status(400).json({ message: 'Slug already in use' });
    } else if (updates.name && updates.name !== product.name) {
      const base = slugify(updates.name); let slug=base; let i=2;
      while (await Product.findOne({ where:{ slug, id:{ [Op.ne]: product.id } } })) slug = base+'-'+i++;
      updates.slug = slug;
    }
    await product.update(updates);
    res.json({ product });
  } catch (e) {
    console.error('Update product error', e);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// ADMIN: replace features
router.put('/items/:id/features', [authMiddleware, param('id').isUUID(), body('features').isArray({ max:50 })], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message:'Product not found' });
    await ProductFeature.destroy({ where: { productId: product.id } });
    const rows = await Promise.all((req.body.features||[]).map((label, idx) => ProductFeature.create({ productId: product.id, label: String(label).trim(), order: idx })));
    res.json({ features: rows });
  } catch (e) {
    console.error('Replace features error', e);
    res.status(500).json({ message: 'Failed to update features' });
  }
});

// ADMIN: replace applications
router.put('/items/:id/applications', [authMiddleware, param('id').isUUID(), body('applications').isArray({ max:50 })], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message:'Product not found' });
    await ProductApplication.destroy({ where: { productId: product.id } });
    const rows = await Promise.all((req.body.applications||[]).map((label, idx) => ProductApplication.create({ productId: product.id, label: String(label).trim(), order: idx })));
    res.json({ applications: rows });
  } catch (e) {
    console.error('Replace applications error', e);
    res.status(500).json({ message: 'Failed to update applications' });
  }
});

// ADMIN: replace pack sizes
router.put('/items/:id/packs', [authMiddleware, param('id').isUUID(), body('packs').isArray({ max:50 })], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message:'Product not found' });
    await ProductPackSize.destroy({ where: { productId: product.id } });
    const rows = await Promise.all((req.body.packs||[]).map((p, idx) => {
      if (!p || typeof p !== 'object') return null;
      return ProductPackSize.create({ productId: product.id, displayLabel: p.displayLabel, numericValue: p.numericValue || null, unit: p.unit || null, order: idx });
    }));
    res.json({ packSizes: rows.filter(Boolean) });
  } catch (e) {
    console.error('Replace pack sizes error', e);
    res.status(500).json({ message: 'Failed to update pack sizes' });
  }
});

// ADMIN: delete product
router.delete('/items/:id', [authMiddleware, param('id').isUUID()], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message:'Not found' });
    await product.destroy();
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete product error', e);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// ADMIN: upload media
router.post('/items/:id/media', [authMiddleware, param('id').isUUID()], (req,res,next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  return upload.single('file')(req,res,(err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req,res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message:'Product not found' });
    if (!req.file) return res.status(400).json({ message:'No file uploaded' });
    const { type, altText } = req.body;
    const relPath = path.posix.join('products', req.file.filename); // relative under /uploads
    // Compute checksum
    const buffer = fs.readFileSync(req.file.path);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const order = await ProductMedia.count({ where: { productId: product.id } });
    const media = await ProductMedia.create({ productId: product.id, type, url: `/uploads/${relPath}`, altText: altText || null, order, meta: { originalName: req.file.originalname, size: req.file.size, mime: req.file.mimetype }, checksum });
    res.status(201).json({ media });
  } catch (e) {
    console.error('Upload media error', e);
    res.status(500).json({ message: 'Failed to upload media' });
  }
});

// ADMIN: delete media
router.delete('/media/:mediaId', [authMiddleware, param('mediaId').isUUID()], async (req,res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message:'Admin only' });
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const media = await ProductMedia.findByPk(req.params.mediaId);
    if (!media) return res.status(404).json({ message:'Media not found' });
    // Attempt file removal (best effort)
    if (media.url && media.url.startsWith('/uploads/')) {
      const fileFsPath = path.join(process.cwd(), media.url.replace('/uploads/','uploads/'));
      fs.promises.unlink(fileFsPath).catch(()=>{});
    }
    await media.destroy();
    res.json({ message:'Deleted' });
  } catch (e) {
    console.error('Delete media error', e);
    res.status(500).json({ message:'Failed to delete media' });
  }
});

export default router;
