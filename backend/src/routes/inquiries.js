import express from 'express';
import rateLimit from 'express-rate-limit';
import { Inquiry, User } from '../models/index.js';
import { requireAuth, requireAdmin } from '../utils/auth.js';
import { secureLogger } from '../utils/secureLogger.js';
import { Op } from 'sequelize';

const router = express.Router();

// Rate limiter for contact form submissions
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    message: 'Too many contact form submissions from this IP. Please try again in 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Remove custom keyGenerator to use the default one which handles IPv6 properly
});

// Stricter rate limiter for potential abuse detection
const strictContactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 submissions per hour per IP
  message: {
    message: 'Maximum contact form submissions reached for this hour. Please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for admin users if they're authenticated
    return req.user && req.user.role === 'admin';
  }
});

// Public route for creating inquiries (from contact form)
router.post('/', contactFormLimiter, strictContactLimiter, async (req, res) => {
  try {
    const { name, email, company, phone, subject, message, honeypot } = req.body;

    // Honeypot field check - if filled, it's likely a bot
    if (honeypot && honeypot.trim() !== '') {
      // Log potential bot attempt but don't return error immediately
      console.log(`Bot attempt detected from IP: ${req.ip}`);
      secureLogger.security('Bot attempt detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        honeypot: 'detected'
      });
      
      // Return success to avoid revealing the honeypot mechanism
      return res.status(201).json({
        message: 'Your inquiry has been submitted successfully. We will get back to you soon!'
      });
    }

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        message: 'Name, email, and message are required'
      });
    }

    // Enhanced input validation
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        message: 'Name must be between 2 and 100 characters'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      });
    }

    // Message length validation
    if (message.length < 10 || message.length > 5000) {
      return res.status(400).json({
        message: 'Message must be between 10 and 5000 characters'
      });
    }

    // Spam content detection
    const spamPatterns = [
      /viagra|cialis|casino|loan|crypto|bitcoin/i,
      /http[s]?:\/\/[^\s]+/gi, // URLs in message
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card patterns
      /[A-Z]{10,}/g, // Excessive caps
      /(.)\1{4,}/g, // Repeated characters
    ];

    const messageContent = `${name} ${email} ${subject || ''} ${message}`.toLowerCase();
    const containsSpam = spamPatterns.some(pattern => pattern.test(messageContent));
    
    if (containsSpam) {
      console.log(`Spam content detected from IP: ${req.ip}`);
      secureLogger.security('Spam content detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: 'flagged'
      });
      return res.status(400).json({
        message: 'Your message contains content that cannot be processed. Please review and try again.'
      });
    }

    // Get comprehensive client information
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.headers['x-forwarded-for']?.split(',')[0] ||
                     'unknown';
    
    const userAgent = req.get('User-Agent') || 'unknown';
    const referer = req.get('Referer') || 'direct';
    const acceptLanguage = req.get('Accept-Language') || 'unknown';

    // Check for bulk submissions from same IP in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSubmissions = await Inquiry.count({
      where: {
        ipAddress: ipAddress,
        createdAt: {
          [Op.gte]: oneHourAgo
        }
      }
    });

    // Flag potential bulk submissions
    let flags = [];
    if (recentSubmissions >= 5) {
      flags.push('high_frequency');
    }

    // Check for duplicate content in recent submissions
    const duplicateContent = await Inquiry.count({
      where: {
        [Op.or]: [
          { message: message.trim() },
          { email: email.trim().toLowerCase() }
        ],
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (duplicateContent > 0) {
      flags.push('duplicate_content');
    }

    // Determine priority based on subject or keywords
    let priority = 'medium';
    if (subject) {
      const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediate'];
      const highKeywords = ['important', 'bulk', 'partnership', 'technical'];
      
      const subjectLower = subject.toLowerCase();
      if (urgentKeywords.some(keyword => subjectLower.includes(keyword))) {
        priority = 'urgent';
      } else if (highKeywords.some(keyword => subjectLower.includes(keyword))) {
        priority = 'high';
      }
    }

    // Create inquiry with enhanced tracking
    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
      priority,
      ipAddress,
      userAgent,
      source: 'website',
      metadata: JSON.stringify({
        referer,
        acceptLanguage,
        flags,
        submissionTime: new Date().toISOString(),
        recentSubmissionCount: recentSubmissions
      })
    });

    // Log successful submission for monitoring
    secureLogger.info('Contact form submission', {
      inquiryId: inquiry.id,
      ip: ipAddress,
      flags: flags.length > 0 ? flags : ['none'],
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Your inquiry has been submitted successfully. We will get back to you soon!'
      // Removed inquiry.id for security
    });

  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({
      message: 'Failed to submit inquiry. Please try again later.'
    });
  }
});

