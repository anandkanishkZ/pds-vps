import { DataTypes } from 'sequelize';

export default function InterviewModel(sequelize) {
  const Interview = sequelize.define('Interview', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('phone', 'video', 'in-person', 'technical', 'hr'),
      allowNull: false,
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false,
      defaultValue: 60,
    },
    interviewerIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no-show'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    recommendForNextRound: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    conductedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'interviews',
    timestamps: true,
  });

  return Interview;
}
