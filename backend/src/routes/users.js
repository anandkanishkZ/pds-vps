import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { User, UserBlockAudit } from '../models/index.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// List users with basic pagination & filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 25, search = '', role, status } = req.query;
    const limit = Math.min(Number(pageSize) || 25, 100);
    const offset = (Number(page) - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.$or = [
        { name: { $iLike: `%${search}%` } },
        { email: { $iLike: `%${search}%` } }
      ];
    }

    // Sequelize v6 doesn't support $iLike in plain object; use where + Op
    const { Op } = await import('sequelize');
    const dynamicWhere = { ...where };
    if (search) {
      dynamicWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where: dynamicWhere,
      attributes: ['id','name','email','phone','role','status','createdAt','lastLoginAt','avatar','adminNotes','blockedAt','blockedUntil'],
      order: [['createdAt','DESC']],
      limit,
      offset
    });

    const results = rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      lastLogin: u.lastLoginAt,
  avatar: u.avatar ? `/uploads/avatars/${u.avatar}` : null,
  adminNotes: u.adminNotes,
  blockedAt: u.blockedAt,
  blockedUntil: u.blockedUntil,
  remainingBlockSeconds: (u.blockedUntil && u.blockedUntil > new Date()) ? Math.max(0, Math.floor((u.blockedUntil.getTime() - Date.now())/1000)) : null
    }));

    res.json({
      data: results,
      pagination: { page: Number(page), pageSize: limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (err) {
    // Secure error logging without sensitive data
    console.error('List users error:', { 
      timestamp: new Date().toISOString(),
      error: err.name,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'OPERATION_FAILED' });
  }
});

// Create user
router.post('/', [
  authMiddleware,
  body('name').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  body('role').optional().isIn(['admin','user','moderator']),
  body('status').optional().isIn(['active','inactive','pending','blocked']),
  body('blockedUntil').optional().isISO8601().toDate(),
  body('adminNotes').optional().isString().isLength({ max: 5000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
  let { name, email, password, role = 'user', status = 'active', adminNotes } = req.body;
  if (role === 'moderator') role = 'user'; // fallback until moderator role supported in model
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
  const bcrypt = (await import('bcryptjs')).default;
    const config = (await import('../config.js')).default;
    const passwordHash = await bcrypt.hash(password, config.security.saltRounds);
    const blockFields = status === 'blocked' ? { blockedAt: new Date() } : {};
    const user = await User.create({ name, email, passwordHash, role, status, adminNotes, ...blockFields });
    res.status(201).json({ id: user.id });
  } catch (err) {
    console.error('Create user error', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update status / role
router.patch('/:id', [
  authMiddleware,
  param('id').isUUID(),
  body('role').optional().isIn(['admin','user','moderator']),
  body('status').optional().isIn(['active','inactive','pending','blocked']),
  body('adminNotes').optional().isString().isLength({ max: 5000 })
], async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Authorization logic
    const actingUserId = req.user?.sub;
    const actingUserRole = req.user?.role;

    // Prevent self block or self role downgrade
    if (req.body.status === 'blocked' && actingUserId === user.id) {
      return res.status(400).json({ message: 'You cannot block your own account.' });
    }
    if (req.body.role && actingUserId === user.id && req.body.role !== user.role) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    // Prevent non-admin from modifying admins
    if (user.role === 'admin' && actingUserRole !== 'admin') {
      return res.status(403).json({ message: 'Insufficient privileges to modify an admin user.' });
    }

    // Prevent blocking admin unless acting user is also admin and not self
    if (req.body.status === 'blocked' && user.role === 'admin' && actingUserRole !== 'admin') {
      return res.status(403).json({ message: 'Only another admin can block an admin.' });
    }
    if (req.body.status === 'blocked' && user.role === 'admin' && actingUserId === user.id) {
      return res.status(400).json({ message: 'Admin cannot self-block.' });
    }
    const newRole = req.body.role === 'moderator' ? 'user' : req.body.role;
    const updates = { };
    if (newRole) {
      // Only admin can change roles; already prevented above for non-admin editing admin
      if (actingUserRole !== 'admin' && newRole === 'admin') {
        return res.status(403).json({ message: 'Only admins can grant admin role.' });
      }
      updates.role = newRole;
    }
    let auditAction = null;
    let prevBlockedUntil = user.blockedUntil;
    let newBlockedUntil = null;
    if (req.body.status) {
      updates.status = req.body.status;
      if (req.body.status === 'blocked') {
        updates.blockedAt = user.blockedAt || new Date();
        if (req.body.blockedUntil) {
          updates.blockedUntil = req.body.blockedUntil;
          newBlockedUntil = req.body.blockedUntil;
        }
        auditAction = user.status === 'blocked' ? 'extend' : 'block';
      } else if (user.status === 'blocked') {
        updates.blockedAt = null; // unblocking
        updates.blockedUntil = null;
        auditAction = 'unblock';
      }
    }
    if (req.body.blockedUntil && !updates.status && user.status === 'blocked') {
      // Allow extending block without changing status
      updates.blockedUntil = req.body.blockedUntil;
      auditAction = 'extend';
      newBlockedUntil = req.body.blockedUntil;
    }
    if (req.body.adminNotes !== undefined) updates.adminNotes = req.body.adminNotes;
    await user.update(updates);
    if (auditAction) {
      try {
        await UserBlockAudit.create({
          userId: user.id,
            actingUserId: actingUserId,
          action: auditAction,
          reason: req.body.adminNotes || null,
          previousBlockedUntil: prevBlockedUntil,
          newBlockedUntil: newBlockedUntil
        });
      } catch (e) {
        // Secure audit log error handling
        console.error('Audit log write failed:', { 
          timestamp: new Date().toISOString(),
          userId: user.id,
          error: e.name
        });
      }
    }
    res.json({ message: 'Updated', id: user.id });
  } catch (err) {
    // Secure error logging
    console.error('Update user error:', { 
      timestamp: new Date().toISOString(),
      error: err.name,
      userId: req.params.id,
      actingUserId: req.user?.id
    });
    res.status(500).json({ error: 'UPDATE_FAILED' });
  }
});

// Get single user detail
router.get('/:id', [authMiddleware, param('id').isUUID()], async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
  const user = await User.findByPk(req.params.id, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        avatar: user.avatar ? `/uploads/avatars/${user.avatar}` : null,
        adminNotes: user.adminNotes,
  blockedAt: user.blockedAt,
  blockedUntil: user.blockedUntil,
  remainingBlockSeconds: (user.blockedUntil && user.blockedUntil > new Date()) ? Math.max(0, Math.floor((user.blockedUntil.getTime() - Date.now())/1000)) : null
      }
    });
  } catch (err) {
    console.error('Get user detail error', err);
    res.status(500).json({ message: 'Failed to fetch user detail' });
  }
});

// User block/unblock audit trail
router.get('/:id/block-audits', [authMiddleware, param('id').isUUID()], async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const actingUserRole = req.user?.role;
    if (actingUserRole !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const audits = await UserBlockAudit.findAll({ where: { userId: req.params.id }, order: [['createdAt','DESC']], limit: 100, include: [{ model: User, as: 'actor', attributes: ['id','name','email','role'] }] });
  res.json({ audits: audits.map(a => ({ id: a.id, action: a.action, reason: a.reason, previousBlockedUntil: a.previousBlockedUntil, newBlockedUntil: a.newBlockedUntil, actingUserId: a.actingUserId, actor: a.actor ? { id: a.actor.id, name: a.actor.name, email: a.actor.email, role: a.actor.role } : null, createdAt: a.createdAt })) });
  } catch (err) {
    console.error('Fetch block audits error', err);
    res.status(500).json({ message: 'Failed to fetch audit trail' });
  }
});

// Delete user
router.delete('/:id', [authMiddleware, param('id').isUUID()], async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'Deleted', id: user.id });
  } catch (err) {
    console.error('Delete user error', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
