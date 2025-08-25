import express from 'express';
import { authMiddleware } from './auth.js';
import { Gallery } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/gallery - Public route to list gallery items
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category, 
      featured, 
      q 
    } = req.query;

    const limit = Math.min(parseInt(pageSize) || 20, 100);
    const offset = ((parseInt(page) || 1) - 1) * limit;

    const where = { status: 'active' };
    
    // Filter by category
    if (category && category !== 'all') {
      where.category = category;
    }
    
    // Filter by featured
    if (featured === 'true') {
      where.featured = true;
    }
    
    // Search in title and description
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows } = await Gallery.findAndCountAll({
      where,
      order: [
        ['featured', 'DESC'],
        ['sortOrder', 'ASC'],
        ['date', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
    });

    res.json({
      data: rows,
      total: count,
      page: parseInt(page) || 1,
      pageSize: limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Gallery list error:', error);
    res.status(500).json({ 
      error: 'GALLERY_LIST_FAILED',
      message: 'Failed to fetch gallery items'
    });
  }
});

// GET /api/gallery/stats - Gallery statistics (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const totalItems = await Gallery.count();
    const featuredItems = await Gallery.count({ where: { featured: true } });
    const activeItems = await Gallery.count({ where: { status: 'active' } });
    const archivedItems = await Gallery.count({ where: { status: 'archived' } });
    
    const categoryStats = await Gallery.findAll({
      attributes: [
        'category',
        [Gallery.sequelize.fn('COUNT', Gallery.sequelize.col('id')), 'count']
      ],
      where: { status: 'active' },
      group: ['category'],
      raw: true,
    });

    res.json({
      totalItems,
      featuredItems,
      activeItems,
      archivedItems,
      categoryStats: categoryStats.reduce((acc, stat) => {
        acc[stat.category] = parseInt(stat.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Gallery stats error:', error);
    res.status(500).json({ 
      error: 'GALLERY_STATS_FAILED',
      message: 'Failed to fetch gallery statistics'
    });
  }
});

// GET /api/gallery/admin - Admin route to list all gallery items (including archived)
router.get('/admin', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category, 
      status,
      featured, 
      q 
    } = req.query;

    const limit = Math.min(parseInt(pageSize) || 20, 100);
    const offset = ((parseInt(page) || 1) - 1) * limit;

    const where = {};
    
    // Filter by status (admin can see all statuses)
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Filter by category
    if (category && category !== 'all') {
      where.category = category;
    }
    
    // Filter by featured
    if (featured === 'true') {
      where.featured = true;
    }
    
    // Search in title and description
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows } = await Gallery.findAndCountAll({
      where,
      order: [
        ['featured', 'DESC'],
        ['sortOrder', 'ASC'],
        ['date', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset
    });

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Admin gallery list error:', error);
    res.status(500).json({ 
      error: 'GALLERY_LIST_FAILED',
      message: 'Failed to fetch gallery items'
    });
  }
});

// GET /api/gallery/:id - Get single gallery item
router.get('/:id', async (req, res) => {
  try {
    const item = await Gallery.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    // Only show active items for public access
    if (item.status !== 'active' && req.user?.role !== 'admin') {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Gallery item fetch error:', error);
    res.status(500).json({ 
      error: 'GALLERY_ITEM_FAILED',
      message: 'Failed to fetch gallery item'
    });
  }
});

// POST /api/gallery - Create gallery item (admin only)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const {
      title,
      description,
      category,
      imageUrl,
      date,
      location,
      featured = false,
      status = 'active',
      sortOrder = 0
    } = req.body;

    // Validation
    if (!title || !imageUrl) {
      return res.status(400).json({ 
        message: 'Title and image URL are required' 
      });
    }

    if (!['facility', 'products', 'events', 'achievements'].includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category' 
      });
    }

    const item = await Gallery.create({
      title,
      description,
      category,
      imageUrl,
      date: date ? new Date(date) : new Date(),
      location,
      featured: Boolean(featured),
      status,
      sortOrder: parseInt(sortOrder) || 0
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Gallery create error:', error);
    res.status(500).json({ 
      error: 'GALLERY_CREATE_FAILED',
      message: 'Failed to create gallery item'
    });
  }
});

// PUT /api/gallery/:id - Update gallery item (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const item = await Gallery.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    const {
      title,
      description,
      category,
      imageUrl,
      date,
      location,
      featured,
      status,
      sortOrder
    } = req.body;

    // Validation
    if (category && !['facility', 'products', 'events', 'achievements'].includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category' 
      });
    }

    if (status && !['active', 'archived'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status' 
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (date !== undefined) updateData.date = new Date(date);
    if (location !== undefined) updateData.location = location;
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (status !== undefined) updateData.status = status;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder) || 0;

    await item.update(updateData);

    res.json(item);
  } catch (error) {
    console.error('Gallery update error:', error);
    res.status(500).json({ 
      error: 'GALLERY_UPDATE_FAILED',
      message: 'Failed to update gallery item'
    });
  }
});

// DELETE /api/gallery/:id - Delete gallery item (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const item = await Gallery.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    await item.destroy();

    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Gallery delete error:', error);
    res.status(500).json({ 
      error: 'GALLERY_DELETE_FAILED',
      message: 'Failed to delete gallery item'
    });
  }
});

// POST /api/gallery/reorder - Reorder gallery items (admin only)
router.post('/reorder', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }

    // Update sort order for each item
    const updatePromises = items.map((item, index) => 
      Gallery.update(
        { sortOrder: index },
        { where: { id: item.id } }
      )
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Gallery items reordered successfully' });
  } catch (error) {
    console.error('Gallery reorder error:', error);
    res.status(500).json({ 
      error: 'GALLERY_REORDER_FAILED',
      message: 'Failed to reorder gallery items'
    });
  }
});

export default router;
