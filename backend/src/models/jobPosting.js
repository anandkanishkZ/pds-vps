import { DataTypes } from 'sequelize';

export default function JobPostingModel(sequelize) {
  const JobPosting = sequelize.define('JobPosting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jobType: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship'),
      allowNull: false,
      defaultValue: 'full-time',
    },
    experienceLevel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requirements: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    benefits: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    salaryRange: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isHot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    applicationDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    positionsAvailable: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'job_postings',
    timestamps: true,
  });

  return JobPosting;
}
