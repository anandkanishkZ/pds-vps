import { DataTypes, Model } from 'sequelize';

class HeroSlide extends Model {}

export default (sequelize) => {
  HeroSlide.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.STRING, allowNull: true },
    subtitle: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.TEXT, allowNull: false },
    mobileImageUrl: { type: DataTypes.TEXT, allowNull: true },
    altText: { type: DataTypes.STRING, allowNull: true },
    ctaLabel: { type: DataTypes.STRING, allowNull: true },
    ctaUrl: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('active', 'draft', 'archived'), allowNull: false, defaultValue: 'active' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true }
  }, { sequelize, modelName: 'HeroSlide', tableName: 'hero_slides', timestamps: true });
  return HeroSlide;
};
