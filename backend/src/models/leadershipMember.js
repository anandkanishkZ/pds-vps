import { DataTypes } from 'sequelize';

export default function LeadershipMemberModel(sequelize) {
  const LeadershipMember = sequelize.define('LeadershipMember', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: true },
    shortBio: { type: DataTypes.TEXT, allowNull: true },
    fullBio: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('active','archived'), allowNull: false, defaultValue: 'active' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    social: { type: DataTypes.JSONB, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'leadership_members',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['sortOrder'] }
    ]
  });
  return LeadershipMember;
}
