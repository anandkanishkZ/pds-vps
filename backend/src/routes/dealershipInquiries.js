import express from 'express';
import rateLimit from 'express-rate-limit';
import { DealershipInquiry, User } from '../models/index.js';
import { requireAuth, requireAdmin } from '../utils/auth.js';
import { secureLogger } from '../utils/secureLogger.js';
import { Op } from 'sequelize';

const router = express.Router();

// Rate limiters
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { message: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Submission limit reached. Try again later.' }
});

router.post('/', publicLimiter, strictLimiter, async (req, res) => {
  try {
    const { companyName, contactPerson, email, phone, location, businessType, yearsInBusiness, currentBrands, monthlyVolume, message, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      secureLogger.security('Dealership honeypot tripped', { ip: req.ip, ua: req.get('User-Agent') });
      return res.status(201).json({ message: 'Received' });
    }

    if (!companyName || !contactPerson || !email) {
      return res.status(400).json({ message: 'companyName, contactPerson and email are required' });
    }
    if (companyName.length < 2) return res.status(400).json({ message: 'Company name too short' });
    if (contactPerson.length < 2) return res.status(400).json({ message: 'Contact person too short' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email' });
    if (message && message.length > 5000) return res.status(400).json({ message: 'Message too long' });

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const referer = req.get('Referer') || 'direct';
    const acceptLanguage = req.get('Accept-Language') || 'unknown';

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await DealershipInquiry.count({ where: { ipAddress, createdAt: { [Op.gte]: oneHourAgo } } });
    let flags = [];
    if (recent >= 5) flags.push('high_frequency');

    const duplicate = await DealershipInquiry.count({ where: { email: email.trim().toLowerCase(), createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    if (duplicate > 0) flags.push('duplicate_email');

    let priority = 'medium';
    const volumeNum = parseFloat(String(monthlyVolume || '').replace(/[, ]/g, ''));
    if (!isNaN(volumeNum)) {
      if (volumeNum >= 20000) priority = 'urgent';
      else if (volumeNum >= 5000) priority = 'high';
    }

    const inquiry = await DealershipInquiry.create({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      location: location?.trim() || null,
      businessType: businessType || null,
      yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness, 10) : null,
      currentBrands: currentBrands?.trim() || null,
      monthlyVolume: monthlyVolume?.trim() || null,
      message: message?.trim() || null,
      priority,
      ipAddress,
      userAgent,
      source: 'website',
      metadata: JSON.stringify({ referer, acceptLanguage, flags, recentSubmissionCount: recent })
    });

    secureLogger.info('Dealership inquiry submitted', { id: inquiry.id, ip: ipAddress, flags: flags.length ? flags : ['none'] });
    res.status(201).json({ message: 'Your inquiry has been submitted successfully.' });
  } catch (err) {
    secureLogger.error('Failed to submit dealership inquiry', { error: err.message });
    res.status(500).json({ message: 'Failed to submit inquiry' });
  }
});

router.use(requireAuth);

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search = '', status = '', priority = '', assignedTo = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    const where = {};
    if (search) {
      where[Op.or] = [
        { companyName: { [Op.iLike]: `%${search}%` } },
        { contactPerson: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;

    const validSort = ['created_at', 'updated_at', 'company_name', 'contact_person', 'status', 'priority'];
    const orderBy = validSort.includes(sortBy) ? sortBy : 'created_at';
    const order = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await DealershipInquiry.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'], required: false },
        { model: User, as: 'resolvedByUser', attributes: ['id', 'name', 'email'], required: false }
      ],
      order: [[orderBy, order]],
      offset,
      limit
    });

    res.json({ data: rows, pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, pages: Math.ceil(count / parseInt(pageSize)) } });
  } catch (err) {
    secureLogger.error('Failed to list dealership inquiries', { error: err.message });
    res.status(500).json({ message: 'Failed to fetch inquiries' });
  }
});

router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const inquiry = await DealershipInquiry.findByPk(req.params.id, { include: [
      { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['id', 'name', 'email'] }
    ]});
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inquiry' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, priority, assignedTo, adminNotes, resolvedBy } = req.body;
    const inquiry = await DealershipInquiry.findByPk(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    const update = {};
    if (status !== undefined) {
      update.status = status;
      if ((status === 'resolved' || status === 'closed') && !inquiry.resolvedAt) {
        update.resolvedAt = new Date();
        update.resolvedBy = req.user.id;
      }
      if (status === 'new' || status === 'in_progress') {
        update.resolvedAt = null;
        update.resolvedBy = null;
      }
    }
    if (priority !== undefined) update.priority = priority;
    if (assignedTo !== undefined) update.assignedTo = assignedTo === '' ? null : assignedTo;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (resolvedBy !== undefined) update.resolvedBy = resolvedBy === '' ? null : resolvedBy;
    await inquiry.update(update);
    const updated = await DealershipInquiry.findByPk(inquiry.id, { include: [
      { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['id', 'name', 'email'] }
    ]});
    res.json({ message: 'Inquiry updated successfully', inquiry: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update inquiry' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const inquiry = await DealershipInquiry.findByPk(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    await inquiry.destroy();
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete inquiry' });
  }
});

router.get('/stats/summary', requireAdmin, async (_req, res) => {
  try {
    const [total, newCount, inProgress, resolved, closed, urgent, high] = await Promise.all([
      DealershipInquiry.count(),
      DealershipInquiry.count({ where: { status: 'new' } }),
      DealershipInquiry.count({ where: { status: 'in_progress' } }),
      DealershipInquiry.count({ where: { status: 'resolved' } }),
      DealershipInquiry.count({ where: { status: 'closed' } }),
      DealershipInquiry.count({ where: { priority: 'urgent' } }),
      DealershipInquiry.count({ where: { priority: 'high' } })
    ]);
    res.json({
      total,
      byStatus: { new: newCount, in_progress: inProgress, resolved, closed },
      byPriority: { urgent, high, medium: total - urgent - high, low: 0 },
      unresolved: newCount + inProgress
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inquiry statistics' });
  }
});

export default router;
