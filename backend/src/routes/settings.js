import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { authMiddleware } from './auth.js';
import config from '../config.js';

const router = express.Router();

// Multer storage for avatars
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user?.sub || 'user'}-${Date.now()}${ext}`);
  }
});
const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error('Invalid file type'));
};
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter
});

// Get user profile and settings
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.sub, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const avatarUrl = user.avatar ? `/uploads/avatars/${user.avatar}` : null;
    res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: avatarUrl,
        avatarFilename: user.avatar || null,
        department: user.department,
        location: user.location,
        bio: user.bio,
        joinDate: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        theme: user.theme,
        timezone: user.timezone,
        language: user.language
      },
      notifications: {
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        smsNotifications: user.smsNotifications,
        marketingEmails: user.marketingEmails,
        securityAlerts: user.securityAlerts,
        systemUpdates: user.systemUpdates,
        weeklyReports: user.weeklyReports,
        instantAlerts: user.instantAlerts
      },
      security: {
        twoFactorAuth: user.twoFactorAuth,
        loginAlerts: user.loginAlerts,
        sessionTimeout: user.sessionTimeout,
        passwordExpiry: user.passwordExpiry
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', [
  authMiddleware,
  body('name').optional().isString().isLength({ min: 2, max: 100 }),
  body('phone').optional().isString().isLength({ max: 20 }),
  body('department').optional().isString().isLength({ max: 100 }),
  body('location').optional().isString().isLength({ max: 100 }),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('timezone').optional().isString().isLength({ max: 50 }),
  body('language').optional().isString().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, phone, department, location, bio, timezone, language } = req.body;
    
    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(department !== undefined && { department }),
      ...(location !== undefined && { location }),
      ...(bio !== undefined && { bio }),
      ...(timezone !== undefined && { timezone }),
      ...(language !== undefined && { language })
    });

    const avatarUrl = user.avatar ? `/uploads/avatars/${user.avatar}` : null;
    res.json({ 
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: avatarUrl,
        avatarFilename: user.avatar || null,
        department: user.department,
        location: user.location,
        bio: user.bio,
        joinDate: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        theme: user.theme,
        timezone: user.timezone,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update avatar
router.put('/avatar', [
  authMiddleware,
  body('avatar').isString().isLength({ max: 10000 }) // Base64 image string
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { avatar } = req.body;
    
    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

  // If a data URL was sent, we keep it for backward compatibility (not recommended).
  // Better to use the multipart upload endpoint.
  await user.update({ avatar });
  const avatarFilename = user.avatar;
  const avatarUrl = avatarFilename && !avatar.startsWith('data:') ? `/uploads/avatars/${avatarFilename}` : avatar;
  res.json({ message: 'Avatar updated successfully', avatar: avatarUrl, avatarFilename });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
});

// Upload avatar via multipart/form-data
router.post('/avatar/upload', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findByPk(req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
  const filename = path.basename(req.file.path);
  await user.update({ avatar: filename });
  res.json({ message: 'Avatar uploaded successfully', avatar: `/uploads/avatars/${filename}`, avatarFilename: filename });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// Update notification settings
router.put('/notifications', [
  authMiddleware,
  body('emailNotifications').optional().isBoolean(),
  body('pushNotifications').optional().isBoolean(),
  body('smsNotifications').optional().isBoolean(),
  body('marketingEmails').optional().isBoolean(),
  body('securityAlerts').optional().isBoolean(),
  body('systemUpdates').optional().isBoolean(),
  body('weeklyReports').optional().isBoolean(),
  body('instantAlerts').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const notificationSettings = req.body;
    
    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update(notificationSettings);

    res.json({ 
      message: 'Notification settings updated successfully',
      notifications: {
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        smsNotifications: user.smsNotifications,
        marketingEmails: user.marketingEmails,
        securityAlerts: user.securityAlerts,
        systemUpdates: user.systemUpdates,
        weeklyReports: user.weeklyReports,
        instantAlerts: user.instantAlerts
      }
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// Update security settings
router.put('/security', [
  authMiddleware,
  body('twoFactorAuth').optional().isBoolean(),
  body('loginAlerts').optional().isBoolean(),
  body('sessionTimeout').optional().isInt({ min: 5, max: 480 }), // 5 minutes to 8 hours
  body('passwordExpiry').optional().isInt({ min: 30, max: 365 }), // 30 days to 1 year
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const securitySettings = req.body;
    
    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update(securitySettings);

    res.json({ 
      message: 'Security settings updated successfully',
      security: {
        twoFactorAuth: user.twoFactorAuth,
        loginAlerts: user.loginAlerts,
        sessionTimeout: user.sessionTimeout,
        passwordExpiry: user.passwordExpiry
      }
    });
  } catch (error) {
    console.error('Update security error:', error);
    res.status(500).json({ message: 'Failed to update security settings' });
  }
});

// Update theme preference
router.put('/theme', [
  authMiddleware,
  body('theme').isIn(['light', 'dark', 'system'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { theme } = req.body;
    
    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ theme });

    res.json({ 
      message: 'Theme updated successfully',
      theme: user.theme
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ message: 'Failed to update theme' });
  }
});

// Change password
router.put('/password', [
  authMiddleware,
  body('currentPassword').isString().isLength({ min: 6 }),
  body('newPassword').isString().isLength({ min: 6 }),
  body('confirmPassword').isString().isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.security.saltRounds);
    
    await user.update({ 
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Get activity logs (for settings page)
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mock activity data - in a real app, you'd have an activity log table
    const activities = [
      {
        id: '1',
        action: 'Profile Updated',
        description: 'Updated profile information',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        ip: '192.168.1.1',
        device: 'Chrome on Windows'
      },
      {
        id: '2',
        action: 'Login',
        description: 'Successful login',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        ip: '192.168.1.1',
        device: 'Chrome on Windows'
      },
      {
        id: '3',
        action: 'Settings Changed',
        description: 'Updated notification preferences',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        ip: '192.168.1.1',
        device: 'Chrome on Windows'
      },
      {
        id: '4',
        action: 'Password Changed',
        description: 'Password updated successfully',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        ip: '192.168.1.1',
        device: 'Chrome on Windows'
      }
    ];

    res.json({ activities });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

// Export user data (GDPR compliance)
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.sub, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const exportData = {
      profile: user.toJSON(),
      exportedAt: new Date(),
      format: 'JSON'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${user.id}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Failed to export user data' });
  }
});

// Delete user account
router.delete('/account', [
  authMiddleware,
  body('password').isString().isLength({ min: 6 }),
  body('confirmation').equals('DELETE')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { password } = req.body;

    const user = await User.findByPk(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // In production, you might want to soft delete or anonymize data
    await user.update({ 
      isActive: false,
      email: `deleted_${Date.now()}@deleted.local`,
      name: 'Deleted User'
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
