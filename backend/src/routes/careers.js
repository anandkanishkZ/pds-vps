import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import { 
  JobPosting, 
  JobApplication, 
  Interview, 
  ApplicationTimeline, 
  User 
} from '../models/index.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { sendEmail } from '../utils/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  }
});

// Public routes
// Get all active job postings
router.get('/jobs', async (req, res) => {
  try {
    const { department, type, location, search } = req.query;
    
    const where = { isActive: true };
    
    if (department && department !== 'all') {
      where.department = department;
    }
    
    if (type) {
      where.jobType = type;
    }
    
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const jobs = await JobPosting.findAll({
      where,
      order: [['isHot', 'DESC'], ['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name']
      }]
    });
    
    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job posting
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await JobPosting.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name']
      }]
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Submit job application
router.post('/applications', upload.single('resume'), async (req, res) => {
  try {
    const {
      jobPostingId,
      applicantName,
      email,
      phone,
      experience,
      coverLetter,
      linkedInProfile,
      portfolioUrl,
      currentSalary,
      expectedSalary,
      noticePeriod
    } = req.body;
    
    // Validate required fields
    if (!jobPostingId || !applicantName || !email || !phone || !experience) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if job exists
    const job = await JobPosting.findByPk(jobPostingId);
    if (!job || !job.isActive) {
      return res.status(404).json({ error: 'Job posting not found or inactive' });
    }
    
    // Check if application deadline has passed
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }
    
    // Check for duplicate applications
    const existingApplication = await JobApplication.findOne({
      where: { jobPostingId, email }
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }
    
    let resumeUrl = null;
    let resumeFileName = null;
    
    if (req.file) {
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
      resumeFileName = req.file.originalname;
    }
    
    // Create application
    const application = await JobApplication.create({
      jobPostingId,
      applicantName,
      email,
      phone,
      experience,
      coverLetter,
      resumeUrl,
      resumeFileName,
      linkedInProfile,
      portfolioUrl,
      currentSalary,
      expectedSalary,
      noticePeriod,
      appliedAt: new Date()
    });
    
    // Create timeline entry
    await ApplicationTimeline.create({
      applicationId: application.id,
      action: 'application_submitted',
      description: `Application submitted for ${job.title}`,
      metadata: { jobTitle: job.title, department: job.department }
    });
    
    // Send confirmation email (if email service is configured)
    try {
      await sendEmail({
        to: email,
        subject: `Application Received - ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #06477f;">Thank you for your application!</h2>
            <p>Dear ${applicantName},</p>
            <p>We have received your application for the position of <strong>${job.title}</strong> at Power Drive Solution.</p>
            <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0;">Application Details:</h3>
              <p><strong>Position:</strong> ${job.title}</p>
              <p><strong>Department:</strong> ${job.department}</p>
              <p><strong>Applied on:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Our HR team will review your application and get back to you within 5-7 business days.</p>
            <p>Best regards,<br>Power Drive Solution HR Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Alternative endpoint for frontend compatibility - handles simpler form structure
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      experience,
      coverLetter
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !position || !experience) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For general applications, find or create a "General Application" job posting
    let job = await JobPosting.findOne({ 
      where: { title: 'General Application', isActive: true } 
    });
    
    if (!job) {
      // Find an existing user to assign as creator
      let createdBy = '25f4bb93-9d27-4409-9320-5ac5901e4234'; // Use existing admin user ID
      
      try {
        const existingUser = await User.findOne({ 
          where: { role: 'admin' },
          limit: 1 
        });
        if (existingUser) {
          createdBy = existingUser.id;
        }
      } catch (userError) {
        console.log('Using default admin user ID');
      }

      // Create a default "General Application" job posting
      job = await JobPosting.create({
        title: 'General Application',
        department: 'HR',
        location: 'Various Locations',
        jobType: 'full-time',
        experienceLevel: 'Any Level',
        description: 'General application for future opportunities. We welcome applications from candidates with diverse backgrounds and experience levels.',
        requirements: ['Open to various skill sets', 'Professional attitude', 'Willingness to learn'],
        benefits: ['Competitive salary', 'Professional development', 'Team environment'],
        isActive: true,
        createdBy
      });
    }
    
    // Check for duplicate applications
    const existingApplication = await JobApplication.findOne({
      where: { jobPostingId: job.id, email }
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already submitted a general application' });
    }
    
    let resumeUrl = null;
    let resumeFileName = null;
    
    if (req.file) {
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
      resumeFileName = req.file.originalname;
    }
    
    // Create application with mapped field names
    const application = await JobApplication.create({
      jobPostingId: job.id,
      applicantName: name,
      email,
      phone,
      experience,
      coverLetter,
      resumeUrl,
      resumeFileName,
      appliedAt: new Date()
    });
    
    // Create timeline entry
    await ApplicationTimeline.create({
      applicationId: application.id,
      action: 'application_submitted',
      description: `General application submitted by ${name}`,
      metadata: { 
        jobTitle: job.title, 
        department: job.department,
        positionAppliedFor: position 
      }
    });
    
    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: `Application Received - ${position}`,
        html: `
          <h2>Thank you for your application!</h2>
          <p>Dear ${name},</p>
          <p>We have received your application for the position of <strong>${position}</strong>.</p>
          <p>Our HR team will review your application and get back to you soon.</p>
          <p>Best regards,<br>Power Drive Solution Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.name,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to submit application',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin routes (require authentication)
// Get all job postings for admin
router.get('/admin/jobs', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    if (department && department !== 'all') {
      where.department = department;
    }
    
    const { count, rows: jobs } = await JobPosting.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['name', 'email']
        },
        {
          model: JobApplication,
          as: 'applications',
          attributes: ['id', 'status'],
          separate: true
        }
      ]
    });
    
    // Add application stats to each job
    const jobsWithStats = jobs.map(job => {
      const applications = job.applications || [];
      const stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        reviewing: applications.filter(app => app.status === 'reviewing').length,
        shortlisted: applications.filter(app => app.status === 'shortlisted').length,
        hired: applications.filter(app => app.status === 'hired').length
      };
      
      return {
        ...job.toJSON(),
        applicationStats: stats
      };
    });
    
    res.json({
      jobs: jobsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Create new job posting
router.post('/admin/jobs', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const job = await JobPosting.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    const jobWithCreator = await JobPosting.findByPk(job.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });
    
    res.status(201).json({ job: jobWithCreator });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job posting' });
  }
});

// Update job posting
router.put('/admin/jobs/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const job = await JobPosting.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await job.update(req.body);
    
    const updatedJob = await JobPosting.findByPk(job.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });
    
    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job posting' });
  }
});

