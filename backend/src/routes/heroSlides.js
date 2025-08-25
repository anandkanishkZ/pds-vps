import express from 'express';
import { Op } from 'sequelize';
import { authMiddleware } from './auth.js';
import { HeroSlide } from '../models/index.js';

const router = express.Router();

// PUBLIC: list active slides (optionally respect time window)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const slides = await HeroSlide.findAll({
      where: {
        status: 'active',
        [Op.and]: [
          { [Op.or]: [{ startAt: null }, { startAt: { [Op.lte]: now } }] },
          { [Op.or]: [{ endAt: null }, { endAt: { [Op.gte]: now } }] },
        ],
      },
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });
    res.json({ data: slides });
  } catch (e) {
    console.error('List hero slides error', e);
    res.status(500).json({ message: 'Failed to load slides' });
  }
});

// ADMIN: list all slides
router.get('/admin', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const slides = await HeroSlide.findAll({ order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']] });
    res.json({ data: slides });
  } catch (e) {
    console.error('Admin list hero slides error', e);
    res.status(500).json({ message: 'Failed to load slides' });
  }
});

// ADMIN: create
router.post('/', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const count = await HeroSlide.count();
    const payload = req.body || {};
    const slide = await HeroSlide.create({
      title: payload.title || null,
      subtitle: payload.subtitle || null,
      description: payload.description || null,
      imageUrl: payload.imageUrl,
      mobileImageUrl: payload.mobileImageUrl || null,
      altText: payload.altText || null,
      ctaLabel: payload.ctaLabel || null,
      ctaUrl: payload.ctaUrl || null,
      status: payload.status || 'active',
      sortOrder: typeof payload.sortOrder === 'number' ? payload.sortOrder : count,
      startAt: payload.startAt || null,
      endAt: payload.endAt || null,
      meta: payload.meta || null,
    });
    res.status(201).json({ slide });
  } catch (e) {
    console.error('Create hero slide error', e);
    res.status(500).json({ message: 'Failed to create slide' });
  }
});

// ADMIN: update
router.patch('/:id', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ message: 'Not found' });
    const allowed = ['title','subtitle','description','imageUrl','mobileImageUrl','altText','ctaLabel','ctaUrl','status','sortOrder','startAt','endAt','meta'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    await slide.update(updates);
    res.json({ slide });
  } catch (e) {
    console.error('Update hero slide error', e);
    res.status(500).json({ message: 'Failed to update slide' });
  }
});

// ADMIN: delete
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ message: 'Not found' });
    await slide.destroy();
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete hero slide error', e);
    res.status(500).json({ message: 'Failed to delete slide' });
  }
});

// ADMIN: reorder
router.post('/reorder', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Items array required' });
    await Promise.all(items.map((it, idx) => HeroSlide.update({ sortOrder: idx }, { where: { id: it.id } })));
    res.json({ message: 'Reordered' });
  } catch (e) {
    console.error('Reorder hero slides error', e);
    res.status(500).json({ message: 'Failed to reorder' });
  }
});

export default router;
