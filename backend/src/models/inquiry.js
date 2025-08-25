import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 20]
      }
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 200]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 5000]
      }
    },
    status: {
      type: DataTypes.ENUM('new', 'in_progress', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'new'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'website'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'resolved_by'
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'metadata'
    }
  }, {
    tableName: 'inquiries',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['created_at'] },
      { fields: ['email'] },
      { fields: ['assigned_to'] }
    ]
  });

  Inquiry.associate = function(models) {
    // Association with User model for assigned_to
    Inquiry.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignedUser'
    });
    
    // Association with User model for resolved_by
    Inquiry.belongsTo(models.User, {
      foreignKey: 'resolvedBy',
      as: 'resolvedByUser'
    });
  };

  return Inquiry;
}
