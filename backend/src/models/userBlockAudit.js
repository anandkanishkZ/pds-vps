import { DataTypes, Model } from 'sequelize';

class UserBlockAudit extends Model {}

export default (sequelize) => {
  UserBlockAudit.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.UUID, allowNull: false },
    actingUserId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.ENUM('block','unblock','extend'), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    previousBlockedUntil: { type: DataTypes.DATE, allowNull: true },
    newBlockedUntil: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'UserBlockAudit',
    tableName: 'user_block_audits',
    timestamps: true
  });
  return UserBlockAudit;
};