// Delete job posting
router.delete('/admin/jobs/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const job = await JobPosting.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await job.destroy();
    res.json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job posting' });
  }
});

// Get all applications for admin
router.get('/admin/applications', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, jobId, search } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    
    if (jobId) {
      where.jobPostingId = jobId;
    }
    
    if (search) {
      where[Op.or] = [
        { applicantName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const { count, rows: applications } = await JobApplication.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['appliedAt', 'DESC']],
      include: [
        {
          model: JobPosting,
          as: 'jobPosting',
          attributes: ['id', 'title', 'department', 'location']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['name', 'email']
        },
        {
          model: Interview,
          as: 'interviews',
          separate: true,
          order: [['scheduledAt', 'DESC']]
        }
      ]
    });
    
    res.json({
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application with full details
router.get('/admin/applications/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const application = await JobApplication.findByPk(req.params.id, {
      include: [
        {
          model: JobPosting,
          as: 'jobPosting',
          attributes: ['id', 'title', 'department', 'location', 'requirements', 'benefits']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['name', 'email']
        },
        {
          model: Interview,
          as: 'interviews',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['name', 'email']
          }]
        },
        {
          model: ApplicationTimeline,
          as: 'timeline',
          include: [{
            model: User,
            as: 'performer',
            attributes: ['name', 'email']
          }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ application });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Update application status
router.put('/admin/applications/:id/status', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { status, notes, rating, priority } = req.body;
    
    const application = await JobApplication.findByPk(req.params.id, {
      include: [{
        model: JobPosting,
        as: 'jobPosting',
        attributes: ['title', 'department']
      }]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const oldStatus = application.status;
    
    // Update application
    await application.update({
      status,
      notes,
      rating,
      priority,
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    });
    
    // Create timeline entry
    let description = `Status changed from ${oldStatus} to ${status}`;
    let action = 'status_changed';
    
    if (status === 'shortlisted') {
      action = 'application_shortlisted';
      description = `Application shortlisted for ${application.jobPosting.title}`;
    } else if (status === 'rejected') {
      action = 'application_rejected';
      description = `Application rejected for ${application.jobPosting.title}`;
    } else if (status === 'hired') {
      action = 'candidate_hired';
      description = `Candidate hired for ${application.jobPosting.title}`;
    }
    
    await ApplicationTimeline.create({
      applicationId: application.id,
      action,
      description,
      metadata: { 
        oldStatus, 
        newStatus: status, 
        rating,
        priority 
      },
      performedBy: req.user.id
    });
    
    // Send status update email to candidate
    try {
      let emailSubject = `Application Update - ${application.jobPosting.title}`;
      let emailContent = '';
      
      switch (status) {
        case 'reviewing':
          emailContent = `
            <p>Good news! Your application for <strong>${application.jobPosting.title}</strong> is currently being reviewed by our team.</p>
            <p>We'll keep you updated on the progress.</p>
          `;
          break;
        case 'shortlisted':
          emailContent = `
            <p>Congratulations! You have been shortlisted for the position of <strong>${application.jobPosting.title}</strong>.</p>
            <p>Our team will contact you soon to schedule an interview.</p>
          `;
          break;
        case 'interview-scheduled':
          emailContent = `
            <p>Your interview has been scheduled for the position of <strong>${application.jobPosting.title}</strong>.</p>
            <p>Please check your email for detailed interview information.</p>
          `;
          break;
        case 'offered':
          emailContent = `
            <p>Congratulations! We are pleased to extend a job offer for the position of <strong>${application.jobPosting.title}</strong>.</p>
            <p>Our HR team will contact you with detailed offer information.</p>
          `;
          break;
        case 'hired':
          emailContent = `
            <p>Welcome to Power Drive Solution! We're excited to have you join our team as <strong>${application.jobPosting.title}</strong>.</p>
            <p>You'll receive onboarding information from our HR team soon.</p>
          `;
          break;
        case 'rejected':
          emailContent = `
            <p>Thank you for your interest in the position of <strong>${application.jobPosting.title}</strong>.</p>
            <p>While we were impressed with your background, we have decided to move forward with other candidates at this time.</p>
            <p>We encourage you to apply for future opportunities that match your skills and experience.</p>
          `;
          break;
      }
      
      if (emailContent) {
        await sendEmail({
          to: application.email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #06477f;">Application Status Update</h2>
              <p>Dear ${application.applicantName},</p>
              ${emailContent}
              <p>Best regards,<br>Power Drive Solution HR Team</p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }
    
    res.json({ 
      message: 'Application status updated successfully',
      application: {
        id: application.id,
        status: application.status,
        rating: application.rating,
        priority: application.priority
      }
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Add note to application
router.post('/admin/applications/:id/notes', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    
    const application = await JobApplication.findByPk(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Create timeline entry
    await ApplicationTimeline.create({
      applicationId: application.id,
      action: 'note_added',
      description: note.trim(),
      performedBy: req.user.id
    });
    
    res.json({ message: 'Note added successfully' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Schedule interview
router.post('/admin/applications/:id/interviews', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const {
      type,
      round,
      scheduledAt,
      duration,
      interviewerIds,
      location,
      meetingLink,
      notes
    } = req.body;
    
    const application = await JobApplication.findByPk(req.params.id, {
      include: [{
        model: JobPosting,
        as: 'jobPosting',
        attributes: ['title', 'department']
      }]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Create interview
    const interview = await Interview.create({
      applicationId: application.id,
      type,
      round,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      interviewerIds: interviewerIds || [],
      location,
      meetingLink,
      notes,
      createdBy: req.user.id
    });
    
    // Update application status
    await application.update({
      status: 'interview-scheduled',
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    });
    
    // Create timeline entry
    await ApplicationTimeline.create({
      applicationId: application.id,
      action: 'interview_scheduled',
      description: `${type} interview scheduled for round ${round}`,
      metadata: { 
        interviewId: interview.id,
        type,
        round,
        scheduledAt 
      },
      performedBy: req.user.id
    });
    
    // Send interview email to candidate
    try {
      const interviewDate = new Date(scheduledAt).toLocaleDateString();
      const interviewTime = new Date(scheduledAt).toLocaleTimeString();
      
      await sendEmail({
        to: application.email,
        subject: `Interview Scheduled - ${application.jobPosting.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #06477f;">Interview Scheduled</h2>
            <p>Dear ${application.applicantName},</p>
            <p>We're pleased to schedule an interview for your application for the position of <strong>${application.jobPosting.title}</strong>.</p>
            <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0;">Interview Details:</h3>
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Round:</strong> ${round}</p>
              <p><strong>Date:</strong> ${interviewDate}</p>
              <p><strong>Time:</strong> ${interviewTime}</p>
              <p><strong>Duration:</strong> ${duration} minutes</p>
              ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
            </div>
            <p>Please confirm your availability and let us know if you have any questions.</p>
            <p>Best regards,<br>Power Drive Solution HR Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send interview email:', emailError);
    }
    
    res.status(201).json({ 
      message: 'Interview scheduled successfully',
      interview: {
        id: interview.id,
        type: interview.type,
        round: interview.round,
        scheduledAt: interview.scheduledAt
      }
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// Get career statistics for dashboard
router.get('/admin/stats', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const stats = await Promise.all([
      JobPosting.count({ where: { isActive: true } }),
      JobPosting.count({ where: { isActive: false } }),
      JobApplication.count(),
      JobApplication.count({ where: { status: 'pending' } }),
      JobApplication.count({ where: { status: 'shortlisted' } }),
      JobApplication.count({ where: { status: 'hired' } }),
      Interview.count({ where: { status: 'scheduled' } }),
      Interview.count({ where: { status: 'completed' } })
    ]);
    
    const [
      activeJobs,
      inactiveJobs,
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      hiredCandidates,
      scheduledInterviews,
      completedInterviews
    ] = stats;
    
    // Get recent applications
    const recentApplications = await JobApplication.findAll({
      limit: 5,
      order: [['appliedAt', 'DESC']],
      include: [{
        model: JobPosting,
        as: 'jobPosting',
        attributes: ['title', 'department']
      }]
    });
    
    // Get department-wise application stats
    const departmentStats = await JobApplication.findAll({
      attributes: [
        'jobPosting.department',
        [JobApplication.sequelize.fn('COUNT', JobApplication.sequelize.col('JobApplication.id')), 'count']
      ],
      include: [{
        model: JobPosting,
        as: 'jobPosting',
        attributes: []
      }],
      group: ['jobPosting.department'],
      raw: true
    });
    
    res.json({
      overview: {
        activeJobs,
        inactiveJobs,
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        hiredCandidates,
        scheduledInterviews,
        completedInterviews
      },
      recentApplications,
      departmentStats
    });
  } catch (error) {
    console.error('Error fetching career stats:', error);
    res.status(500).json({ error: 'Failed to fetch career statistics' });
  }
});

export default router;
