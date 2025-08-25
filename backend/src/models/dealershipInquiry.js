import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const DealershipInquiry = sequelize.define('DealershipInquiry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'company_name',
      validate: { notEmpty: true, len: [2, 150] }
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'contact_person',
      validate: { notEmpty: true, len: [2, 150] }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true, notEmpty: true }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 30] }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 150] }
    },
    businessType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'business_type'
    },
    yearsInBusiness: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'years_in_business'
    },
    currentBrands: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'current_brands'
    },
    monthlyVolume: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'monthly_volume'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: { len: [0, 5000] }
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
    tableName: 'dealership_inquiries',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['created_at'] },
      { fields: ['email'] },
      { fields: ['assigned_to'] },
      { fields: ['company_name'] }
    ]
  });

  DealershipInquiry.associate = function(models) {
    DealershipInquiry.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignedUser' });
    DealershipInquiry.belongsTo(models.User, { foreignKey: 'resolvedBy', as: 'resolvedByUser' });
  };

  return DealershipInquiry;
}
