import { DataTypes, Model } from 'sequelize';

class ProductCategory extends Model {}

export default (sequelize) => {
  ProductCategory.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING(16), allowNull: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    shortDescription: { type: DataTypes.TEXT, allowNull: true },
    longDescription: { type: DataTypes.TEXT, allowNull: true },
    heroImageUrl: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('active','coming_soon','archived'), allowNull: false, defaultValue: 'active' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    seoMeta: { type: DataTypes.JSONB, allowNull: true }
  }, { sequelize, modelName: 'ProductCategory', tableName: 'product_categories', timestamps: true });
  return ProductCategory;
};
