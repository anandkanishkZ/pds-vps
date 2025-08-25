import { DataTypes, Model } from 'sequelize';

class Product extends Model {}

export default (sequelize) => {
  Product.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    categoryId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    shortDescription: { type: DataTypes.TEXT, allowNull: true },
    longDescription: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
    viscosity: { type: DataTypes.STRING, allowNull: true },
    apiGrade: { type: DataTypes.STRING, allowNull: true },
    healthSafety: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    meta: { type: DataTypes.JSONB, allowNull: true }
  }, { sequelize, modelName: 'Product', tableName: 'products', timestamps: true });
  return Product;
};
