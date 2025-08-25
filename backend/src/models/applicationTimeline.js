import { DataTypes } from 'sequelize';

export default function ApplicationTimelineModel(sequelize) {
  const ApplicationTimeline = sequelize.define('ApplicationTimeline', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM(
        'application_submitted',
        'application_reviewed',
        'application_shortlisted',
        'interview_scheduled',
        'interview_completed',
        'interview_cancelled',
        'offer_made',
        'offer_accepted',
        'offer_rejected',
        'application_rejected',
        'candidate_hired',
        'status_changed',
        'note_added'
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'application_timeline',
    timestamps: true,
    updatedAt: false, // Only track creation time
  });

  return ApplicationTimeline;
}