// Admin routes (require authentication)
router.use(requireAuth);

// Get all inquiries with pagination and filtering
router.get('/', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      status = '',
      priority = '',
      assignedTo = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Build where clause for filtering
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (assignedTo) {
      whereClause.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
    }

    // Valid sort columns
    const validSortColumns = ['created_at', 'updated_at', 'name', 'email', 'status', 'priority'];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await Inquiry.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'resolvedByUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [[orderBy, order]],
      offset,
      limit
    });

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        pages: Math.ceil(count / parseInt(pageSize))
      }
    });

  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({
      message: 'Failed to fetch inquiries'
    });
  }
});

// Get inquiry by ID
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'resolvedByUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!inquiry) {
      return res.status(404).json({
        message: 'Inquiry not found'
      });
    }

    res.json(inquiry);

  } catch (error) {
    console.error('Error fetching inquiry:', error);
    res.status(500).json({
      message: 'Failed to fetch inquiry'
    });
  }
});

// Update inquiry
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, priority, assignedTo, adminNotes, resolvedBy } = req.body;
    
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        message: 'Inquiry not found'
      });
    }

    const updateData = {};
    
    if (status !== undefined) {
      updateData.status = status;
      
      // If marking as resolved/closed, set resolved timestamp
      if ((status === 'resolved' || status === 'closed') && !inquiry.resolvedAt) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user.id;
      }
      
      // If reopening, clear resolved data
      if (status === 'new' || status === 'in_progress') {
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo === '' ? null : assignedTo;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (resolvedBy !== undefined) {
      updateData.resolvedBy = resolvedBy === '' ? null : resolvedBy;
    }

    await inquiry.update(updateData);

    // Fetch updated inquiry with associations
    const updatedInquiry = await Inquiry.findByPk(inquiry.id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'resolvedByUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: 'Inquiry updated successfully',
      inquiry: updatedInquiry
    });

  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({
      message: 'Failed to update inquiry'
    });
  }
});

// Delete inquiry
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        message: 'Inquiry not found'
      });
    }

    await inquiry.destroy();

    res.json({
      message: 'Inquiry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({
      message: 'Failed to delete inquiry'
    });
  }
});

// Get inquiry statistics
router.get('/stats/summary', requireAdmin, async (req, res) => {
  try {
    const [
      total,
      newCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      urgentCount,
      highCount
    ] = await Promise.all([
      Inquiry.count(),
      Inquiry.count({ where: { status: 'new' } }),
      Inquiry.count({ where: { status: 'in_progress' } }),
      Inquiry.count({ where: { status: 'resolved' } }),
      Inquiry.count({ where: { status: 'closed' } }),
      Inquiry.count({ where: { priority: 'urgent' } }),
      Inquiry.count({ where: { priority: 'high' } })
    ]);

    res.json({
      total,
      byStatus: {
        new: newCount,
        in_progress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount
      },
      byPriority: {
        urgent: urgentCount,
        high: highCount,
        medium: total - urgentCount - highCount,
        low: 0
      },
      unresolved: newCount + inProgressCount
    });

  } catch (error) {
    console.error('Error fetching inquiry stats:', error);
    res.status(500).json({
      message: 'Failed to fetch inquiry statistics'
    });
  }
});

export default router;
