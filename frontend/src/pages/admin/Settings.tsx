import React, { useState, useEffect } from 'react';
import { 
  Save, 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Database, 
  Camera,
  Moon,
  Sun,
  Monitor,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  auth, 
  getProfile, 
  updateProfile, 
  updateNotifications, 
  updateSecurity, 
  updateTheme as apiUpdateTheme, 
  changePassword, 
  getActivity, 
  exportUserData, 
  deleteAccount,
  uploadAvatar,
  type UserProfile,
  type NotificationSettings,
  type SecuritySettings,
  type Activity
} from '../../lib/api';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SystemSettings {
  maintenanceMode: boolean;
  debugMode: boolean;
  analyticsEnabled: boolean;
  backupEnabled: boolean;
  cacheEnabled: boolean;
  compressionEnabled: boolean;
  rateLimitEnabled: boolean;
  sslEnabled: boolean;
}

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states from API - underscore prefix to indicate intentional unused variables for state management
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [_notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [_securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Local form states for editing
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [notificationForm, setNotificationForm] = useState<Partial<NotificationSettings>>({});
  const [securityForm, setSecurityForm] = useState<Partial<SecuritySettings>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // System settings (local only for demo)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    debugMode: false,
    analyticsEnabled: true,
    backupEnabled: true,
    cacheEnabled: true,
    compressionEnabled: false,
    rateLimitEnabled: true,
    sslEnabled: true,
  });

  // Load data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [profileData, activityData] = await Promise.all([
        getProfile(token),
        getActivity(token)
      ]);

      setUserProfile(profileData.profile);
      setNotificationSettings(profileData.notifications);
      setSecuritySettings(profileData.security);
      setActivities(activityData.activities);

      // Initialize forms with current data
      setProfileForm(profileData.profile);
      setNotificationForm(profileData.notifications);
      setSecurityForm(profileData.security);
    } catch (error) {
      console.error('Failed to load user data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user data';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading your settings...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Failed to load settings</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading settings</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={loadUserData}
                  className="text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const settingSections: SettingSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your personal information and profile settings',
      icon: User,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control how and when you receive notifications',
      icon: Bell,
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Manage your account security and privacy settings',
      icon: Shield,
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel of your dashboard',
      icon: Palette,
    },
    {
      id: 'system',
      title: 'System',
      description: 'Configure system-wide settings and preferences',
      icon: Database,
    }
  ];

  const handleSave = async (section: string) => {
    try {
      setSaveStatus('saving');
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');

      switch (section) {
        case 'profile':
          if (profileForm) {
            const result = await updateProfile(token, profileForm);
            setUserProfile(result.profile);
            setProfileForm(result.profile);
          }
          break;
        case 'notifications':
          if (notificationForm) {
            const result = await updateNotifications(token, notificationForm);
            setNotificationSettings(result.notifications);
            setNotificationForm(result.notifications);
          }
          break;
        case 'security':
          if (securityForm) {
            const result = await updateSecurity(token, securityForm);
            setSecuritySettings(result.security);
            setSecurityForm(result.security);
          }
          break;
        case 'appearance':
          if (profileForm.theme) {
            await apiUpdateTheme(token, profileForm.theme);
            // Update local theme context
            if (profileForm.theme !== 'system') {
              // You might need to update this based on your theme context implementation
            }
          }
          break;
      }

      setSaveStatus('success');
      toast.success('Settings saved successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to save settings', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setSaveStatus('saving');
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');

      await changePassword(
        token, 
        passwordForm.currentPassword, 
        passwordForm.newPassword, 
        passwordForm.confirmPassword
      );

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
      setSaveStatus('success');
      toast.success('Password changed successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Password change error:', error);
      setSaveStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to change password', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleExportData = async () => {
    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');

      toast.info('Preparing your data export...', {
        position: "top-right",
        autoClose: 2000,
      });

      const blob = await exportUserData(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${userProfile?.id || 'export'}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.', {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const confirmText = 'DELETE';
      const userConfirmation = prompt(
        `Are you sure you want to delete your account? This action cannot be undone.\n\nType "${confirmText}" to confirm:`
      );
      
      if (userConfirmation !== confirmText) {
        toast.warning('Account deletion cancelled.', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const password = prompt('Enter your password to confirm account deletion:');
      if (!password) {
        toast.warning('Account deletion cancelled.', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');

      toast.info('Deleting account...', {
        position: "top-right",
        autoClose: 2000,
      });

      await deleteAccount(token, password);
      
      toast.success('Account deleted successfully. Redirecting...', {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        auth.clear();
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account. Please try again.', {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Profile Information</h3>
        
        {/* Avatar Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
      {profileForm.avatar ? (
              <img
        src={profileForm.avatar.startsWith('/') ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '') + profileForm.avatar : profileForm.avatar}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-800"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white dark:ring-slate-800">
                {profileForm.name?.charAt(0) || 'A'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              <Camera className={`h-4 w-4 ${avatarUploading ? 'animate-pulse' : ''}`} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  toast.error('Image must be 2MB or smaller');
                  return;
                }
                try {
                  setAvatarUploading(true);
                  const token = auth.getToken();
                  if (!token) throw new Error('Not authenticated');
                  const { avatar } = await uploadAvatar(token, file);
                  setProfileForm({ ...profileForm, avatar });
                  setUserProfile(prev => prev ? { ...prev, avatar } : prev);
                  // Notify other UI (e.g., AdminLayout) about avatar update
                  window.dispatchEvent(new CustomEvent('pds-avatar-updated', { detail: { avatar } }));
                  toast.success('Avatar updated');
                } catch (err) {
                  console.error(err);
                  toast.error(err instanceof Error ? err.message : 'Upload failed');
                } finally {
                  setAvatarUploading(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Profile Photo</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Update your profile picture (PNG, JPG, WEBP &lt; 2MB)</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileForm.name || ''}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profileForm.email || ''}
              disabled
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={profileForm.phone || ''}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Department
            </label>
            <input
              type="text"
              value={profileForm.department || ''}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={profileForm.location || ''}
              onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role
            </label>
            <input
              type="text"
              value={profileForm.role || ''}
              disabled
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            value={profileForm.bio || ''}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      {/* Password Change Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Password</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Change your account password</p>
          </div>
          <button
            onClick={() => setShowPasswordFields(!showPasswordFields)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {showPasswordFields ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordFields && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Notification Preferences</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Choose how you want to be notified about important updates and activities.
        </p>

        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
            { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
            { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
            { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional emails and updates' },
            { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security-related notifications' },
            { key: 'systemUpdates', label: 'System Updates', description: 'Notifications about system maintenance and updates' },
            { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly activity summaries' },
            { key: 'instantAlerts', label: 'Instant Alerts', description: 'Real-time notifications for urgent matters' },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">{label}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationForm[key as keyof NotificationSettings] || false}
                  onChange={(e) => setNotificationForm({ ...notificationForm, [key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Security Settings</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Manage your account security and access controls.
        </p>

        <div className="space-y-6">
          {/* Security Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityForm.twoFactorAuth || false}
                  onChange={(e) => setSecurityForm({ ...securityForm, twoFactorAuth: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Login Alerts</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when someone logs into your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityForm.loginAlerts || false}
                  onChange={(e) => setSecurityForm({ ...securityForm, loginAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
              </label>
            </div>
          </div>

          {/* Session Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Session Timeout (minutes)
              </label>
              <select
                value={securityForm.sessionTimeout || 30}
                onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password Expiry (days)
              </label>
              <select
                value={securityForm.passwordExpiry || 90}
                onChange={(e) => setSecurityForm({ ...securityForm, passwordExpiry: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Recent Activity</h4>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex-shrink-0">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.action}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{activity.description}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(activity.timestamp).toLocaleString()} • {activity.device} • {activity.ip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Appearance</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Customize how the interface looks and feels.
        </p>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Theme</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setProfileForm({ ...profileForm, theme: value as 'light' | 'dark' | 'system' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    (profileForm.theme || userProfile?.theme) === value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Language
            </label>
            <select
              value={profileForm.language || userProfile?.language || 'en'}
              onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          {/* Timezone Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Timezone
            </label>
            <select
              value={profileForm.timezone || userProfile?.timezone || 'UTC'}
              onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="America/Chicago">Central Time (US & Canada)</option>
              <option value="America/Denver">Mountain Time (US & Canada)</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
              <option value="Asia/Kolkata">Mumbai</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">System Settings</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Configure system-wide settings and data management.
        </p>

        <div className="space-y-6">
          {/* System Toggles */}
          <div className="space-y-4">
            {[
              { key: 'analyticsEnabled', label: 'Analytics', description: 'Enable usage analytics and reporting' },
              { key: 'backupEnabled', label: 'Automatic Backups', description: 'Automatically backup your data' },
              { key: 'cacheEnabled', label: 'Cache', description: 'Enable caching for better performance' },
              { key: 'compressionEnabled', label: 'Data Compression', description: 'Compress data to save storage space' },
              { key: 'rateLimitEnabled', label: 'Rate Limiting', description: 'Enable API rate limiting' },
              { key: 'sslEnabled', label: 'SSL/TLS', description: 'Force HTTPS connections' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">{label}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings[key as keyof SystemSettings]}
                    onChange={(e) => setSystemSettings({ ...systemSettings, [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
                </label>
              </div>
            ))}
          </div>

          {/* Data Management */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Data Management</h4>
            <div className="space-y-4">
              <button
                onClick={handleExportData}
                className="flex items-center space-x-3 w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="h-5 w-5 text-brand-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Download all your account data</p>
                </div>
              </button>

              <button
                onClick={handleDeleteAccount}
                className="flex items-center space-x-3 w-full p-4 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-5 w-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-sm opacity-75">Permanently delete your account and all data</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'system':
        return renderSystemSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {settingSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">{section.title}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            {renderContent()}

            {/* Save Button */}
            {activeSection !== 'system' && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Changes are saved automatically
                </div>
                <button
                  onClick={() => handleSave(activeSection)}
                  disabled={saveStatus === 'saving'}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    saveStatus === 'saving'
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : saveStatus === 'success'
                      ? 'bg-emerald-600 text-white'
                      : saveStatus === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-brand-600 hover:bg-brand-700 text-white'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : saveStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : saveStatus === 'error' ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>
                    {saveStatus === 'saving'
                      ? 'Saving...'
                      : saveStatus === 'success'
                      ? 'Saved!'
                      : saveStatus === 'error'
                      ? 'Error'
                      : 'Save Changes'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
