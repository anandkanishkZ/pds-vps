import { DataTypes, Model } from 'sequelize';

class User extends Model {}

export default (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      },
      status: {
        // Include 'blocked' logically (enum extended via migration)
        type: DataTypes.ENUM('active', 'inactive', 'pending', 'blocked'),
        allowNull: false,
        defaultValue: 'active'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      // Additional profile fields
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatar: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      // Administrative metadata
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      blockedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      blockedUntil: {
        type: DataTypes.DATE,
        allowNull: true
      },
      // Notification preferences
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      pushNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      smsNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      marketingEmails: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      securityAlerts: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      systemUpdates: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      weeklyReports: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      instantAlerts: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      // Security settings
      twoFactorAuth: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      loginAlerts: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sessionTimeout: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30 // minutes
      },
      passwordExpiry: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 90 // days
      },
      // Theme preference
      theme: {
        type: DataTypes.ENUM('light', 'dark', 'system'),
        allowNull: false,
        defaultValue: 'system'
      },
      // System preferences
      timezone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'UTC'
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en'
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['email'] }
      ]
    }
  );

  return User;
};
