import { DataTypes } from 'sequelize';

export default function JobApplicationModel(sequelize) {
  const JobApplication = sequelize.define('JobApplication', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    jobPostingId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    applicantName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resumeFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'shortlisted', 'interview-scheduled', 'interviewed', 'offered', 'hired', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    linkedInProfile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    portfolioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentSalary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expectedSalary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    noticePeriod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    appliedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'job_applications',
    timestamps: true,
  });

  return JobApplication;
}
